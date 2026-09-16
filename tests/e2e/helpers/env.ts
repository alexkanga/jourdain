/**
 * E2E environment target verification — Phase A (read-only, before any mutation).
 *
 * Per WP-005 contract §5.5 Phase A + §16 Mutation Ordering Invariant:
 * - IDENTIFY target → VERIFY target identity → AUTHORIZE target for mutation → MUTATE
 * - NO state mutation before target certification.
 *
 * This module performs ONLY read-only operations (no write SQL).
 * It reads TEST_DATABASE_URL, validates the URL, compares the host fingerprint,
 * runs read-only SELECT probes, and returns the verified target.
 *
 * If any check fails, the runner STOPs with a specific error code.
 * The runner (helpers/runner.ts) performs mutations only after this module returns.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

/**
 * Error codes for fail-closed behavior.
 * Each corresponds to a specific AC criterion in the WP-005 contract.
 */
export const E2E_ERRORS = {
  MISSING_TEST_DATABASE_URL: "MISSING_TEST_DATABASE_URL",
  TEST_UNSUPPORTED_SCHEME: "TEST_UNSUPPORTED_SCHEME",
  TEST_IS_SQLITE_FALLBACK: "TEST_IS_SQLITE_FALLBACK",
  MISSING_EXPECTED_TEST_FINGERPRINT: "MISSING_EXPECTED_TEST_FINGERPRINT",
  TEST_FINGERPRINT_MISMATCH: "TEST_FINGERPRINT_MISMATCH",
  TEST_EQUALS_DEV: "TEST_EQUALS_DEV",
  TEST_EQUALS_PROD: "TEST_EQUALS_PROD",
  TEST_DB_UNREACHABLE: "TEST_DB_UNREACHABLE",
  REMOTE_BASE_URL_NOT_AUTHORIZED: "REMOTE_BASE_URL_NOT_AUTHORIZED",
  APP_DB_DIVERGENCE: "APP_DB_DIVERGENCE",
} as const;

export type E2eErrorCode = (typeof E2E_ERRORS)[keyof typeof E2E_ERRORS];

export class E2eTargetError extends Error {
  code: E2eErrorCode;
  constructor(code: E2eErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = "E2eTargetError";
    this.code = code;
  }
}

/**
 * Parse .env.local into a Record<string, string>.
 * Same pattern as __tests__/auth-regression.test.ts parseEnvLocal().
 */
export function parseEnvLocal(): Record<string, string> {
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

/**
 * Extract hostname from a postgresql:// URL.
 * Returns the lowercase hostname (e.g., "ep-gentle-rice-xxx.aws.neon.tech").
 */
export function hostnameOf(postgresUrl: string): string {
  try {
    const u = new URL(postgresUrl);
    return u.hostname.toLowerCase();
  } catch {
    throw new E2eTargetError(
      E2E_ERRORS.TEST_UNSUPPORTED_SCHEME,
      `TEST_DATABASE_URL is not a valid URL: ${postgresUrl.slice(0, 60)}...`,
    );
  }
}

/**
 * Verified TEST target — produced by Phase A certification.
 */
export interface VerifiedTestTarget {
  testDatabaseUrl: string;
  testHost: string;
  testDbName: string;
  expectedFingerprint: string;
  rawSql: NeonQueryFunction<false, false>;
}

/**
 * PHASE A — read-only target certification.
 *
 * Performs ONLY read-only SQL. No state mutation occurs in this function.
 * Throws E2eTargetError on any failure (fail-closed).
 *
 * Per AC-010 through AC-019, AC-037b:
 * - AC-010: reads TEST_DATABASE_URL from .env.local, returns it for explicit child env injection.
 * - AC-011: missing TEST_DATABASE_URL → MISSING_TEST_DATABASE_URL.
 * - AC-012: invalid URL scheme → TEST_UNSUPPORTED_SCHEME / TEST_IS_SQLITE_FALLBACK.
 * - AC-012a: positive fingerprint comparison; missing fingerprint → MISSING_EXPECTED_TEST_FINGERPRINT.
 * - AC-013: TEST host == DEV host → TEST_EQUALS_DEV.
 * - AC-014: TEST host == PROD host → TEST_EQUALS_PROD.
 * - AC-015: unreachable → TEST_DB_UNREACHABLE.
 * - AC-016: non-loopback base URL without override → REMOTE_BASE_URL_NOT_AUTHORIZED.
 * - AC-018: parent DATABASE_URL is overridden by the runner (not by this module — this module
 *           only RETURNS the verified value; the runner injects it).
 * - AC-019 + AC-037b: NO mutation in this module (read-only).
 */
export async function certifyTestTarget(
  env: Record<string, string>,
): Promise<VerifiedTestTarget> {
  // Step 1-2: Resolve TEST_DATABASE_URL
  const testDatabaseUrl = env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new E2eTargetError(
      E2E_ERRORS.MISSING_TEST_DATABASE_URL,
      "TEST_DATABASE_URL must be set in .env.local for E2E execution.",
    );
  }

  // Step 3: URL type/scheme validation
  if (testDatabaseUrl.startsWith("file:")) {
    throw new E2eTargetError(
      E2E_ERRORS.TEST_IS_SQLITE_FALLBACK,
      `TEST_DATABASE_URL scheme is file: (SQLite fallback) — refused for E2E. Value: ${testDatabaseUrl.slice(0, 60)}...`,
    );
  }
  if (!testDatabaseUrl.startsWith("postgresql://")) {
    throw new E2eTargetError(
      E2E_ERRORS.TEST_UNSUPPORTED_SCHEME,
      `TEST_DATABASE_URL scheme must be postgresql:// — got: ${testDatabaseUrl.slice(0, 30)}...`,
    );
  }

  // Step 4: Extract actual TEST hostname
  const testHost = hostnameOf(testDatabaseUrl);

  // Step 5: Resolve E2E_EXPECTED_TEST_DATABASE_HOST from the authorized environment
  // NOT from .env.example fallback. NOT inferred from TEST_DATABASE_URL itself.
  const expectedFingerprint = env.E2E_EXPECTED_TEST_DATABASE_HOST;
  if (!expectedFingerprint || expectedFingerprint.trim() === "") {
    throw new E2eTargetError(
      E2E_ERRORS.MISSING_EXPECTED_TEST_FINGERPRINT,
      "E2E_EXPECTED_TEST_DATABASE_HOST must be explicitly set in the authorized execution environment (.env.local for local developer runs, or explicitly injected process env for CI). No .env.example fallback. No inference from TEST_DATABASE_URL.",
    );
  }

  // Step 5b: Positive fingerprint comparison
  const expectedHost = expectedFingerprint.trim().toLowerCase();
  if (testHost !== expectedHost) {
    throw new E2eTargetError(
      E2E_ERRORS.TEST_FINGERPRINT_MISMATCH,
      `hostname(TEST_DATABASE_URL)="${testHost}" does NOT equal E2E_EXPECTED_TEST_DATABASE_HOST="${expectedHost}". Refused — positive target identity not established.`,
    );
  }

  // Step 6: TEST != DEV (when DEV known)
  const devUrl = env.DEV_DATABASE_URL;
  if (devUrl && devUrl.startsWith("postgresql://")) {
    const devHost = hostnameOf(devUrl);
    if (testHost === devHost) {
      throw new E2eTargetError(
        E2E_ERRORS.TEST_EQUALS_DEV,
        `TEST_DATABASE_URL host "${testHost}" equals DEV_DATABASE_URL host — refused for E2E. TEST must be a distinct target from DEV.`,
      );
    }
  }

  // Step 7: TEST != PROD (when PROD known)
  const prodUrl = env.PROD_DATABASE_URL;
  if (prodUrl && prodUrl.startsWith("postgresql://")) {
    const prodHost = hostnameOf(prodUrl);
    if (testHost === prodHost) {
      throw new E2eTargetError(
        E2E_ERRORS.TEST_EQUALS_PROD,
        `TEST_DATABASE_URL host "${testHost}" equals PROD_DATABASE_URL host — refused for E2E. Production is never an E2E target.`,
      );
    }
  }

  // Steps 9-10: Read-only connectivity/identity probes.
  // These queries do NOT mutate state.
  const rawSql = neon(testDatabaseUrl);
  let testDbName: string;
  try {
    const r1 = await rawSql`SELECT 1 AS one`;
    if (!r1 || r1.length === 0) {
      throw new E2eTargetError(
        E2E_ERRORS.TEST_DB_UNREACHABLE,
        "SELECT 1 AS one returned no rows on TEST_DATABASE_URL.",
      );
    }
  } catch (e) {
    if (e instanceof E2eTargetError) throw e;
    throw new E2eTargetError(
      E2E_ERRORS.TEST_DB_UNREACHABLE,
      `Could not reach TEST_DATABASE_URL: ${(e as Error).message}`,
    );
  }
  try {
    const r2 = await rawSql`SELECT current_database() AS db, current_setting('server_version') AS version`;
    testDbName = (r2[0] as { db: string }).db;
  } catch (e) {
    throw new E2eTargetError(
      E2E_ERRORS.TEST_DB_UNREACHABLE,
      `Could not read current_database() on TEST_DATABASE_URL: ${(e as Error).message}`,
    );
  }

  return {
    testDatabaseUrl,
    testHost,
    testDbName,
    expectedFingerprint: expectedHost,
    rawSql,
  };
}

/**
 * Base URL policy check (AC-016 + AC-037c).
 *
 * Returns the authorized base URL or throws REMOTE_BASE_URL_NOT_AUTHORIZED.
 *
 * Default: loopback only (localhost, 127.0.0.1, ::1).
 * Remote requires E2E_ALLOW_REMOTE=1 + E2E_REMOTE_BASE_URL + E2E_REMOTE_AUTHORIZATION_REF
 * (all three), AND E2E_BASE_URL must equal E2E_REMOTE_BASE_URL after normalization.
 *
 * @deprecated Use resolveAuthorizedE2EBaseUrl() instead — it provides
 * deterministic env precedence (process.env > .env.local > default) and is
 * shared by both playwright.config.ts and runner.ts so there is ONE
 * authoritative effective base URL (per WP-005 §19 remediation).
 */
export function authorizeBaseUrl(env: Record<string, string>): string {
  const baseUrl = env.E2E_BASE_URL || "http://127.0.0.1:3100";
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_BASE_URL is not a valid URL: ${baseUrl}`,
    );
  }
  const hostname = parsed.hostname.toLowerCase();
  // Reject URLs with userinfo (e.g., "localhost@evil.example")
  if (parsed.username || parsed.password) {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_BASE_URL contains userinfo (username/password) — refused: ${baseUrl}`,
    );
  }
  // Reject unsupported schemes (only http/https allowed)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_BASE_URL scheme "${parsed.protocol}" unsupported — only http: and https: allowed: ${baseUrl}`,
    );
  }
  // Reject deceptive hostnames (e.g., "localhost.example.com")
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";
  if (isLoopback) {
    return baseUrl;
  }
  // Non-loopback: requires all three override variables AND exact match
  const allowRemote = env.E2E_ALLOW_REMOTE === "1";
  const remoteBaseUrl = env.E2E_REMOTE_BASE_URL;
  const remoteAuthRef = env.E2E_REMOTE_AUTHORIZATION_REF;
  if (!allowRemote || !remoteBaseUrl || !remoteAuthRef || remoteAuthRef.trim() === "") {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_BASE_URL "${baseUrl}" is non-loopback. Remote E2E requires E2E_ALLOW_REMOTE=1 + E2E_REMOTE_BASE_URL + E2E_REMOTE_AUTHORIZATION_REF (all three set). Got: allow=${allowRemote}, remoteUrl=${remoteBaseUrl ? "set" : "unset"}, authRef=${remoteAuthRef ? "set" : "unset"}.`,
    );
  }
  // Compare E2E_BASE_URL to E2E_REMOTE_BASE_URL after URL normalization.
  // E2E_BASE_URL must correspond to the explicitly authorized E2E_REMOTE_BASE_URL.
  let remoteParsed: URL;
  try {
    remoteParsed = new URL(remoteBaseUrl);
  } catch {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_REMOTE_BASE_URL is not a valid URL: ${remoteBaseUrl}`,
    );
  }
  if (remoteParsed.username || remoteParsed.password) {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_REMOTE_BASE_URL contains userinfo — refused: ${remoteBaseUrl}`,
    );
  }
  if (remoteParsed.protocol !== "http:" && remoteParsed.protocol !== "https:") {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_REMOTE_BASE_URL scheme "${remoteParsed.protocol}" unsupported: ${remoteBaseUrl}`,
    );
  }
  // Normalize both URLs and compare (protocol + hostname + port)
  const normalize = (u: URL) => `${u.protocol}//${u.hostname.toLowerCase()}:${u.port || (u.protocol === "https:" ? "443" : "80")}`;
  if (normalize(parsed) !== normalize(remoteParsed)) {
    throw new E2eTargetError(
      E2E_ERRORS.REMOTE_BASE_URL_NOT_AUTHORIZED,
      `E2E_BASE_URL "${baseUrl}" does NOT match E2E_REMOTE_BASE_URL "${remoteBaseUrl}" after normalization. Refused — remote target mismatch.`,
    );
  }
  // Override accepted — log target/class/purpose/expected volume in the report.
  // (Actual remote execution still requires separate OWNER authorization — not exercised by S10.)
  return baseUrl;
}

/**
 * Default E2E base URL (loopback) when no explicit E2E_BASE_URL is provided.
 */
export const DEFAULT_E2E_BASE_URL = "http://127.0.0.1:3100";

/**
 * Resolve the effective E2E base URL with deterministic environment precedence.
 *
 * Per WP-005 §19 remediation (E2E_BASE_URL bypass fix):
 * - process.env (explicit shell env) takes precedence over .env.local
 * - .env.local takes precedence over DEFAULT_E2E_BASE_URL
 * - The resolved value is then VALIDATED and AUTHORIZED by authorizeBaseUrl()
 * - The SAME resolved value is used by BOTH playwright.config.ts and runner.ts
 *
 * This is the CANONICAL resolver — there is no other base URL reader.
 * playwright.config.ts MUST NOT read process.env.E2E_BASE_URL directly;
 * it MUST call this function.
 *
 * @param envLocal - the .env.local record (from parseEnvLocal())
 * @returns the authorized effective base URL (validated, loopback-or-override)
 * @throws E2eTargetError if the resolved base URL is unauthorized.
 */
export function resolveAuthorizedE2EBaseUrl(
  envLocal: Record<string, string> = {},
): string {
  // Deterministic precedence: process.env > .env.local > default
  const resolvedBaseUrl =
    process.env.E2E_BASE_URL ||
    envLocal.E2E_BASE_URL ||
    DEFAULT_E2E_BASE_URL;
  // Build a unified env record for the authorizer that includes ALL relevant
  // remote-override variables from BOTH sources (process.env takes precedence).
  const unifiedEnv: Record<string, string> = {
    E2E_BASE_URL: resolvedBaseUrl,
    E2E_ALLOW_REMOTE:
      process.env.E2E_ALLOW_REMOTE || envLocal.E2E_ALLOW_REMOTE || "",
    E2E_REMOTE_BASE_URL:
      process.env.E2E_REMOTE_BASE_URL || envLocal.E2E_REMOTE_BASE_URL || "",
    E2E_REMOTE_AUTHORIZATION_REF:
      process.env.E2E_REMOTE_AUTHORIZATION_REF ||
      envLocal.E2E_REMOTE_AUTHORIZATION_REF ||
      "",
  };
  return authorizeBaseUrl(unifiedEnv);
}

/**
 * Construct the curated child process environment for the Next.js application.
 *
 * Per WP-005 §5.3 rule 3-4 + AC-018 + AC-037:
 * - Build the child env from a curated allowlist (NOT wholesale parent env inheritance).
 * - Remove/override any inherited parent DATABASE_URL.
 * - Inject DATABASE_URL=$TEST_DATABASE_URL (positively verified TEST value).
 * - Do NOT leak production-specific credentials.
 *
 * @param parentEnv - the parent process env (process.env)
 * @param verified - the verified TEST target (from certifyTestTarget)
 * @param authEnv - the .env.local record (from parseEnvLocal())
 * @param baseUrl - the authorized effective base URL (from resolveAuthorizedE2EBaseUrl).
 *                  Used to set BETTER_AUTH_URL + NEXT_PUBLIC_SITE_URL so Better Auth
 *                  accepts the actual server origin. If omitted, defaults to
 *                  http://127.0.0.1:3100 (must match the spawned server port).
 */
export function buildChildEnv(
  parentEnv: NodeJS.ProcessEnv,
  verified: VerifiedTestTarget,
  authEnv: Record<string, string>,
  baseUrl: string = "http://127.0.0.1:3100",
): NodeJS.ProcessEnv {
  // Curated allowlist: only what the application actually needs.
  const childEnv: NodeJS.ProcessEnv = {
    // Explicit TEST database injection — overrides any inherited parent value.
    DATABASE_URL: verified.testDatabaseUrl,
    // Better Auth — MUST match the actual server URL so Better Auth accepts
    // the browser origin. The authorized baseUrl is the same URL Playwright
    // and the runner use (per §19 remediation — single source of truth).
    BETTER_AUTH_SECRET: authEnv.BETTER_AUTH_SECRET || parentEnv.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: baseUrl,
    // Bootstrap identities
    INITIAL_ADMIN_LOGIN: authEnv.INITIAL_ADMIN_LOGIN || "admin1",
    INITIAL_ADMIN_PASSWORD: authEnv.INITIAL_ADMIN_PASSWORD,
    INITIAL_ADMIN_EMAIL: authEnv.INITIAL_ADMIN_EMAIL || "admin1@jourdain.local",
    FANTOMAS_INITIAL_PASSWORD: authEnv.FANTOMAS_INITIAL_PASSWORD,
    FANTOMAS_EMAIL: authEnv.FANTOMAS_EMAIL || "fantomas@jourdain.local",
    // Public site URL — same as base URL for local E2E
    NEXT_PUBLIC_SITE_URL: baseUrl,
    // Standard Node env
    NODE_ENV: "production",
    PATH: parentEnv.PATH || process.env.PATH,
    HOME: parentEnv.HOME || process.env.HOME,
  };

  // CRITICAL: do NOT forward parentEnv.DATABASE_URL even if it exists.
  // The child env only has DATABASE_URL = verified TEST value (set above).
  // Per WP-005 §5.3 rule 7 (frozen): the child process MUST NOT trust inherited DATABASE_URL.

  return childEnv;
}
