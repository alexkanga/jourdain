/**
 * Accessibility E2E — axe-core scan.
 *
 * Per WP-005 §5.16:
 * - axe-core scan on public pages (`/`, `/offres/{id}`) and admin pages (`/admin/login`)
 * - Acceptance: no critical axe violations (warnings acceptable; critical violations are blockers)
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const offerId = randomUUID();
const createdIds = [offerId];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);
  await createTestOffer(verified.rawSql, {
    id: offerId,
    title: e2eTitle(RUN_ID, "a11y-detail"),
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

test("accessibility — public root page has no critical axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
});

test("accessibility — public detail page has no critical axe violations", async ({ page }) => {
  await page.goto(`/offres/${offerId}`);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
});

test("accessibility — admin login page has no critical axe violations", async ({ page }) => {
  await page.goto("/admin/login");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
});
