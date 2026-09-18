import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

/**
 * Regression tests for getPrincipal() — the WP-002 defect where
 * getPrincipal() passed empty `new Headers()` to auth.api.getSession(),
 * discarding the incoming Better Auth session cookie.
 *
 * Per owner authorization §6:
 *   A. no request/session: getPrincipal() → null
 *   B. valid Better Auth session headers: getPrincipal() → principal
 *   C. ADMIN session: principalType = ADMIN
 *   D. FANTOMAS session: principalType = FANTOMAS
 *   E. protected server-side access with authenticated session: accepted
 *   F. protected server-side access without authenticated session: rejected
 *   G. business authorization depends on principalType, not role
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

  it("B. valid Better Auth session headers: getPrincipal() → principal", async () => {
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
  });

  it("C. ADMIN session: principalType = ADMIN", async () => {
    await sleep(1000); // avoid rate limit
    const cookie = await signInAndGetSignedCookie(
      (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase(),
      env.INITIAL_ADMIN_PASSWORD!,
    );
    const h = new Headers();
    h.set("cookie", cookie);
    const principal = await getPrincipal(h);
    expect(principal).not.toBeNull();
    expect(principal!.principalType).toBe("ADMIN");
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
    const cookie = await signInAndGetSignedCookie(
      (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase(),
      env.INITIAL_ADMIN_PASSWORD!,
    );
    const h = new Headers();
    h.set("cookie", cookie);
    const principal = await getPrincipal(h);
    expect(principal).not.toBeNull();
    // ADMIN can perform offer:create
    expect(can(principal!, "offer:create")).toBe(true);
    expect(can(principal!, "offer:publish")).toBe(true);
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

    // ADMIN: offer:create ALLOW, system:bootstrap DENY
    expect(can(adminPrincipal!, "offer:create")).toBe(true);
    expect(can(adminPrincipal!, "system:bootstrap")).toBe(false);

    // FANTOMAS: offer:create ALLOW (inherits ADMIN), system:bootstrap ALLOW
    expect(can(fantomasPrincipal!, "offer:create")).toBe(true);
    expect(can(fantomasPrincipal!, "system:bootstrap")).toBe(true);

    // Verify both have principalType (NOT role) as authority
    expect(["ADMIN", "FANTOMAS"]).toContain(adminPrincipal!.principalType);
    expect(["ADMIN", "FANTOMAS"]).toContain(fantomasPrincipal!.principalType);
    expect(adminPrincipal!.principalType).toBe("ADMIN");
    expect(fantomasPrincipal!.principalType).toBe("FANTOMAS");
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
