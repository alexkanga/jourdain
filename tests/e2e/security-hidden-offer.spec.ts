/**
 * Security E2E — hidden offer isolation.
 *
 * Per WP-005 §5.14:
 * - DRAFT/SUSPENDED/ARCHIVED offer IDs (stored via fixture) → public list does NOT contain them
 * - public detail → 404 (no status leak)
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const draftId = randomUUID();
const suspendedId = randomUUID();
const archivedId = randomUUID();
const createdIds = [draftId, suspendedId, archivedId];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);
  await createTestOffer(verified.rawSql, {
    id: draftId, title: e2eTitle(RUN_ID, "hidden-draft"), status: "DRAFT",
  });
  await createTestOffer(verified.rawSql, {
    id: suspendedId, title: e2eTitle(RUN_ID, "hidden-suspended"), status: "SUSPENDED",
  });
  await createTestOffer(verified.rawSql, {
    id: archivedId, title: e2eTitle(RUN_ID, "hidden-archived"), status: "ARCHIVED",
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

test("hidden offer isolation — DRAFT not in public list", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(e2eTitle(RUN_ID, "hidden-draft"))).toHaveCount(0);
});

test("hidden offer isolation — SUSPENDED not in public list", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(e2eTitle(RUN_ID, "hidden-suspended"))).toHaveCount(0);
});

test("hidden offer isolation — ARCHIVED not in public list", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(e2eTitle(RUN_ID, "hidden-archived"))).toHaveCount(0);
});

test("hidden offer isolation — DRAFT direct URL → 404 (no status leak)", async ({ page }) => {
  const r = await page.goto(`/offres/${draftId}`);
  expect(r?.status()).toBe(404);
});

test("hidden offer isolation — SUSPENDED direct URL → 404", async ({ page }) => {
  const r = await page.goto(`/offres/${suspendedId}`);
  expect(r?.status()).toBe(404);
});

test("hidden offer isolation — ARCHIVED direct URL → 404", async ({ page }) => {
  const r = await page.goto(`/offres/${archivedId}`);
  expect(r?.status()).toBe(404);
});
