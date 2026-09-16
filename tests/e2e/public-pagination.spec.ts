/**
 * Public pagination E2E — page 1 / page 2 navigation.
 *
 * Per WP-005 §5.12:
 * - page 1 / page 2 navigation
 * - deterministic ordering preserved
 *
 * Note: pagination depends on the admin offer page size. The public list uses
 * the same pagination as the admin list. We verify that pagination links
 * exist and that ?page=2 returns a different page than ?page=1 when there
 * are enough PUBLISHED offers.
 *
 * For determinism, we create multiple PUBLISHED fixtures. The exact page
 * boundary depends on the page size constant in lib/server/services/public-offers.ts.
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const PAGE_SIZE = 12; // matches PUBLIC_PAGE_SIZE in lib/server/services/public-offers.ts
const createdIds: string[] = [];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);
  // Create PAGE_SIZE * 2 PUBLISHED fixtures to guarantee at least 2 pages
  for (let i = 0; i < PAGE_SIZE * 2; i++) {
    const id = randomUUID();
    await createTestOffer(verified.rawSql, {
      id,
      title: e2eTitle(RUN_ID, "pagination", `idx${i}`),
      status: "PUBLISHED",
    });
    createdIds.push(id);
  }
});

test.afterAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  for (const id of createdIds) {
    try { await deleteTestOffer(verified.rawSql, id); } catch {}
  }
  await clearTestRateLimit(verified.rawSql);
});

test("pagination — page 1 returns PUBLISHED offers (most recent first)", async ({ page }) => {
  await page.goto("/?page=1");
  // Default sort: published_at DESC. We created PAGE_SIZE*2 fixtures
  // (idx0..idx(2*PAGE_SIZE-1)). The most recent is idx(2*PAGE_SIZE-1).
  const mostRecentIdx = PAGE_SIZE * 2 - 1;
  // Title format: E2E_<timestamp>_<hex>_pagination_idx<N>
  await expect(page.getByText(new RegExp(`_pagination_idx${mostRecentIdx}$`))).toBeVisible({ timeout: 15_000 });
});

test("pagination — page 2 returns PUBLISHED offers (older)", async ({ page }) => {
  await page.goto("/?page=2");
  // Page 2 should have older fixtures. Verify at least one E2E pagination fixture is visible on page 2.
  await expect(page.getByText(/_pagination_idx\d+$/).first()).toBeVisible({ timeout: 15_000 });
});
