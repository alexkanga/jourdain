"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/server/auth/auth";
import { loginSchema } from "@/lib/server/validation/schemas";
import { revalidatePath } from "next/cache";

/**
 * loginAction Server Action — admin username + password login.
 *
 * Authentication itself is permitted BEFORE the user has an authenticated
 * session. There is no circular rule requiring an authenticated capability
 * before sign-in. This action is PUBLIC (no requireCapability call) and
 * delegates entirely to Better Auth (which enforces its own rate limiting
 * and credential verification).
 *
 * Only AFTER successful authentication may an authorized JOURDAIN
 * administrative principal (ADMIN or FANTOMAS) enter the protected admin
 * area. The admin layout guard (getPrincipal) and every privileged Server
 * Action enforce this via getPrincipal() + can().
 *
 * On invalid credentials: returns { ok: false, error: 'Identifiants
 * invalides' } — no information leak about which field was wrong (per
 * FR-001 acceptance).
 */

export type LoginActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function loginAction(
  formData: FormData,
): Promise<LoginActionResult> {
  const raw = {
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Identifiants invalides" };
  }

  try {
    // Better Auth server-side signInUsername — Username plugin endpoint.
    // Throws on invalid credentials; we catch and return a generic error.
    // The body shape is defined by the Username plugin; the auth.api signature
    // is loose-typed for plugin endpoints, so we cast to the expected shape.
    const body: { username: string; password: string } = {
      username: parsed.data.username,
      password: parsed.data.password,
    };
    await auth.api.signInUsername({
      body,
      headers: new Headers(),
    } as Parameters<typeof auth.api.signInUsername>[0]);
    revalidatePath("/admin");
    redirect("/admin/offres");
  } catch (e) {
    // Better Auth throws APIError on invalid credentials. We return a generic
    // "Identifiants invalides" — no information leak about which field was wrong.
    // (Note: redirect() throws in Next.js; we re-check it's not the redirect.)
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) {
      throw e;
    }
    return { ok: false, error: "Identifiants invalides" };
  }
}
