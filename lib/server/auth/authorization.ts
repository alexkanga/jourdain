import { auth } from "./auth";
import { db } from "@/db/index";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { can, type Capability, type Principal } from "./capabilities";
import { headers as nextHeaders } from "next/headers";
import {
  verifyFantomasSessionCookie,
  readFantomasCookie,
} from "./fantomas-auth";

export { can, type Capability, type Principal };

/**
 * getPrincipal() — resolves the current request's business Principal.
 *
 * Identity resolution order (per Fantomas mini-design, OWNER-authorized):
 *   1. valid Fantomas session cookie (HMAC verified via Web Crypto — NO DB,
 *      NO Better Auth) → return FANTOMAS Principal
 *   2. valid Better Auth session (auth.api.getSession + DB users lookup)
 *      → return ADMIN Principal
 *   3. unauthenticated → null
 *
 * Fantomas has priority. Better Auth is NOT called first and does NOT fall
 * back to Fantomas — Fantomas falls THROUGH (down) to Better Auth only when
 * no valid Fantomas session is present.
 *
 * Fantomas branch is DB-free: when Neon/PostgreSQL is unavailable, the
 * Fantomas cookie still verifies (pure Web Crypto HMAC, no I/O) and the
 * FANTOMAS Principal is returned. ADMIN pages whose business content
 * requires PostgreSQL will still fail at the data layer — authentication
 * and principal resolution remain available independently.
 *
 * Session propagation:
 * - If `requestHeaders` is explicitly provided (for testability), use them.
 * - Otherwise, read the incoming Next.js request headers via `next/headers`.
 *
 * Authorization semantics are UNCHANGED: principalType (ADMIN | FANTOMAS)
 * is the business authority; Better Auth `role` is NOT used for authorization.
 */
export async function getPrincipal(requestHeaders?: Headers): Promise<Principal | null> {
  const h = requestHeaders ?? (await nextHeaders());

  // ── 1. Fantomas break-glass (independent of DB / Better Auth) ──────
  // Read the Fantomas cookie directly from the Cookie header (Edge-safe).
  // verifyFantomasSessionCookie does NO DB lookup — pure Web Crypto HMAC.
  // If FANTOMAS_SESSION_SECRET is unset or the cookie is absent/tampered/
  // expired, this returns null and we fall through to Better Auth below.
  const fantomasCookie = readFantomasCookie(h.get("cookie"));
  if (fantomasCookie) {
    const fantomasPrincipal = await verifyFantomasSessionCookie(fantomasCookie);
    if (fantomasPrincipal) {
      return fantomasPrincipal;
    }
    // Invalid/tampered/expired Fantomas cookie → fall through to Better Auth.
    // (A valid Fantomas cookie always wins; an invalid one is ignored, not
    // treated as a session rejection — the user may have a valid Better
    // Auth session instead.)
  }

  // ── 2. Better Auth (DB-backed) — unchanged path ────────────────────
  const session = await auth.api.getSession({ headers: h });
  if (!session || !session.user) {
    return null;
  }

  // Fetch principalType from DB (it's input: false so it's not in the session
  // by default unless Better Auth returns it via additionalField with
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
