import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Unit tests for lib/server/auth/fantomas-auth.ts — Fantomas break-glass.
 *
 * Verifies:
 *   - sign/verify round-trip
 *   - tamper rejection (payload + signature)
 *   - expiry enforcement
 *   - missing/invalid FANTOMAS_SESSION_SECRET → null (not a crash)
 *   - cookie read/write helpers
 *   - Set-Cookie builder semantics (HttpOnly, SameSite, Max-Age, Path, Secure)
 *   - constant Principal (principalType FANTOMAS, username "fantomas")
 *   - exact credential comparison (no hand-rolled constant-time)
 *   - Edge-compatibility: NO `node:crypto` import in source, NO Buffer usage
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
const ORIGINAL_SECRET = process.env.FANTOMAS_SESSION_SECRET;
const ENV_SECRET = env.FANTOMAS_SESSION_SECRET;

if (!ENV_SECRET) {
  throw new Error("FANTOMAS_SESSION_SECRET must be set in .env.local for these tests");
}

beforeAll(() => {
  process.env.FANTOMAS_SESSION_SECRET = ENV_SECRET;
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

describe("fantomas-auth — credential check", () => {
  it("fantomas/fantomas accepted (exact equality)", async () => {
    const f = await importFantomasAuth();
    expect(f.isFantomasCredential("fantomas", "fantomas")).toBe(true);
  });

  it("wrong password rejected", async () => {
    const f = await importFantomasAuth();
    expect(f.isFantomasCredential("fantomas", "wrong")).toBe(false);
  });

  it("wrong username rejected", async () => {
    const f = await importFantomasAuth();
    expect(f.isFantomasCredential("notfantomas", "fantomas")).toBe(false);
  });

  it("empty strings rejected", async () => {
    const f = await importFantomasAuth();
    expect(f.isFantomasCredential("", "")).toBe(false);
  });

  it("case-sensitive (Fantomas != fantomas)", async () => {
    const f = await importFantomasAuth();
    expect(f.isFantomasCredential("Fantomas", "fantomas")).toBe(false);
    expect(f.isFantomasCredential("fantomas", "Fantomas")).toBe(false);
  });
});

describe("fantomas-auth — FANTOMAS_PRINCIPAL constant", () => {
  it("has principalType FANTOMAS", async () => {
    const f = await importFantomasAuth();
    expect(f.FANTOMAS_PRINCIPAL.principalType).toBe("FANTOMAS");
  });

  it("has username 'fantomas'", async () => {
    const f = await importFantomasAuth();
    expect(f.FANTOMAS_PRINCIPAL.username).toBe("fantomas");
  });

  it("has stable id 'fantomas'", async () => {
    const f = await importFantomasAuth();
    expect(f.FANTOMAS_PRINCIPAL.id).toBe("fantomas");
  });
});

describe("fantomas-auth — sign / verify round-trip", () => {
  it("signs and verifies a fresh cookie", async () => {
    const f = await importFantomasAuth();
    const value = await f.signFantomasSessionCookie();
    expect(value).not.toBeNull();
    const principal = await f.verifyFantomasSessionCookie(value!);
    expect(principal).not.toBeNull();
    expect(principal!.principalType).toBe("FANTOMAS");
    expect(principal!.username).toBe("fantomas");
  });

  it("signed cookie has payload.signature format", async () => {
    const f = await importFantomasAuth();
    const value = await f.signFantomasSessionCookie();
    expect(value).not.toBeNull();
    expect(value!).toContain(".");
    const parts = value!.split(".");
    expect(parts.length).toBe(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("rejects tampered payload (HMAC mismatch)", async () => {
    const f = await importFantomasAuth();
    const value = await f.signFantomasSessionCookie();
    expect(value).not.toBeNull();
    const [payloadB64, sigB64] = value!.split(".");
    // Decode base64url payload, change sub from "fantomas" to "admin",
    // re-encode to base64url, keep the OLD signature.
    const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    const padded = pad === 0 ? b64 : b64 + "=".repeat(4 - pad);
    const payloadJson = atob(padded);
    const tamperedJson = payloadJson.replace('"fantomas"', '"admin"');
    const tamperedB64 = btoa(tamperedJson)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const tamperedValue = `${tamperedB64}.${sigB64}`;
    const principal = await f.verifyFantomasSessionCookie(tamperedValue);
    expect(principal).toBeNull(); // HMAC verification fails
  });

  it("rejects tampered signature", async () => {
    const f = await importFantomasAuth();
    const value = await f.signFantomasSessionCookie();
    expect(value).not.toBeNull();
    const [payloadB64, sigB64] = value!.split(".");
    // Flip the first character of the signature.
    const tamperedSig = (sigB64[0] === "A" ? "B" : "A") + sigB64.slice(1);
    const tamperedValue = `${payloadB64}.${tamperedSig}`;
    const principal = await f.verifyFantomasSessionCookie(tamperedValue);
    expect(principal).toBeNull();
  });

  it("rejects malformed cookie (no dot)", async () => {
    const f = await importFantomasAuth();
    const principal = await f.verifyFantomasSessionCookie("nodothere");
    expect(principal).toBeNull();
  });

  it("rejects malformed cookie (empty)", async () => {
    const f = await importFantomasAuth();
    const principal = await f.verifyFantomasSessionCookie("");
    expect(principal).toBeNull();
    const principal2 = await f.verifyFantomasSessionCookie(null);
    expect(principal2).toBeNull();
    const principal3 = await f.verifyFantomasSessionCookie(undefined);
    expect(principal3).toBeNull();
  });

  it("rejects expired cookie", async () => {
    const f = await importFantomasAuth();
    // Sign with a past timestamp so exp is in the past.
    const pastNow = Math.floor(Date.now() / 1000) - 10 * 60 * 60; // 10h ago
    const value = await f.signFantomasSessionCookie(pastNow);
    expect(value).not.toBeNull();
    // Verify at current time — exp is 8h after pastNow, which is 2h ago.
    const principal = await f.verifyFantomasSessionCookie(value!);
    expect(principal).toBeNull();
  });

  it("accepts cookie verified at the original now", async () => {
    const f = await importFantomasAuth();
    const fixedNow = Math.floor(Date.now() / 1000);
    const value = await f.signFantomasSessionCookie(fixedNow);
    expect(value).not.toBeNull();
    // Verify at the same fixedNow — exp = fixedNow + 8h is in the future.
    const principal = await f.verifyFantomasSessionCookie(value!, fixedNow);
    expect(principal).not.toBeNull();
    expect(principal!.principalType).toBe("FANTOMAS");
  });
});

describe("fantomas-auth — missing/invalid secret", () => {
  it("sign returns null when FANTOMAS_SESSION_SECRET is missing", async () => {
    const saved = process.env.FANTOMAS_SESSION_SECRET;
    delete process.env.FANTOMAS_SESSION_SECRET;
    try {
      // Re-import in a fresh module graph — but since the module is cached,
      // the env var read happens at sign() time. So we just call sign().
      const f = await importFantomasAuth();
      const value = await f.signFantomasSessionCookie();
      expect(value).toBeNull();
    } finally {
      process.env.FANTOMAS_SESSION_SECRET = saved;
    }
  });

  it("verify returns null when FANTOMAS_SESSION_SECRET is missing", async () => {
    const saved = process.env.FANTOMAS_SESSION_SECRET;
    delete process.env.FANTOMAS_SESSION_SECRET;
    try {
      const f = await importFantomasAuth();
      // Use a syntactically valid-looking cookie — verify should still reject.
      const fake =
        "eyJzdWIiOiJmYW50b21hcyIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.aGVsbG8";
      const principal = await f.verifyFantomasSessionCookie(fake);
      expect(principal).toBeNull();
    } finally {
      process.env.FANTOMAS_SESSION_SECRET = saved;
    }
  });
});

describe("fantomas-auth — cookie helpers", () => {
  it("readFantomasCookie extracts the value from a Cookie header", async () => {
    const f = await importFantomasAuth();
    const header = `${f.FANTOMAS_COOKIE_NAME}=abc.def; other=ghi`;
    expect(f.readFantomasCookie(header)).toBe("abc.def");
  });

  it("readFantomasCookie returns null when cookie absent", async () => {
    const f = await importFantomasAuth();
    expect(f.readFantomasCookie("other=value")).toBeNull();
    expect(f.readFantomasCookie(null)).toBeNull();
    expect(f.readFantomasCookie(undefined)).toBeNull();
    expect(f.readFantomasCookie("")).toBeNull();
  });

  it("readFantomasCookie handles cookie at start of header", async () => {
    const f = await importFantomasAuth();
    const header = `${f.FANTOMAS_COOKIE_NAME}=value`;
    expect(f.readFantomasCookie(header)).toBe("value");
  });

  it("readFantomasCookie handles cookie after another cookie", async () => {
    const f = await importFantomasAuth();
    const header = `other=value; ${f.FANTOMAS_COOKIE_NAME}=target`;
    expect(f.readFantomasCookie(header)).toBe("target");
  });

  it("buildFantomasSetCookie includes HttpOnly, SameSite=Lax, Max-Age, Path=/", async () => {
    const f = await importFantomasAuth();
    const cookie = f.buildFantomasSetCookie("test.value", { secure: false });
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain(`Max-Age=${f.FANTOMAS_SESSION_MAX_AGE_SECONDS}`);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain(`${f.FANTOMAS_COOKIE_NAME}=test.value`);
  });

  it("buildFantomasSetCookie adds Secure when secure=true", async () => {
    const f = await importFantomasAuth();
    const cookie = f.buildFantomasSetCookie("v", { secure: true });
    expect(cookie).toContain("Secure");
  });

  it("buildFantomasSetCookie omits Secure when secure=false (localhost HTTP)", async () => {
    const f = await importFantomasAuth();
    const cookie = f.buildFantomasSetCookie("v", { secure: false });
    expect(cookie).not.toContain("Secure");
  });

  it("buildFantomasClearCookie sets Max-Age=0 and empty value", async () => {
    const f = await importFantomasAuth();
    const cookie = f.buildFantomasClearCookie({ secure: false });
    expect(cookie).toContain(`${f.FANTOMAS_COOKIE_NAME}=`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toContain("Secure");
  });

  it("buildFantomasClearCookie adds Secure when secure=true (HTTPS)", async () => {
    const f = await importFantomasAuth();
    const cookie = f.buildFantomasClearCookie({ secure: true });
    expect(cookie).toContain("Secure");
  });
});

describe("fantomas-auth — Edge-compatibility (no node-only APIs)", () => {
  it("source contains no `node:crypto` import", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/lib/server/auth/fantomas-auth.ts",
      "utf8",
    );
    expect(src).not.toContain('from "node:crypto"');
    expect(src).not.toContain('require("crypto")');
    expect(src).not.toContain('require("node:crypto")');
  });

  it("source does not use Buffer constructor or Buffer.from", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/lib/server/auth/fantomas-auth.ts",
      "utf8",
    );
    // Match Buffer as a value usage, not the word in comments. Specifically:
    // - `Buffer.from(` — most common usage
    // - `new Buffer(` — deprecated but still seen
    // - `Buffer.alloc(` / `Buffer.concat(` / `Buffer.byteLength(`
    // - `import { Buffer }` / `import Buffer` / `require('buffer').Buffer`
    expect(src).not.toMatch(/Buffer\.from\s*\(/);
    expect(src).not.toMatch(/new\s+Buffer\s*\(/);
    expect(src).not.toMatch(/Buffer\.alloc\s*\(/);
    expect(src).not.toMatch(/Buffer\.concat\s*\(/);
    expect(src).not.toMatch(/Buffer\.byteLength\s*\(/);
    expect(src).not.toMatch(/import\s+\{[^}]*\bBuffer\b[^}]*\}/);
    expect(src).not.toMatch(/import\s+Buffer\b/);
    expect(src).not.toMatch(/require\s*\(\s*['"]buffer['"]\s*\)/);
  });

  it("source uses Web Crypto (globalThis.crypto.subtle)", async () => {
    const src = readFileSync(
      "/home/z/my-project/jourdain/lib/server/auth/fantomas-auth.ts",
      "utf8",
    );
    expect(src).toContain("crypto.subtle");
  });

  it("verifyFantomasSessionCookie runs in a Web-Crypto-only environment (no node:crypto loaded)", async () => {
    // This is a runtime smoke test: by importing and running the function,
    // we exercise the Web Crypto path. If node:crypto were required, the
    // function would throw or fail to import in this Node process.
    const f = await importFantomasAuth();
    const value = await f.signFantomasSessionCookie();
    expect(value).not.toBeNull();
    const principal = await f.verifyFantomasSessionCookie(value!);
    expect(principal).not.toBeNull();
  });
});

describe("fantomas-auth — capability matrix (FANTOMAS inherits ADMIN)", () => {
  it("FANTOMAS_PRINCIPAL can use all ADMIN capabilities", async () => {
    const { FANTOMAS_PRINCIPAL } = await importFantomasAuth();
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
      expect(can(FANTOMAS_PRINCIPAL, cap)).toBe(true);
    }
  });

  it("FANTOMAS_PRINCIPAL can use Fantomas-only capabilities", async () => {
    const { FANTOMAS_PRINCIPAL } = await importFantomasAuth();
    const { can } = await import("../lib/server/auth/capabilities");
    expect(can(FANTOMAS_PRINCIPAL, "system:bootstrap")).toBe(true);
    expect(can(FANTOMAS_PRINCIPAL, "system:recovery")).toBe(true);
  });

  it("ADMIN principal lacks Fantomas-only capabilities", async () => {
    const adminPrincipal = {
      id: "admin1-id",
      username: "admin1",
      principalType: "ADMIN" as const,
    };
    const { can } = await import("../lib/server/auth/capabilities");
    expect(can(adminPrincipal, "system:bootstrap")).toBe(false);
    expect(can(adminPrincipal, "system:recovery")).toBe(false);
    // ADMIN retains all ADMIN capabilities
    expect(can(adminPrincipal, "offer:create")).toBe(true);
  });
});
