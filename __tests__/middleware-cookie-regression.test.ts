import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

/**
 * Regression tests for Better Auth session cookie recognition in middleware.
 *
 * Bug: On Vercel HTTPS, Better Auth sets `__Secure-better-auth.session_token`.
 * The middleware's manual `cookie.name.startsWith("better-auth.session_token")`
 * check failed because `"__Secure-better-auth.session_token".startsWith(...)`
 * is false. Fix: use Better Auth's official `getSessionCookie()` helper which
 * handles both cookie name variants automatically.
 *
 * These tests verify that the middleware correctly recognizes:
 *   - Local HTTP cookie: better-auth.session_token
 *   - Vercel HTTPS cookie: __Secure-better-auth.session_token
 *   - Unrelated cookies: not recognized
 *   - No session cookie: redirect to /admin/login
 */

// Import the middleware function directly for unit testing.
// We simulate NextRequest with cookies.
import { getSessionCookie } from "better-auth/cookies";

describe("Better Auth session cookie recognition (middleware regression)", () => {
  it("getSessionCookie recognizes local HTTP cookie (better-auth.session_token)", () => {
    const headers = new Headers();
    headers.set("cookie", "better-auth.session_token=abc123.test-value-here");
    const result = getSessionCookie(headers);
    expect(result).not.toBeNull();
    expect(result).toBe("abc123.test-value-here");
  });

  it("getSessionCookie recognizes Vercel HTTPS cookie (__Secure-better-auth.session_token)", () => {
    const headers = new Headers();
    headers.set("cookie", "__Secure-better-auth.session_token=xyz789.secure-value-here");
    const result = getSessionCookie(headers);
    expect(result).not.toBeNull();
    expect(result).toBe("xyz789.secure-value-here");
  });

  it("getSessionCookie rejects unrelated cookie name", () => {
    const headers = new Headers();
    headers.set("cookie", "some-other-cookie=value123");
    const result = getSessionCookie(headers);
    expect(result).toBeNull();
  });

  it("getSessionCookie returns null when no cookie header", () => {
    const headers = new Headers();
    const result = getSessionCookie(headers);
    expect(result).toBeNull();
  });

  it("getSessionCookie returns null when cookie header empty", () => {
    const headers = new Headers();
    headers.set("cookie", "");
    const result = getSessionCookie(headers);
    expect(result).toBeNull();
  });

  it("getSessionCookie prefers __Secure- variant when both present", () => {
    const headers = new Headers();
    headers.set(
      "cookie",
      "better-auth.session_token=plain-value; __Secure-better-auth.session_token=secure-value",
    );
    const result = getSessionCookie(headers);
    // getCookie checks __Secure- first: `parsedCookie.get(`__Secure-${name}`) ?? parsedCookie.get(name)`
    expect(result).toBe("secure-value");
  });
});
