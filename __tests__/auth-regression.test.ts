import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

/**
 * Regression tests for getPrincipal() — the WP-002 defect where
 * getPrincipal() passed empty `new Headers()` to auth.api.getSession(),
 * discarding the incoming Better Auth session cookie.
 *
 * Per owner authorization §6:
 *   A. no request/session: getPrincipal() → null
 *   B. valid Better Auth session headers: getPrincipal() → principal
 *   C. ADMIN session: principalType = ADMIN (via a dedicated temporary ADMIN fixture)
 *   D. FANTOMAS session: principalType = FANTOMAS
 *   E. protected server-side access with authenticated session: accepted
 *   F. protected server-side access without authenticated session: rejected
 *   G. business authorization depends on principalType, not role
 *
 * ─── ADMIN1 IS STRICTLY SUPER_ADMIN ─────────────────────────────────
 * Per user-management final correction #1: admin1 is canonically a
 * SUPER_ADMIN — NOT ADMIN. The earlier "accept ADMIN or SUPER_ADMIN"
 * contract weakened the regression. This file now expects admin1 to be
 * SUPER_ADMIN exactly.
 *
 * For tests that need an ordinary ADMIN (principalType = ADMIN), a
 * dedicated temporary ADMIN fixture is created in beforeAll and cleaned
 * up in afterAll. We do NOT use admin1 as both ADMIN and SUPER_ADMIN.
 *
 * Uses real TEST_DATABASE_URL (no DB mocks per ADR-0008).
 *
 * IMPORTANT: We use auth.handler (not auth.api.signInUsername) to get the
 * SIGNED session cookie from the Set-Cookie response header. The raw token
 * returned by signInUsername is NOT the same as the signed cookie value
 * that getSession() expects — Better Auth signs the cookie with a secret.
 *
 * NOTE: nextHeaders() from next/headers throws when called outside a
 * Next.js request context (e.g., in vitest). Tests A and F verify the
 * "no session" path by passing empty Headers explicitly (bypassing
 * nextHeaders). Tests B-G pass explicit headers with the signed cookie.
 *
 * ─── TEST-HARNESS ENV-IMPORT-ORDER FIX ─────────────────────────────
 * The auth + db module chain (lib/server/auth/auth.ts → drizzleAdapter(db) →
 * db/index.ts Proxy → neon(process.env.DATABASE_URL)) initializes at
 * module-load time when `auth` is imported. If `auth` is imported as a
 * top-level static import, the chain runs BEFORE this test file's body
 * sets `process.env.DATABASE_URL = TEST_URL`, causing `neon()` to receive
 * an empty string and throw "Database connection string format for
 * `neon()` should be: postgresql://...".
 *
 * Fix (TEST HARNESS ONLY — no application runtime change):
 *   1. Establish `process.env.DATABASE_URL = TEST_URL` at the top of the
 *      test file, BEFORE any import that pulls in the auth/db chain.
 *   2. Use dynamic `await import(...)` inside `beforeAll` to load
 *      `auth`, `getPrincipal`, and `can` AFTER the env var is set.
 *   3. Store the dynamically-imported bindings in module-scoped
 *      variables and reference them from each test.
 * This mirrors the proven pattern in __tests__/offers-integration.test.ts
 * (importOffersService) and __tests__/public-offers-integration.test.ts
 * (importPublicOffers) — same env-first-then-import discipline.
 */

function parseEnvLocal(): Record<string, string> {
  const txt = readFileSync("/home/z/my-project/jourdain/.env.local", "utf8");
  const out: Record<string, string> = {};
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    out[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return out;
}

const env = parseEnvLocal();
const TEST_URL = env.TEST_DATABASE_URL!;
if (!TEST_URL) {
  throw new Error("TEST_DATABASE_URL must be set for auth integration tests");
}

// CRITICAL: establish DATABASE_URL BEFORE any import that triggers the
// auth/db module chain (lib/server/auth/auth.ts → drizzleAdapter(db) →
// db/index.ts Proxy → neon(process.env.DATABASE_URL)).
// Without this, the static-import top-level execution of auth.ts would
// call neon() with an empty string and throw at module-load time.
process.env.DATABASE_URL = TEST_URL;

const rawSql = neon(TEST_URL);

// Dynamically-loaded bindings — populated in beforeAll AFTER env is set.
// The auth module chain (auth.ts → drizzleAdapter → db Proxy → neon) only
// initializes when these dynamic imports execute, by which point
// process.env.DATABASE_URL is correctly set to TEST_URL.
type AuthModule = typeof import("@/lib/server/auth/auth");
type AuthzModule = typeof import("@/lib/server/auth/authorization");
let auth: AuthModule["auth"];
let getPrincipal: AuthzModule["getPrincipal"];
let can: AuthzModule["can"];

// ─── Dedicated ordinary-ADMIN fixture ───────────────────────────────
// Per user-management final correction #1: admin1 is canonically a
// SUPER_ADMIN. We do NOT use admin1 to test the "ADMIN session" path.
// Instead, we create a temporary ordinary-ADMIN user (principalType=ADMIN)
// via direct DB insert in beforeAll, use it for the ADMIN tests, and
// delete it in afterAll. The fixture uses Better Auth's hashPassword
// for the credential (same scrypt hashing as a normal sign-up).
const ADMIN_FIXTURE_USERNAME = "um_authreg_admin";
const ADMIN_FIXTURE_EMAIL = "um_authreg_admin@um-test.local";
const ADMIN_FIXTURE_PASSWORD = "AuthRegAdminPass123!";
let adminFixtureId: string | null = null;

beforeAll(async () => {
  // Verify test target reachable
  const r = await rawSql`SELECT 1 AS one`;
  if (!r || r.length === 0) throw new Error("TEST DB not reachable");

  // Dynamic imports — execute AFTER process.env.DATABASE_URL = TEST_URL (set above).
  // This ensures the db Proxy's first call to neon() receives the TEST URL,
  // not an empty string.
  const authMod = await import("@/lib/server/auth/auth");
  const authzMod = await import("@/lib/server/auth/authorization");
  auth = authMod.auth;
  getPrincipal = authzMod.getPrincipal;
  can = authzMod.can;

  // Create the dedicated ordinary-ADMIN fixture via direct DB insert.
  // We use Better Auth's hashPassword for the credential (same scrypt
  // hashing as a normal sign-up), so the fixture can sign in via the
  // real Better Auth sign-in/username endpoint.
  const { hashPassword } = await import("better-auth/crypto");
  const hashedPassword = await hashPassword(ADMIN_FIXTURE_PASSWORD);
  adminFixtureId = randomUUID();
  const now = new Date().toISOString();
  await rawSql`
    INSERT INTO "user" (id, email, email_verified, name, username, display_username, role, banned, principal_type, created_at, updated_at)
    VALUES (${adminFixtureId}, ${ADMIN_FIXTURE_EMAIL}, true, ${ADMIN_FIXTURE_USERNAME}, ${ADMIN_FIXTURE_USERNAME}, ${ADMIN_FIXTURE_USERNAME}, 'user', false, 'ADMIN', ${now}, ${now})
  `;
  const accountId = randomUUID();
  await rawSql`
    INSERT INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
    VALUES (${accountId}, ${adminFixtureId}, ${adminFixtureId}, 'credential', ${hashedPassword}, ${now}, ${now})
  `;
});

afterAll(async () => {
  // Cleanup the dedicated ordinary-ADMIN fixture (cascade will clean up
  // any sessions/accounts).
  if (adminFixtureId) {
    try {
      await rawSql`DELETE FROM "user" WHERE id = ${adminFixtureId}`;
    } catch {
      // ignore — best-effort cleanup
    }
  }
});

// Clear rate limit table before each test to avoid cross-test rate limiting.
// The DB-backed rate limiter persists counts across test runs; clearing it
// before each test ensures each test starts with a clean rate-limit state.
beforeEach(async () => {
  await rawSql`DELETE FROM "rateLimit"`;
});

/**
 * Sign in via auth.handler to get the SIGNED session cookie from the
 * Set-Cookie response header. The signed cookie is what getSession()
 * expects — NOT the raw token from signInUsername.
 */
async function signInAndGetSignedCookie(
  username: string,
  password: string,
): Promise<string> {
  const req = new Request("http://localhost:3000/api/auth/sign-in/username", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const res = await auth.handler(req);
  const setCookie = res.headers.get("set-cookie") || "";
  // Extract "better-auth.session_token=<signed-value>" from the Set-Cookie header
  const cookiePart = setCookie.split(";")[0];
  if (!cookiePart.startsWith("better-auth.session_token=")) {
    throw new Error(`Failed to sign in as ${username}: no session cookie in response`);
  }
  return cookiePart;
}

// Sleep to avoid rate limiting between sign-in attempts
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("getPrincipal() — auth integration regression (real TEST_DATABASE_URL)", () => {
  it("A2. getPrincipal(empty Headers) → null (no session cookie)", async () => {
    // In a test context, we pass explicit empty Headers to avoid
    // nextHeaders() which throws outside Next.js request context.
    const h = new Headers();
    const principal = await getPrincipal(h);
    expect(principal).toBeNull();
  });

  it("B. valid Better Auth session headers: getPrincipal() → principal (admin1 = SUPER_ADMIN)", async () => {
    const cookie = await signInAndGetSignedCookie(
      (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase(),
      env.INITIAL_ADMIN_PASSWORD!,
    );
    const h = new Headers();
    h.set("cookie", cookie);
    const principal = await getPrincipal(h);
    expect(principal).not.toBeNull();
    expect(principal!.id).toBeTruthy();
    expect(principal!.username).toBeTruthy();
    // admin1 is canonically a SUPER_ADMIN per user-management final correction #1.
    expect(principal!.principalType).toBe("SUPER_ADMIN");
  });

  it("C. ADMIN session (dedicated fixture): principalType = ADMIN (NOT admin1)", async () => {
    await sleep(1000); // avoid rate limit
    // Sign in as the dedicated ordinary-ADMIN fixture — NOT admin1.
    // admin1 is canonically a SUPER_ADMIN; we use a separate fixture to
    // test the ADMIN role cleanly without weakening the admin1 contract.
    const cookie = await signInAndGetSignedCookie(
      ADMIN_FIXTURE_USERNAME,
      ADMIN_FIXTURE_PASSWORD,
    );
    const h = new Headers();
    h.set("cookie", cookie);
    const principal = await getPrincipal(h);
    expect(principal).not.toBeNull();
    expect(principal!.principalType).toBe("ADMIN");
    expect(principal!.username).toBe(ADMIN_FIXTURE_USERNAME);
  });

  it("D. FANTOMAS session: principalType = FANTOMAS (mixed-case 'Fantomas' input)", async () => {
    await sleep(1000); // avoid rate limit
    const cookie = await signInAndGetSignedCookie(
      "Fantomas",
      env.FANTOMAS_INITIAL_PASSWORD!,
    );
    const h = new Headers();
    h.set("cookie", cookie);
    const principal = await getPrincipal(h);
    expect(principal).not.toBeNull();
    expect(principal!.principalType).toBe("FANTOMAS");
    // Stored username is normalized to lowercase "fantomas" by Username plugin
    expect(principal!.username).toBe("fantomas");
  });

  it("E. protected server-side access with authenticated session: accepted (can() returns true)", async () => {
    await sleep(1000); // avoid rate limit
    // admin1 is a SUPER_ADMIN — has all ADMIN capabilities + offer:restore + user:*.
    const cookie = await signInAndGetSignedCookie(
      (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase(),
      env.INITIAL_ADMIN_PASSWORD!,
    );
    const h = new Headers();
    h.set("cookie", cookie);
    const principal = await getPrincipal(h);
    expect(principal).not.toBeNull();
    // SUPER_ADMIN inherits all ADMIN capabilities — offer:create + offer:publish
    expect(can(principal!, "offer:create")).toBe(true);
    expect(can(principal!, "offer:publish")).toBe(true);
    // SUPER_ADMIN also has offer:restore + user:* — ADMIN does NOT.
    expect(can(principal!, "offer:restore")).toBe(true);
    expect(can(principal!, "user:list")).toBe(true);
  });

  it("F. protected server-side access without authenticated session: rejected (getPrincipal → null)", async () => {
    // No session cookie → getPrincipal returns null → requireCapability throws
    const h = new Headers();
    const principal = await getPrincipal(h);
    expect(principal).toBeNull();
    // can(null, ...) would throw — but the real enforcement is requireCapability
    // which checks getPrincipal() first. Verify getPrincipal returns null.
  });

  it("G. business authorization depends on principalType, NOT Better Auth role", async () => {
    await sleep(500);
    // admin1 is canonically a SUPER_ADMIN.
    const adminCookie = await signInAndGetSignedCookie(
      (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase(),
      env.INITIAL_ADMIN_PASSWORD!,
    );
    await sleep(500);
    const fantomasCookie = await signInAndGetSignedCookie(
      "Fantomas",
      env.FANTOMAS_INITIAL_PASSWORD!,
    );

    const adminH = new Headers();
    adminH.set("cookie", adminCookie);
    const fantomasH = new Headers();
    fantomasH.set("cookie", fantomasCookie);

    const adminPrincipal = await getPrincipal(adminH);
    const fantomasPrincipal = await getPrincipal(fantomasH);

    expect(adminPrincipal).not.toBeNull();
    expect(fantomasPrincipal).not.toBeNull();

    // admin1 is a SUPER_ADMIN (NOT a baseline ADMIN).
    // SUPER_ADMIN inherits all ADMIN capabilities + offer:restore + user:*.
    // SUPER_ADMIN does NOT have Fantomas-only capabilities.
    expect(adminPrincipal!.principalType).toBe("SUPER_ADMIN");
    expect(can(adminPrincipal!, "offer:create")).toBe(true);
    expect(can(adminPrincipal!, "offer:restore")).toBe(true);
    expect(can(adminPrincipal!, "user:list")).toBe(true);
    expect(can(adminPrincipal!, "system:bootstrap")).toBe(false);

    // FANTOMAS inherits all SUPER_ADMIN capabilities + system:*.
    expect(fantomasPrincipal!.principalType).toBe("FANTOMAS");
    expect(can(fantomasPrincipal!, "offer:create")).toBe(true);
    expect(can(fantomasPrincipal!, "offer:restore")).toBe(true);
    expect(can(fantomasPrincipal!, "user:list")).toBe(true);
    expect(can(fantomasPrincipal!, "system:bootstrap")).toBe(true);

    // The bootstrap admin is NOT FANTOMAS (Fantomas is a separate break-glass
    // identity); the FANTOMAS session is the break-glass path.
    expect(adminPrincipal!.principalType).not.toBe("FANTOMAS");
  }, 30000);

  it("invalid session cookie: getPrincipal() → null", async () => {
    const h = new Headers();
    h.set("cookie", "better-auth.session_token=invalid-token-value");
    const principal = await getPrincipal(h);
    expect(principal).toBeNull();
  });

  it("garbage cookie name: getPrincipal() → null", async () => {
    const h = new Headers();
    h.set("cookie", "some-other-cookie=value");
    const principal = await getPrincipal(h);
    expect(principal).toBeNull();
  });
});
