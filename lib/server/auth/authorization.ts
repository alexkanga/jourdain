import { auth } from "./auth";
import { db } from "@/db/index";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { can, type Capability, type Principal } from "./capabilities";
import { headers as nextHeaders } from "next/headers";

export { can, type Capability, type Principal };

/**
 * getPrincipal() — maps Better Auth session to our Principal type.
 *
 * Reads principalType (NOT Better Auth role) — this is the ONLY place where
 * Better Auth session is mapped to our business Principal.
 *
 * Session propagation:
 * - If `requestHeaders` is explicitly provided (for testability), use them.
 * - Otherwise, read the incoming Next.js request headers via `next/headers`.
 *   This is the canonical Better Auth + Next.js App Router pattern:
 *     `auth.api.getSession({ headers: await headers() })`
 *
 * PREVIOUS DEFECT (WP-002): this function passed `new Headers()` (empty) to
 * `auth.api.getSession()`, discarding the incoming Better Auth session cookie.
 * As a result, `getPrincipal()` always returned null in a server-rendered
 * context, and every protected layout guard redirected to /admin/login.
 *
 * FIX (authorized owner patch, WP-003 remediation): use `await nextHeaders()`
 * to supply the real incoming request headers (including the session cookie)
 * to Better Auth's `getSession()`.
 *
 * Better Auth remains the session authority. No manual cookie decoding, no
 * manual token verification.
 *
 * Authorization semantics are UNCHANGED: principalType (ADMIN | FANTOMAS) is
 * the business authority; Better Auth `role` is NOT used for authorization.
 */
export async function getPrincipal(requestHeaders?: Headers): Promise<Principal | null> {
  const h = requestHeaders ?? (await nextHeaders());
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    return null;
  }

  // Fetch principalType from DB (it's input: false so it's not in the session
  // by default unless Better Auth returns it via additionalFields with
  // returned: true). We read it explicitly to be safe.
  const [userRecord] = await db
    .select({ principalType: users.principalType, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userRecord) {
    return null;
  }

  return {
    id: session.user.id,
    username: userRecord.username,
    principalType: userRecord.principalType as Principal["principalType"],
  };
}

/**
 * requireCapability() — canonical entry point for Server Actions.
 *
 * Throws an authorization error if the principal is not authenticated or
 * lacks the capability.
 *
 * Authorization is based on `principalType` (via `can()`), NOT Better Auth
 * `role`. FANTOMAS inherits all ADMIN capabilities (PERM-004).
 */
export async function requireCapability(capability: Capability): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal) {
    throw new Error("UNAUTHORIZED — not authenticated");
  }
  if (!can(principal, capability)) {
    throw new Error("FORBIDDEN — insufficient capability");
  }
  return principal;
}
