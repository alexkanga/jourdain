import { defineConfig, devices } from "@playwright/test";
import { resolveAuthorizedE2EBaseUrl, parseEnvLocal } from "./tests/e2e/helpers/env";

/**
 * Playwright E2E configuration for WP-005 — E2E Test Infrastructure.
 *
 * Per WP-005 contract + §19 remediation (E2E_BASE_URL bypass fix):
 * - Single browser: Chromium only (quota-safety; multi-engine matrix excluded).
 * - Single worker by default (deterministic state over speed).
 * - 0 retries on first run (no flake masking).
 * - Screenshot: on failure only.
 * - Trace: on first retry only (no trace by default).
 * - Video: OFF by default.
 * - Base URL: resolved via resolveAuthorizedE2EBaseUrl() — the CANONICAL
 *   resolver that enforces deterministic env precedence (process.env >
 *   .env.local > default http://127.0.0.1:3100) AND validates/authorizes
 *   the resolved URL. Playwright's use.baseURL is set ONLY from this
 *   authorized value — there is NO direct process.env.E2E_BASE_URL read
 *   that could bypass the guard.
 *
 * The E2E runner (tests/e2e/helpers/runner.ts) calls the SAME resolver so
 * Playwright and the runner consume ONE authoritative effective base URL.
 * If they ever diverge (impossible by construction — same function, same
 * inputs), the runner would STOP with E2E_BASE_URL_DIVERGENCE.
 *
 * Fail-closed: if resolveAuthorizedE2EBaseUrl() throws during config
 * resolution, Playwright's config loading FAILS — no browser launches,
 * no global setup mutation occurs, no request is sent.
 *
 * Quota-safety (AISE S0 v0.2 §26):
 * - APPLICATION RUNTIME: LOCAL (Next.js on 127.0.0.1).
 * - DATABASE / STATE: TEST (TEST_DATABASE_URL, positively verified).
 * - REMOTE E2E: NO (default; opt-in only with explicit override + OWNER authorization).
 * - VERCEL: NO (never in WP-005; MS-006 scope).
 */

// Resolve the authorized effective base URL at config load time.
// If the resolved URL is unauthorized, this throws and Playwright fails
// to load the config — NO browser launches, NO global setup runs, NO
// mutation occurs (fail-closed per §10).
let authorizedBaseUrl: string;
try {
  authorizedBaseUrl = resolveAuthorizedE2EBaseUrl(parseEnvLocal());
} catch (e) {
  // Fail-closed: print the error and re-throw so Playwright config loading aborts.
  console.error(`[playwright.config.ts] E2E base URL authorization FAILED — refusing to load config. No browser will launch. ${(e as Error).message}`);
  throw e;
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "tests/e2e/.artifacts/report.json" }],
  ],
  outputDir: "tests/e2e/.artifacts/",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    // Playwright's use.baseURL is set ONLY from the canonical authorized resolver.
    // There is NO direct process.env.E2E_BASE_URL read here.
    baseURL: authorizedBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
