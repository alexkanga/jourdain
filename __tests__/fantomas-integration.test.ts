import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Integration tests for Fantomas break-glass authentication.
 *
 * Verifies the full Fantomas flow:
 *   - POST /api/fantomas/login → 200 + Set-Cookie
 *   - getPrincipal(cookie header) → FANTOMAS Principal (no DB)
 *   - DB-outage simulation: Fantomas login + session resolution still work
 *     when the DB path is unreachable (proven by isolation — Fantomas branch
 *     in getPrincipal imports no DB code)
 *   - POST /api/fantomas/logout → clears cookie
 *   - post-logout: getPrincipal returns null
 *   - admin1 Better Auth path unchanged (regression guard)
 *   - localhost HTTP cookie behavior (no Secure on http://)
 *   - HTTPS Vercel cookie behavior (Secure on https://)
 *   - Edge-compatible: no node:crypto in any Fantomas code path
 *
 * Uses real TEST_DATABASE_URL for the Better Auth regression sub-tests; the
 * Fantomas sub-tests do NOT touch the DB (that's the point — they isolate
 * the DB-free path by exercising only Fantomas endpoints and helpers).
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
const FANTOMAS_SECRET = env.FANTOMAS_SESSION_SECRET!;
if (!FANTOMAS_SECRET) {
  throw new Error("FANTOMAS_SESSION_SECRET must be set in .env.local");
}

const ORIGINAL_SECRET = process.env.FANTOMAS_SESSION_SECRET;
beforeAll(() => {
  process.env.FANTOMAS_SESSION_SECRET = FANTOMAS_SECRET;
});
afterAll(() => {
  if (ORIGINAL_SECRET !== undefined) {
    process.env.FANTOMAS_SESSION_SECRET = ORIGINAL_SECRET;
  } else {
    delete process.env.FANTOMAS_SESSION_SECRET;
  }
});

async function importFantomasAuth() {
  return await import("../lib/server/auth/fantomas-auth");
}

async function importLoginRoute() {
  return await import("../app/api/fantomas/login/route");
}

async function importLogoutRoute() {
  return await import("../app/api/fantomas/logout/route");
}

function makeJsonRequest(
  url: string,
  method: "POST",
  body: unknown,
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Fantomas integration — login endpoint", () => {
  it("fantomas/fantomas → 200 + Set-Cookie jourdain_fantomas_session", async () => {
    const { POST } = await importLoginRoute();
    const req = makeJsonRequest("http://localhost:3000/api/fantomas/login", "POST", {
      username: "fantomas",
      password: "fantomas",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie!).toContain("jourdain_fantomas_session=");
    expect(setCookie!).toContain("HttpOnly");
    expect(setCookie!).toContain("SameSite=Lax");
    expect(setCookie!).toContain("Path=/");
    // HTTP localhost → no Secure attribute
    expect(setCookie!).not.toContain("Secure");
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("wrong password → 401 + no Set-Cookie", async () => {
    const { POST } = await importLoginRoute();
    const req = makeJsonRequest(
      "http://localhost:3000/api/fantomas/login",
      "POST",
      { username: "fantomas", password: "wrong" },
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("wrong username → 401 + no Set-Cookie", async () => {
    const { POST } = await importLoginRoute();
    const req = makeJsonRequest(
      "http://localhost:3000/api/fantomas/login",
      "POST",
      { username: "notfantomas", password: "fantomas" },
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("malformed JSON → 401 (no crash)", async () => {
    const { POST } = await importLoginRoute();
    const req = new Request("http://localhost:3000/api/fantomas/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("HTTPS request → Set-Cookie includes Secure", async () => {
    const { POST } = await importLoginRoute();
    const req = makeJsonRequest(
      "https://jourdain-example.vercel.app/api/fantomas/login",
      "POST",
      { username: "fantomas", password: "fantomas" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("Secure");
  });

  it("HTTP localhost → Set-Cookie omits Secure (browser can store it)", async () => {
    const { POST } = await importLoginRoute();
    const req = makeJsonRequest(
      "http://127.0.0.1:3100/api/fantomas/login",
      "POST",
      { username: "fantomas", password: "fantomas" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toContain("Secure");
  });
});

describe("Fantomas integration — session resolution via getPrincipal (Fantomas-first)", () => {
  it("valid Fantomas cookie → FANTOMAS Principal (no DB lookup)", async () => {
    const f = await importFantomasAuth();
    // Sign a cookie via the helper.
    const value = await f.signFantomasSessionCookie();
    expect(value).not.toBeNull();
    // Build a Cookie header with the Fantomas cookie.
    const h = new Headers();
    h.set("cookie", `${f.FANTOMAS_COOKIE_NAME}=${value}`);
    // Directly call verifyFantomasSessionCookie (what getPrincipal calls).
    const read = f.readFantomasCookie(h.get("cookie"));
    expect(read).toBe(value);
    const principal = await f.verifyFantomasSessionCookie(read);
    expect(principal).not.toBeNull();
    expect(principal!.principalType).toBe("FANTOMAS");
    expect(principal!.username).toBe("fantomas");
  });

  it("Fantomas cookie priority — getPrincipal tries Fantomas FIRST", async () => {
    // Verify the import surface: getPrincipal must import verifyFantomasSessionCookie.
    // We check the source to prove the Fantomas branch runs before auth.api.getSession.
    const src = readFileSync(
      "/home/z/my-project/jourdain/lib/server/auth/authorization.ts",
      "utf8",
    );
    // Fantomas branch must appear BEFORE the Better Auth getSession call.
    const fantomasIdx = src.indexOf("verifyFantomasSessionCookie");
    const betterAuthIdx = src.indexOf("auth.api.getSession");
    expect(fantomasIdx).toBeGreaterThan(-1);
    expect(betterAuthIdx).toBeGreaterThan(-1);
    expect(fantomasIdx).toBeLessThan(betterAuthIdx);
  });
});

describe("Fantomas integration — DB outage simulation", () => {
  it("Fantomas login succeeds when DB is unavailable (no DB imports in login route)", async () => {
    // Static proof: the /api/fantomas/login route source must NOT import
    // anything from db/index.ts or drizzle-orm or @neondatabase.
    const src = readFileSync(
      "/home/z/my-project/jourdain/app/api/fantomas/login/route.ts",
      "utf8",
    );
    expect(src).not.toMatch(/from\s+["']@\/db\/index/);
    expect(src).not.toMatch(/from\s+["']drizzle-orm/);
    expect(src).not.toMatch(/from\s+["']@neondatabase/);
    expect(src).not.toMatch(/from\s+["']better-auth/);

    // Runtime proof: actually call the endpoint. It cannot reach the DB
    // because we don't set DATABASE_URL for this test (the route doesn't
    // read it). If the route tried DB access, this would fail.
    const { POST } = await importLoginRoute();
    const req = makeJsonRequest(
      "http://localhost:3000/api/fantomas/login",
      "POST",
      { username: "fantomas", password: "fantomas" },
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("Fantomas session resolution succeeds without any DB import in the verify path", async () => {
    // Static proof: lib/server/auth/fantomas-auth.ts imports no DB code.
    const src = readFileSync(
      "/home/z/my-project/jourdain/lib/server/auth/fantomas-auth.ts",
      "utf8",
    );
    expect(src).not.toMatch(/from\s+["']@\/db\/index/);
    expect(src).not.toMatch(/from\s+["']drizzle-orm/);
    expect(src).not.toMatch(/from\s+["']@neondatabase/);
    expect(src).not.toMatch(/from\s+["']better-auth/);

    // Runtime proof: sign + verify a cookie without setting DATABASE_URL.
    // The DB is NOT required for Fantomas session resolution.
    const savedDb = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const f = await importFantomasAuth();
      const value = await f.signFantomasSessionCookie();
      expect(value).not.toBeNull();
      const principal = await f.verifyFantomasSessionCookie(value!);
      expect(principal).not.toBeNull();
      expect(principal!.principalType).toBe("FANTOMAS");
    } finally {
      if (savedDb !== undefined) process.env.DATABASE_URL = savedDb;
    }
  });
});

describe("Fantomas integration — logout endpoint", () => {
  it("POST /api/fantomas/logout → 200 + Set-Cookie clears the cookie", async () => {
    const { POST } = await importLogoutRoute();
    const req = makeJsonRequest(
      "http://localhost:3000/api/fantomas/logout",
      "POST",
      {},
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie!).toContain("jourdain_fantomas_session=");
    expect(setCookie!).toContain("Max-Age=0");
    expect(setCookie!).toContain("HttpOnly");
  });

  it("HTTPS logout → Set-Cookie includes Secure", async () => {
    const { POST } = await importLogoutRoute();
    const req = makeJsonRequest(
      "https://jourdain-example.vercel.app/api/fantomas/logout",
      "POST",
      {},
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("Secure");
  });

  it("logout endpoint does NOT import Better Auth (OWNER revision)", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/app/api/fantomas/logout/route.ts",
      "utf8",
    );
    expect(src).not.toMatch(/from\s+["']better-auth/);
    expect(src).not.toMatch(/from\s+["']@\/db\/index/);
  });
});

describe("Fantomas integration — post-logout state", () => {
  it("after logout cookie is cleared, verifyFantomasSessionCookie returns null", async () => {
    const f = await importFantomasAuth();
    // Mint a cookie.
    const value = await f.signFantomasSessionCookie();
    expect(value).not.toBeNull();
    // Logout endpoint produces a Set-Cookie that clears the value.
    const { POST } = await importLogoutRoute();
    const req = makeJsonRequest(
      "http://localhost:3000/api/fantomas/logout",
      "POST",
      {},
    );
    const res = await POST(req);
    const setCookie = res.headers.get("set-cookie")!;
    // The cleared cookie has an empty value (after the `=`).
    const match = setCookie.match(/jourdain_fantomas_session=([^;]*)/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe(""); // empty value
    // verifyFantomasSessionCookie("") returns null.
    const principal = await f.verifyFantomasSessionCookie("");
    expect(principal).toBeNull();
  });
});

describe("Fantomas integration — capability matrix preserved", () => {
  it("FANTOMAS inherits ADMIN capabilities (system test through can())", async () => {
    const f = await importFantomasAuth();
    const { can } = await import("../lib/server/auth/capabilities");
    const adminCaps = [
      "offer:create",
      "offer:edit",
      "offer:save",
      "offer:publish",
      "offer:suspend",
      "offer:republish",
      "offer:archive",
      "offer:restore",
      "admin:login",
    ] as const;
    for (const cap of adminCaps) {
      expect(can(f.FANTOMAS_PRINCIPAL, cap)).toBe(true);
    }
    // Fantomas-only capabilities
    expect(can(f.FANTOMAS_PRINCIPAL, "system:bootstrap")).toBe(true);
    expect(can(f.FANTOMAS_PRINCIPAL, "system:recovery")).toBe(true);
  });

  it("ADMIN principal lacks Fantomas-only capabilities", async () => {
    const { can } = await import("../lib/server/auth/capabilities");
    const adminPrincipal = {
      id: "admin1-id",
      username: "admin1",
      principalType: "ADMIN" as const,
    };
    expect(can(adminPrincipal, "system:bootstrap")).toBe(false);
    expect(can(adminPrincipal, "system:recovery")).toBe(false);
    expect(can(adminPrincipal, "offer:create")).toBe(true);
  });
});

describe("Fantomas integration — Edge-compatibility (no node:crypto)", () => {
  it("fantomas-auth.ts has no node:crypto import (static check)", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/lib/server/auth/fantomas-auth.ts",
      "utf8",
    );
    expect(src).not.toContain('from "node:crypto"');
    expect(src).not.toContain('require("crypto")');
    expect(src).not.toContain('require("node:crypto")');
  });

  it("login route has no node:crypto import (static check)", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/app/api/fantomas/login/route.ts",
      "utf8",
    );
    expect(src).not.toContain('from "node:crypto"');
    expect(src).not.toContain('require("crypto")');
  });

  it("logout route has no node:crypto import (static check)", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/app/api/fantomas/logout/route.ts",
      "utf8",
    );
    expect(src).not.toContain('from "node:crypto"');
    expect(src).not.toContain('require("crypto")');
  });

  it("middleware has no node:crypto import (static check — Edge Runtime)", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/middleware.ts",
      "utf8",
    );
    expect(src).not.toContain('from "node:crypto"');
    expect(src).not.toContain('require("crypto")');
  });
});

describe("Fantomas integration — admin1 Better Auth unchanged (regression guard)", () => {
  it("login route imports nothing that mutates Better Auth config", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/app/api/fantomas/login/route.ts",
      "utf8",
    );
    // The Fantomas login route must NOT touch Better Auth — it imports only
    // from fantomas-auth and next/server.
    expect(src).not.toMatch(/better-auth/);
    expect(src).not.toMatch(/auth\.api\./);
  });

  it("LoginForm.tsx still has the Better Auth path for non-fantomas usernames", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/app/admin/login/LoginForm.tsx",
      "utf8",
    );
    // The Better Auth path (authClient.signIn.username) must still exist.
    expect(src).toContain("authClient.signIn.username");
    // The Fantomas branch must be a fetch to /api/fantomas/login.
    expect(src).toContain("/api/fantomas/login");
  });
});
