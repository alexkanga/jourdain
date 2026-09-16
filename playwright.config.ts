import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for WP-005 — E2E Test Infrastructure.
 *
 * Per WP-005 contract:
 * - Single browser: Chromium only (quota-safety; multi-engine matrix excluded).
 * - Single worker by default (deterministic state over speed).
 * - 0 retries on first run (no flake masking).
 * - Screenshot: on failure only.
 * - Trace: on first retry only (no trace by default).
 * - Video: OFF by default.
 * - Base URL: loopback only (http://127.0.0.1:3000).
 *
 * The E2E runner (tests/e2e/helpers/runner.ts) is responsible for:
 * - Phase A target verification (read-only) before any mutation.
 * - Spawning the local Next.js production server against TEST database.
 * - Phase B optional SAFE sentinel confirmation.
 * - Shutting down the server and cleaning up fixtures.
 *
 * Quota-safety (AISE S0 v0.2 §26):
 * - APPLICATION RUNTIME: LOCAL (Next.js on 127.0.0.1).
 * - DATABASE / STATE: TEST (TEST_DATABASE_URL, positively verified).
 * - REMOTE E2E: NO (default; opt-in only with explicit override + OWNER authorization).
 * - VERCEL: NO (never in WP-005; MS-006 scope).
 */

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
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3100",
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
