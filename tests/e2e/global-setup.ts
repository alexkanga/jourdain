/**
 * Playwright globalSetup — invoked by `playwright test` before any spec runs.
 *
 * Calls e2e_setup() to perform Phase A target verification + build + spawn
 * the local Next.js production server against the verified TEST target.
 *
 * On failure, the whole E2E run aborts (fail-closed).
 */

import { e2eSetup } from "./helpers/runner";

export default async function globalSetup(): Promise<void> {
  await e2eSetup();
}
