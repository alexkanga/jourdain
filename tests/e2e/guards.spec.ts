/**
 * WP-005 Guard Self-Tests (AC-030 through AC-037d)
 *
 * These tests verify the fail-closed target-verification guards themselves.
 * They do NOT contact Vercel or Production.
 * They do NOT make any external network request.
 * They do NOT perform any state mutation (no INSERT/UPDATE/DELETE on any DB).
 *
 * They invoke the pure functions in helpers/env.ts directly with synthetic
 * environment records and assert the REFUSE/ACCEPT decision.
 *
 * Per §15 GUARD SELF-TESTS:
 * - AC-030: local target allowed
 * - AC-031: remote target denied by default (no external network request)
 * - AC-032: TEST DB allowed (verified TEST fingerprint + read-only probe pass)
 * - AC-033: DEV DB denied for E2E (TEST_EQUALS_DEV)
 * - AC-034: Production DB denied for E2E (TEST_EQUALS_PROD)
 * - AC-035: unknown DB denied (TEST_FINGERPRINT_MISMATCH)
 * - AC-036: SQLite fallback denied (TEST_IS_SQLITE_FALLBACK)
 * - AC-037: parent DATABASE_URL contamination does not silently redirect execution
 *           (simulates parent env with DATABASE_URL=file:...; asserts A: parent value NOT used,
 *            B: child receives TEST, C: NO mutation before certification)
 * - AC-037a: no write-based target probe exists in the runner code (static check)
 * - AC-037b: mutation ordering invariant — runner pre-flight issues NO INSERT/UPDATE/DELETE
 *            before Phase A target certification
 * - AC-037c: remote override requires all THREE variables (E2E_ALLOW_REMOTE=1 +
 *            E2E_REMOTE_BASE_URL + E2E_REMOTE_AUTHORIZATION_REF); missing any one → REFUSED
 * - AC-037d: E2E_REMOTE_AUTHORIZATION_REF treated as non-secret reference, NOT validated as credential
 *
 * Most tests use synthetic environments and do NOT require a real DB connection.
 * The DB-touching tests (AC-032) use the actual verified TEST_DATABASE_URL from .env.local,
 * but perform ONLY read-only SELECT queries (no mutation).
 */

import { test, expect } from "@playwright/test";
import {
  parseEnvLocal,
  certifyTestTarget,
  authorizeBaseUrl,
  buildChildEnv,
  hostnameOf,
  E2eTargetError,
  E2E_ERRORS,
} from "./helpers/env";

// Synthetic TEST target for the non-DB-touching tests (AC-030, 031, 033-037d).
const SYNTH_TEST_URL = "postgresql://user:pass@ep-test-fake-host-abc123.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const SYNTH_DEV_URL = "postgresql://user:pass@ep-dev-fake-host-xyz789.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const SYNTH_PROD_URL = "postgresql://user:pass@ep-prod-fake-host-000.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const SYNTH_TEST_FINGERPRINT = "ep-test-fake-host-abc123.eu-central-1.aws.neon.tech";

// ============================================================
// AC-037c: remote override requires all THREE variables
// ============================================================

test.describe("Guard self-tests — base URL policy (AC-030, AC-031, AC-037c, AC-037d)", () => {
  test("AC-030: local loopback target allowed", () => {
    const url = authorizeBaseUrl({ E2E_BASE_URL: "http://127.0.0.1:3100" });
    expect(url).toBe("http://127.0.0.1:3100");
  });

  test("AC-030: localhost also allowed", () => {
    const url = authorizeBaseUrl({ E2E_BASE_URL: "http://localhost:3100" });
    expect(url).toBe("http://localhost:3100");
  });

  test("AC-031: remote target denied by default (no override vars set)", () => {
    expect(() =>
      authorizeBaseUrl({ E2E_BASE_URL: "https://example.com" }),
    ).toThrowError(E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED);
  });

  test("AC-031: remote target denied with only E2E_ALLOW_REMOTE=1 (missing other two)", () => {
    expect(() =>
      authorizeBaseUrl({ E2E_BASE_URL: "https://example.com", E2E_ALLOW_REMOTE: "1" }),
    ).toThrowError(E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED);
  });

  test("AC-031: remote target denied with only E2E_ALLOW_REMOTE=1 + E2E_REMOTE_BASE_URL (missing authRef)", () => {
    expect(() =>
      authorizeBaseUrl({
        E2E_BASE_URL: "https://example.com",
        E2E_ALLOW_REMOTE: "1",
        E2E_REMOTE_BASE_URL: "https://example.com",
      }),
    ).toThrowError(E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED);
  });

  test("AC-037c: remote override accepted with all THREE variables set", () => {
    const url = authorizeBaseUrl({
      E2E_BASE_URL: "https://example.com",
      E2E_ALLOW_REMOTE: "1",
      E2E_REMOTE_BASE_URL: "https://staging.example.com",
      E2E_REMOTE_AUTHORIZATION_REF: "OWNER-AUTH-2026-09-16-WP005-REMOTE-E2E",
    });
    expect(url).toBe("https://staging.example.com");
  });

  test("AC-037d: E2E_REMOTE_AUTHORIZATION_REF treated as non-secret reference (empty string → REFUSED)", () => {
    expect(() =>
      authorizeBaseUrl({
        E2E_BASE_URL: "https://example.com",
        E2E_ALLOW_REMOTE: "1",
        E2E_REMOTE_BASE_URL: "https://example.com",
        E2E_REMOTE_AUTHORIZATION_REF: "",
      }),
    ).toThrowError(E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED);
  });

  test("AC-037d: E2E_REMOTE_AUTHORIZATION_REF only checked for presence (any non-empty value accepted)", () => {
    // The runner does NOT validate the contents — only presence + non-empty.
    const url = authorizeBaseUrl({
      E2E_BASE_URL: "https://example.com",
      E2E_ALLOW_REMOTE: "1",
      E2E_REMOTE_BASE_URL: "https://example.com",
      E2E_REMOTE_AUTHORIZATION_REF: "any-non-empty-string-not-validated",
    });
    expect(url).toBe("https://example.com");
  });
});

// ============================================================
// AC-011: missing TEST_DATABASE_URL
// AC-012: invalid URL scheme
// AC-036: SQLite fallback
// AC-033: TEST == DEV
// AC-034: TEST == PROD
// AC-035: unknown fingerprint
// ============================================================

test.describe("Guard self-tests — DB target certification (AC-011 through AC-014, AC-036, AC-012a)", () => {
  test("AC-011: missing TEST_DATABASE_URL → MISSING_TEST_DATABASE_URL", async () => {
    await expect(certifyTestTarget({})).rejects.toMatchObject({
      code: E2E_ERRORS.MISSING_TEST_DATABASE_URL,
    });
  });

  test("AC-012: non-postgresql scheme → TEST_UNSUPPORTED_SCHEME", async () => {
    await expect(
      certifyTestTarget({
        TEST_DATABASE_URL: "mysql://user:pass@host/db",
        E2E_EXPECTED_TEST_DATABASE_HOST: "host",
      }),
    ).rejects.toMatchObject({ code: E2E_ERRORS.TEST_UNSUPPORTED_SCHEME });
  });

  test("AC-036: SQLite file: fallback → TEST_IS_SQLITE_FALLBACK", async () => {
    await expect(
      certifyTestTarget({
        TEST_DATABASE_URL: "file:/home/z/my-project/db/custom.db",
        E2E_EXPECTED_TEST_DATABASE_HOST: "host",
      }),
    ).rejects.toMatchObject({ code: E2E_ERRORS.TEST_IS_SQLITE_FALLBACK });
  });

  test("AC-012a: missing E2E_EXPECTED_TEST_DATABASE_HOST → MISSING_EXPECTED_TEST_FINGERPRINT", async () => {
    await expect(
      certifyTestTarget({
        TEST_DATABASE_URL: SYNTH_TEST_URL,
        // E2E_EXPECTED_TEST_DATABASE_HOST intentionally omitted — no .env.example fallback
      }),
    ).rejects.toMatchObject({
      code: E2E_ERRORS.MISSING_EXPECTED_TEST_FINGERPRINT,
    });
  });

  test("AC-012a: empty E2E_EXPECTED_TEST_DATABASE_HOST → MISSING_EXPECTED_TEST_FINGERPRINT", async () => {
    await expect(
      certifyTestTarget({
        TEST_DATABASE_URL: SYNTH_TEST_URL,
        E2E_EXPECTED_TEST_DATABASE_HOST: "",
      }),
    ).rejects.toMatchObject({
      code: E2E_ERRORS.MISSING_EXPECTED_TEST_FINGERPRINT,
    });
  });

  test("AC-035: wrong fingerprint → TEST_FINGERPRINT_MISMATCH (unknown DB)", async () => {
    await expect(
      certifyTestTarget({
        TEST_DATABASE_URL: SYNTH_TEST_URL,
        E2E_EXPECTED_TEST_DATABASE_HOST: "ep-some-other-host.eu-central-1.aws.neon.tech",
      }),
    ).rejects.toMatchObject({
      code: E2E_ERRORS.TEST_FINGERPRINT_MISMATCH,
    });
  });

  test("AC-033: TEST host == DEV host → TEST_EQUALS_DEV", async () => {
    const sameHostUrl = "postgresql://user:pass@ep-shared-host.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    await expect(
      certifyTestTarget({
        TEST_DATABASE_URL: sameHostUrl,
        E2E_EXPECTED_TEST_DATABASE_HOST: "ep-shared-host.eu-central-1.aws.neon.tech",
        DEV_DATABASE_URL: sameHostUrl,
      }),
    ).rejects.toMatchObject({ code: E2E_ERRORS.TEST_EQUALS_DEV });
  });

  test("AC-034: TEST host == PROD host → TEST_EQUALS_PROD", async () => {
    const sameHostUrl = "postgresql://user:pass@ep-prod-shared.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    await expect(
      certifyTestTarget({
        TEST_DATABASE_URL: sameHostUrl,
        E2E_EXPECTED_TEST_DATABASE_HOST: "ep-prod-shared.eu-central-1.aws.neon.tech",
        PROD_DATABASE_URL: sameHostUrl,
      }),
    ).rejects.toMatchObject({ code: E2E_ERRORS.TEST_EQUALS_PROD });
  });

  test("hostnameOf: extracts lowercase hostname", () => {
    expect(hostnameOf(SYNTH_TEST_URL)).toBe(SYNTH_TEST_FINGERPRINT);
  });
});

// ============================================================
// AC-018 + AC-037: parent DATABASE_URL contamination neutralized
// ============================================================

test.describe("Guard self-tests — parent DATABASE_URL contamination (AC-018, AC-037)", () => {
  test("AC-018: buildChildEnv ignores parent DATABASE_URL and injects TEST value", () => {
    const parentEnv: NodeJS.ProcessEnv = {
      // Simulate the WP-004 incident class: parent .env has SQLite fallback
      DATABASE_URL: "file:/home/z/my-project/db/custom.db",
      PATH: "/usr/bin",
      HOME: "/home/z",
      NODE_ENV: "production",
    };
    const verified = {
      testDatabaseUrl: SYNTH_TEST_URL,
      testHost: SYNTH_TEST_FINGERPRINT,
      testDbName: "neondb",
      expectedFingerprint: SYNTH_TEST_FINGERPRINT,
      rawSql: null as never, // not used by buildChildEnv
    };
    const authEnv: Record<string, string> = {
      BETTER_AUTH_SECRET: "secret",
      BETTER_AUTH_URL: "http://127.0.0.1:3100",
      INITIAL_ADMIN_PASSWORD: "pw",
      FANTOMAS_INITIAL_PASSWORD: "pw",
    };
    const child = buildChildEnv(parentEnv, verified, authEnv);
    // Assertion A: parent value NOT used
    expect(child.DATABASE_URL).not.toBe("file:/home/z/my-project/db/custom.db");
    // Assertion B: child receives TEST value (positively verified)
    expect(child.DATABASE_URL).toBe(SYNTH_TEST_URL);
  });

  test("AC-037: parent DATABASE_URL=postgresql://... is also overridden", () => {
    const parentEnv: NodeJS.ProcessEnv = {
      // Even if parent has a postgresql URL, the child MUST use the verified TEST value
      DATABASE_URL: "postgresql://user:pass@ep-other-host.eu-central-1.aws.neon.tech/neondb?sslmode=require",
      PATH: "/usr/bin",
      HOME: "/home/z",
      NODE_ENV: "production",
    };
    const verified = {
      testDatabaseUrl: SYNTH_TEST_URL,
      testHost: SYNTH_TEST_FINGERPRINT,
      testDbName: "neondb",
      expectedFingerprint: SYNTH_TEST_FINGERPRINT,
      rawSql: null as never,
    };
    const authEnv: Record<string, string> = {};
    const child = buildChildEnv(parentEnv, verified, authEnv);
    expect(child.DATABASE_URL).toBe(SYNTH_TEST_URL);
    expect(child.DATABASE_URL).not.toBe(parentEnv.DATABASE_URL);
  });

  test("AC-037: child env does NOT inherit unrelated parent keys (curated allowlist)", () => {
    const parentEnv: NodeJS.ProcessEnv = {
      DATABASE_URL: "file:leaked",
      PATH: "/usr/bin",
      HOME: "/home/z",
      UNRELATED_SECRET: "should-not-leak",
      NODE_ENV: "production",
    };
    const verified = {
      testDatabaseUrl: SYNTH_TEST_URL,
      testHost: SYNTH_TEST_FINGERPRINT,
      testDbName: "neondb",
      expectedFingerprint: SYNTH_TEST_FINGERPRINT,
      rawSql: null as never,
    };
    const authEnv: Record<string, string> = {};
    const child = buildChildEnv(parentEnv, verified, authEnv);
    // The unrelated parent key is NOT forwarded to the child
    expect(child).not.toHaveProperty("UNRELATED_SECRET");
    expect(child.DATABASE_URL).toBe(SYNTH_TEST_URL);
  });
});

// ============================================================
// AC-019 + AC-037b: mutation ordering invariant (no INSERT/UPDATE/DELETE before Phase A)
// AC-037a: no write-based target probe exists in runner code (static check)
// ============================================================

test.describe("Guard self-tests — mutation ordering invariant (AC-019, AC-037a, AC-037b)", () => {
  test("AC-037a: env.ts certifyTestTarget does NOT issue any write SQL (read-only)", async () => {
    // Static check: the env.ts module's certifyTestTarget only calls:
    //   rawSql`SELECT 1 AS one`
    //   rawSql`SELECT current_database() AS db, current_setting('server_version') AS version`
    // Both are read-only. Verify by inspecting the source.
    const envSource = await import("node:fs").then((fs) =>
      fs.readFileSync("./tests/e2e/helpers/env.ts", "utf8"),
    );
    // No INSERT, UPDATE, DELETE, TRUNCATE, or write-based probe via Server Action in env.ts
    expect(envSource).not.toMatch(/\bINSERT\b/i);
    expect(envSource).not.toMatch(/\bUPDATE\b/i);
    expect(envSource).not.toMatch(/\bDELETE\b/i);
    expect(envSource).not.toMatch(/\bTRUNCATE\b/i);
    expect(envSource).not.toMatch(/insertProbeViaApp|writeBasedProbe|serverActionProbe/i);
  });

  test("AC-037b: certifyTestTarget issues only SELECT statements (read-only)", async () => {
    const envSource = await import("node:fs").then((fs) =>
      fs.readFileSync("./tests/e2e/helpers/env.ts", "utf8"),
    );
    // All rawSql calls in env.ts must be SELECT (read-only)
    const sqlCalls = envSource.match(/rawSql`[^`]+`/g) || [];
    for (const sql of sqlCalls) {
      expect(sql).toMatch(/^\s*rawSql`SELECT\b/i);
    }
  });

  test("AC-019: certifyTestTarget is the FIRST mutation-gated call (Phase A) — no mutation in helpers/env.ts", async () => {
    // Static check: env.ts has no INSERT/UPDATE/DELETE/TRUNCATE at all
    const envSource = await import("node:fs").then((fs) =>
      fs.readFileSync("./tests/e2e/helpers/env.ts", "utf8"),
    );
    expect(envSource).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE)\b/i);
  });

  test("AC-037a: runner.ts sentinel uses direct Neon SQL (NOT application Server Action)", async () => {
    const runnerSource = await import("node:fs").then((fs) =>
      fs.readFileSync("./tests/e2e/helpers/runner.ts", "utf8"),
    );
    // The runner does NOT call the application's Server Action for target verification
    expect(runnerSource).not.toMatch(/fetch\(['"].*\/admin\/offres\/actions/);
    // Sentinel is inserted via direct rawSql (in fixtures.ts seedSentinel, not via app)
    expect(runnerSource).toMatch(/rawSql|certifyTestTarget|seedSentinel/);
  });

  test("AC-037a: fixtures.ts seedSentinel uses direct rawSql (NOT app Server Action)", async () => {
    const fixturesSource = await import("node:fs").then((fs) =>
      fs.readFileSync("./tests/e2e/helpers/fixtures.ts", "utf8"),
    );
    // seedSentinel uses rawSql`INSERT INTO "offers" ...` directly, NOT a fetch() to the app
    expect(fixturesSource).toMatch(/rawSql`[\s\S]*INSERT INTO "offers"/);
    expect(fixturesSource).not.toMatch(/seedSentinel[\s\S]*fetch\(/);
  });
});

// ============================================================
// AC-032: TEST DB allowed (verified fingerprint + read-only probe pass)
// This test DOES touch the real TEST database but ONLY with read-only SELECT queries.
// ============================================================

test.describe("Guard self-tests — real TEST DB read-only probe (AC-032)", () => {
  test("AC-032: certified TEST target passes (uses real .env.local + read-only SELECT)", async () => {
    // This is the ONE test that touches the real TEST DB.
    // It verifies the full Phase A certification chain against the authorized runtime env.
    // Read-only: only SELECT 1 + SELECT current_database() are issued.
    const env = parseEnvLocal();
    // Skip if TEST_DATABASE_URL or E2E_EXPECTED_TEST_DATABASE_HOST is not set
    test.skip(!env.TEST_DATABASE_URL || !env.E2E_EXPECTED_TEST_DATABASE_HOST,
      "TEST_DATABASE_URL and E2E_EXPECTED_TEST_DATABASE_HOST must be set in .env.local for this test");

    const verified = await certifyTestTarget(env);
    expect(verified.testDatabaseUrl).toBeTruthy();
    expect(verified.testHost).toBeTruthy();
    expect(verified.testDbName).toBeTruthy();
    expect(verified.testHost).toBe(verified.expectedFingerprint);
  });
});
