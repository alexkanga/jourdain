/**
 * Public URL safety E2E — unsafe application_url / source_url not clickable.
 *
 * Per WP-005 §5.12 + §5.14:
 * - offer with unsafe application_url or source_url stored in TEST (via fixture)
 *   → link omitted on detail page
 * - safe http:// / https:// → link present and clickable
 *
 * Note: save-time Zod validation (safeUrlField) already rejects unsafe URLs at
 * the admin form boundary. However, to verify the RENDER-TIME defense in depth
 * (safeHttpUrl in OfferDetail.tsx), we insert the fixture directly into TEST
 * via the runner's verified Neon SQL connection (bypassing the admin form).
 * This is the canonical way to test the render-time layer independently.
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const unsafeAppUrlId = randomUUID();
const unsafeSourceUrlId = randomUUID();
const safeUrlsId = randomUUID();
const createdIds = [unsafeAppUrlId, unsafeSourceUrlId, safeUrlsId];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);

  await createTestOffer(verified.rawSql, {
    id: unsafeAppUrlId,
    title: e2eTitle(RUN_ID, "url-unsafe-app"),
    applicationUrl: "javascript:alert(1)",
    status: "PUBLISHED",
  });

  await createTestOffer(verified.rawSql, {
    id: unsafeSourceUrlId,
    title: e2eTitle(RUN_ID, "url-unsafe-source"),
    sourceUrl: "javascript:evil()",
    status: "PUBLISHED",
  });

  await createTestOffer(verified.rawSql, {
    id: safeUrlsId,
    title: e2eTitle(RUN_ID, "url-safe"),
    applicationUrl: "https://example.com/apply",
    sourceUrl: "https://example.com/source",
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

test("URL safety — unsafe application_url → no clickable link on detail", async ({ page }) => {
  await page.goto(`/offres/${unsafeAppUrlId}`);
  await expect(page.getByRole("heading", { name: e2eTitle(RUN_ID, "url-unsafe-app") })).toBeVisible({ timeout: 15_000 });
  // No anchor with javascript: href
  const unsafeLinks = await page.locator('a[href^="javascript:"], a[href^="data:"], a[href^="vbscript:"], a[href^="file:"]').count();
  expect(unsafeLinks).toBe(0);
});

test("URL safety — unsafe source_url → no clickable link on detail", async ({ page }) => {
  await page.goto(`/offres/${unsafeSourceUrlId}`);
  await expect(page.getByRole("heading", { name: e2eTitle(RUN_ID, "url-unsafe-source") })).toBeVisible({ timeout: 15_000 });
  const unsafeLinks = await page.locator('a[href^="javascript:"], a[href^="data:"], a[href^="vbscript:"], a[href^="file:"]').count();
  expect(unsafeLinks).toBe(0);
});

test("URL safety — safe http/https application_url + source_url clickable", async ({ page }) => {
  await page.goto(`/offres/${safeUrlsId}`);
  // application_url is rendered as "Candidater en ligne" link
  const applyLink = page.getByRole("link", { name: /candidater en ligne/i });
  await expect(applyLink).toBeVisible({ timeout: 15_000 });
  const applyHref = await applyLink.getAttribute("href");
  expect(applyHref).toBe("https://example.com/apply");
  // source_url is rendered as "Voir la source" link
  const sourceLink = page.getByRole("link", { name: /voir la source/i });
  await expect(sourceLink).toBeVisible();
  const sourceHref = await sourceLink.getAttribute("href");
  expect(sourceHref).toBe("https://example.com/source");
});
