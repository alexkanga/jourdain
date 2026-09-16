/**
 * Public search E2E — `?q=` parameter.
 *
 * Per WP-005 §5.12:
 * - search matches title
 * - matches company
 * - matches location
 * - empty search returns full list
 * - search never returns hidden offers
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const titleId = randomUUID();
const companyId = randomUUID();
const locationId = randomUUID();
const hiddenId = randomUUID();
const createdIds = [titleId, companyId, locationId, hiddenId];

const TITLE_QUERY = `E2ETitleMatch${RUN_ID}`;
const COMPANY_QUERY = `E2ECompanyMatch${RUN_ID}`;
const LOCATION_QUERY = `E2ELocMatch${RUN_ID}`;

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);

  await createTestOffer(verified.rawSql, {
    id: titleId,
    title: e2eTitle(RUN_ID, `${TITLE_QUERY}`),
    status: "PUBLISHED",
  });
  await createTestOffer(verified.rawSql, {
    id: companyId,
    title: e2eTitle(RUN_ID, "search-by-company"),
    company: COMPANY_QUERY,
    status: "PUBLISHED",
  });
  await createTestOffer(verified.rawSql, {
    id: locationId,
    title: e2eTitle(RUN_ID, "search-by-location"),
    location: LOCATION_QUERY,
    status: "PUBLISHED",
  });
  await createTestOffer(verified.rawSql, {
    id: hiddenId,
    title: e2eTitle(RUN_ID, `${TITLE_QUERY}Hidden`),
    status: "DRAFT",
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

test("search — title match returns PUBLISHED offer", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent(TITLE_QUERY)}`);
  await expect(page.getByText(e2eTitle(RUN_ID, TITLE_QUERY))).toBeVisible({ timeout: 15_000 });
});

test("search — company match returns PUBLISHED offer", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent(COMPANY_QUERY)}`);
  await expect(page.getByText(e2eTitle(RUN_ID, "search-by-company"))).toBeVisible({ timeout: 15_000 });
});

test("search — location match returns PUBLISHED offer", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent(LOCATION_QUERY)}`);
  await expect(page.getByText(e2eTitle(RUN_ID, "search-by-location"))).toBeVisible({ timeout: 15_000 });
});

test("search — never returns hidden-status offers", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent(TITLE_QUERY)}`);
  // PUBLISHED title-match offer should be visible
  await expect(page.getByText(e2eTitle(RUN_ID, TITLE_QUERY))).toBeVisible();
  // DRAFT title-match offer should NOT be visible
  await expect(page.getByText(e2eTitle(RUN_ID, `${TITLE_QUERY}Hidden`))).toHaveCount(0);
});
