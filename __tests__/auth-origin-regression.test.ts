import { describe, it, expect } from "vitest";

/**
 * Regression tests for Better Auth dynamic baseURL / origin handling.
 *
 * Bug: Better Auth rejected Vercel Preview origins because baseURL was a
 * static string (BETTER_AUTH_URL or "http://localhost:3000"). Preview
 * deployments have dynamic URLs like
 * https://jourdain-abc123-kanga8.vercel.app which did not match.
 *
 * Fix: baseURL is now a DynamicBaseURLConfig with allowedHosts:
 *   - localhost:* (local dev, any port)
 *   - 127.0.0.1:* (local E2E, any port)
 *   - jourdain-three.vercel.app (production)
 *   - jourdain-*.vercel.app (preview deployments)
 *
 * These tests verify that the allowedHosts patterns correctly match
 * JOURDAIN origins and reject unrelated origins.
 */

describe("Better Auth allowedHosts origin matching", () => {
  const allowedHosts = [
    "localhost",
    "localhost:*",
    "127.0.0.1",
    "127.0.0.1:*",
    "jourdain-three.vercel.app",
    "jourdain-*.vercel.app",
  ];

  function matchesHost(host: string, pattern: string): boolean {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regex = escaped.replace(/\*/g, ".*");
    return new RegExp(`^${regex}$`, "i").test(host);
  }

  function isAllowed(host: string): boolean {
    return allowedHosts.some((pattern) => matchesHost(host, pattern));
  }

  it("localhost accepted", () => {
    expect(isAllowed("localhost")).toBe(true);
  });

  it("localhost:3000 accepted (port wildcard)", () => {
    expect(isAllowed("localhost:3000")).toBe(true);
  });

  it("localhost:3100 accepted (port wildcard)", () => {
    expect(isAllowed("localhost:3100")).toBe(true);
  });

  it("127.0.0.1 accepted", () => {
    expect(isAllowed("127.0.0.1")).toBe(true);
  });

  it("127.0.0.1:3000 accepted (port wildcard)", () => {
    expect(isAllowed("127.0.0.1:3000")).toBe(true);
  });

  it("127.0.0.1:3100 accepted (port wildcard)", () => {
    expect(isAllowed("127.0.0.1:3100")).toBe(true);
  });

  it("jourdain-three.vercel.app accepted (production)", () => {
    expect(isAllowed("jourdain-three.vercel.app")).toBe(true);
  });

  it("jourdain-abc123-kanga8.vercel.app accepted (preview)", () => {
    expect(isAllowed("jourdain-abc123-kanga8.vercel.app")).toBe(true);
  });

  it("jourdain-pv99njzlu-kanga8.vercel.app accepted (verified bug origin)", () => {
    expect(isAllowed("jourdain-pv99njzlu-kanga8.vercel.app")).toBe(true);
  });

  it("evil.example.com rejected", () => {
    expect(isAllowed("evil.example.com")).toBe(false);
  });

  it("other-project-abc.vercel.app rejected (non-JOURDAIN Vercel app)", () => {
    expect(isAllowed("other-project-abc.vercel.app")).toBe(false);
  });

  it("evil.vercel.app rejected (jourdain-* prefix not matched)", () => {
    expect(isAllowed("evil.vercel.app")).toBe(false);
  });

  it("jourdain.vercel.app rejected (missing hyphen after jourdain)", () => {
    expect(isAllowed("jourdain.vercel.app")).toBe(false);
  });
});
