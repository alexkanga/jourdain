/**
 * Security E2E — unsafe stored application_url / source_url.
 *
 * Per WP-005 §5.14:
 * - offer with application_url="javascript:evil()" stored via fixture → no clickable link on detail
 * - offer with application_url="http://safe.example" → clickable
 *
 * Subset of public-url-safety.spec.ts focused on the security boundary.
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const evilId = randomUUID();
const safeId = randomUUID();
const createdIds = [evilId, safeId];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);
  await createTestOffer(verified.rawSql, {
    id: evilId,
    title: e2eTitle(RUN_ID, "sec-url-evil"),
    applicationUrl: "javascript:evil()",
    sourceUrl: "vbscript:msgbox(1)",
    status: "PUBLISHED",
  });
  await createTestOffer(verified.rawSql, {
    id: safeId,
    title: e2eTitle(RUN_ID, "sec-url-safe"),
    applicationUrl: "http://safe.example/apply",
    sourceUrl: "https://safe.example/source",
    status: "PUBLISHED",
  });
});

test.afterAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  for (const id of createdIds) {
    try { await deleteTestOffer(verified.rawSql, id); } catch {}
  }
  await clearTestRateLimit(verified.rawSql);
});

test("security — unsafe application_url + source_url → no clickable unsafe links", async ({ page }) => {
  await page.goto(`/offres/${evilId}`);
  const unsafeAnchors = await page.locator('a[href^="javascript:"], a[href^="vbscript:"], a[href^="data:"], a[href^="file:"]').count();
  expect(unsafeAnchors).toBe(0);
});

test("security — safe http/https → clickable", async ({ page }) => {
  await page.goto(`/offres/${safeId}`);
  const apply = page.getByRole("link", { name: /candidater en ligne/i });
  await expect(apply).toBeVisible({ timeout: 15_000 });
  const source = page.getByRole("link", { name: /voir la source/i });
  await expect(source).toBeVisible();
});
