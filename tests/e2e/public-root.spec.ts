/**
 * Public root E2E — anonymous visit to `/`.
 *
 * Per WP-005 §5.12:
 * - PUBLISHED offers visible
 * - empty state when no PUBLISHED
 * - cards show title + company (if present) + location (if present) + contract_type (if present) + published_at + "Voir l'offre" link
 */

import { test, expect } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit, cleanupOrphanFixtures } from "./helpers/fixtures";

const RUN_ID = newRunId();
const createdIds: string[] = [];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);
  // Create a PUBLISHED fixture so the root page has at least one offer to show.
  const id = randomUUID();
  await createTestOffer(verified.rawSql, {
    id,
    title: e2eTitle(RUN_ID, "public-root-published"),
    company: "E2E Company",
    location: "E2E City",
    contractType: "CDI",
    status: "PUBLISHED",
  });
  createdIds.push(id);
});

test.afterAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  for (const id of createdIds) {
    try { await deleteTestOffer(verified.rawSql, id); } catch {}
  }
  await clearTestRateLimit(verified.rawSql);
});

test("public root — PUBLISHED fixture visible in list", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(e2eTitle(RUN_ID, "public-root-published"))).toBeVisible({ timeout: 15_000 });
});

test("public root — card shows 'Voir l'offre' link", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("article, [class*='card']").filter({ hasText: e2eTitle(RUN_ID, "public-root-published") }).first();
  await expect(card.getByRole("link", { name: /voir l'offre/i })).toBeVisible();
});

test("public root — page heading visible", async ({ page }) => {
  await page.goto("/");
  // Some kind of heading or title should be present (h1 or page metadata)
  await expect(page).toHaveTitle(/jourdain|offres/i);
});

test("public root — anonymous access works (no auth required)", async ({ page }) => {
  // Visiting / should NOT redirect to /admin/login
  const response = await page.goto("/");
  expect(response?.status()).not.toBe(401);
  expect(response?.status()).not.toBe(403);
  expect(page.url()).not.toMatch(/\/admin\/login/);
});
