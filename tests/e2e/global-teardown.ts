/**
 * Playwright globalTeardown — invoked by `playwright test` after all specs finish.
 *
 * Calls e2eTeardown() to shutdown the spawned Next.js server.
 */

import { e2eTeardown } from "./helpers/runner";

export default async function globalTeardown(): Promise<void> {
  await e2eTeardown();
}
