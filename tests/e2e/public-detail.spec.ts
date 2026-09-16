/**
 * Public detail E2E — `/offres/{id}`.
 *
 * Per WP-005 §5.12:
 * - click "Voir l'offre" → detail page renders all PUBLISHED fields
 * - Tiptap content preserved
 * - "Entreprise non communiquée" when company absent (BR-033)
 * - no Apply button
 * - source block visible when source_name/source_url present
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const withCompanyId = randomUUID();
const noCompanyId = randomUUID();
const withSourceId = randomUUID();
const createdIds = [withCompanyId, noCompanyId, withSourceId];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);

  await createTestOffer(verified.rawSql, {
    id: withCompanyId,
    title: e2eTitle(RUN_ID, "detail-with-company"),
    company: "E2E Company A",
    location: "E2E City",
    status: "PUBLISHED",
  });

  await createTestOffer(verified.rawSql, {
    id: noCompanyId,
    title: e2eTitle(RUN_ID, "detail-no-company"),
    company: null,
    status: "PUBLISHED",
  });

  await createTestOffer(verified.rawSql, {
    id: withSourceId,
    title: e2eTitle(RUN_ID, "detail-with-source"),
    sourceName: "E2E Source",
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

test("detail — PUBLISHED offer visible with title", async ({ page }) => {
  await page.goto(`/offres/${withCompanyId}`);
  await expect(page.getByRole("heading", { name: e2eTitle(RUN_ID, "detail-with-company") })).toBeVisible({ timeout: 15_000 });
});

test("detail — company displayed when present", async ({ page }) => {
  await page.goto(`/offres/${withCompanyId}`);
  await expect(page.getByText("E2E Company A")).toBeVisible();
});

test("detail — 'Entreprise non communiquée' when company absent (BR-033)", async ({ page }) => {
  await page.goto(`/offres/${noCompanyId}`);
  await expect(page.getByText(/entreprise non communiquée/i)).toBeVisible({ timeout: 15_000 });
});

test("detail — no Apply button (BR-040)", async ({ page }) => {
  await page.goto(`/offres/${withCompanyId}`);
  // Verify no element with "Postuler" or "Apply" text
  await expect(page.getByRole("button", { name: /postuler|apply/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /postuler|apply/i })).toHaveCount(0);
});

test("detail — source block visible when source_name/source_url present", async ({ page }) => {
  await page.goto(`/offres/${withSourceId}`);
  await expect(page.getByText("E2E Source")).toBeVisible({ timeout: 15_000 });
});

test("detail — safe http source_url clickable", async ({ page }) => {
  await page.goto(`/offres/${withSourceId}`);
  // The source block renders a "Voir la source" link with href = the source_url
  const sourceLink = page.getByRole("link", { name: /voir la source/i });
  await expect(sourceLink).toBeVisible({ timeout: 15_000 });
  const href = await sourceLink.getAttribute("href");
  expect(href).toBe("https://example.com/source");
});
