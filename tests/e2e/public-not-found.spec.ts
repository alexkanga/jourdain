/**
 * Public not-found E2E — 404 behavior.
 *
 * Per WP-005 §5.12:
 * - direct URL to hidden (DRAFT/SUSPENDED/ARCHIVED) → 404
 * - nonexistent UUID → 404
 * - malformed UUID → 404 (no DB query)
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
    id: draftId,
    title: e2eTitle(RUN_ID, "not-found-draft"),
    status: "DRAFT",
  });
  await createTestOffer(verified.rawSql, {
    id: suspendedId,
    title: e2eTitle(RUN_ID, "not-found-suspended"),
    status: "SUSPENDED",
  });
  await createTestOffer(verified.rawSql, {
    id: archivedId,
    title: e2eTitle(RUN_ID, "not-found-archived"),
    status: "ARCHIVED",
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

test("not-found — DRAFT offer direct URL → 404", async ({ page }) => {
  const response = await page.goto(`/offres/${draftId}`);
  expect(response?.status()).toBe(404);
});

test("not-found — SUSPENDED offer direct URL → 404", async ({ page }) => {
  const response = await page.goto(`/offres/${suspendedId}`);
  expect(response?.status()).toBe(404);
});

test("not-found — ARCHIVED offer direct URL → 404", async ({ page }) => {
  const response = await page.goto(`/offres/${archivedId}`);
  expect(response?.status()).toBe(404);
});

test("not-found — nonexistent UUID → 404", async ({ page }) => {
  const fakeUuid = "00000000-0000-4000-8000-000000000000";
  const response = await page.goto(`/offres/${fakeUuid}`);
  expect(response?.status()).toBe(404);
});

test("not-found — malformed UUID → 404 (no DB query needed)", async ({ page }) => {
  const response = await page.goto("/offres/not-a-uuid");
  expect(response?.status()).toBe(404);
});
