/**
 * Security E2E — Tiptap href safety.
 *
 * Per WP-005 §5.14:
 * - Tiptap content with javascript:alert(1) href → link text present, NO clickable anchor
 * - https://example.com → clickable
 *
 * This is a focused subset of public-tiptap-safety.spec.ts — kept separate
 * because security E2E should explicitly test the security boundary.
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();
const jsId = randomUUID();
const safeId = randomUUID();
const createdIds = [jsId, safeId];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);

  await createTestOffer(verified.rawSql, {
    id: jsId,
    title: e2eTitle(RUN_ID, "sec-tiptap-js"),
    description: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "SecurityJsAnchor", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
          ],
        },
      ],
    },
    status: "PUBLISHED",
  });

  await createTestOffer(verified.rawSql, {
    id: safeId,
    title: e2eTitle(RUN_ID, "sec-tiptap-safe"),
    description: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "SecuritySafeAnchor", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
          ],
        },
      ],
    },
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

test("security — javascript: href text present but NO clickable anchor", async ({ page }) => {
  await page.goto(`/offres/${jsId}`);
  await expect(page.getByText("SecurityJsAnchor")).toBeVisible({ timeout: 15_000 });
  const jsAnchors = await page.locator('a[href^="javascript:"]').count();
  expect(jsAnchors).toBe(0);
});

test("security — https:// href clickable", async ({ page }) => {
  await page.goto(`/offres/${safeId}`);
  const link = page.getByRole("link", { name: "SecuritySafeAnchor" });
  await expect(link).toBeVisible({ timeout: 15_000 });
  const href = await link.getAttribute("href");
  expect(href).toBe("https://example.com");
});
