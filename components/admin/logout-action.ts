"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/server/auth/auth";
import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";

/**
 * logoutAction Server Action — admin logout.
 *
 * Calls auth.api.signOut server-side. Better Auth deletes the session
 * record in the DB and clears the cookie. Then redirect to /admin/login.
 *
 * Authenticated: ADMIN or FANTOMAS — the admin layout guard already
 * ensures the caller is authenticated.
 */

export async function logoutAction(): Promise<void> {
  try {
    const h = await nextHeaders();
    await auth.api.signOut({ headers: h });
  } catch (e) {
    // Even if signOut fails server-side, redirect to login (no admin access without re-auth)
    console.error("[logoutAction] signOut error:", e);
  }
  revalidatePath("/admin");
  redirect("/admin/login");
}
