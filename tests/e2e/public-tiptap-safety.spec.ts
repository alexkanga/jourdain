/**
 * Public Tiptap safety E2E — unsafe hrefs not clickable.
 *
 * Per WP-005 §5.12 + §5.14:
 * - Tiptap content with javascript:, data:, vbscript:, file: href
 *   → link text preserved, NOT clickable
 * - http://, https://, mailto: links clickable
 *
 * The fixture inserts an offer with a Tiptap JSON description containing
 * unsafe hrefs. The public detail page renders it via TiptapRenderer.tsx
 * which uses safeHref() to filter schemes.
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { newRunId, e2eTitle, createTestOffer, deleteTestOffer, clearTestRateLimit } from "./helpers/fixtures";

const RUN_ID = newRunId();

function buildTiptapWithLinks(links: { href: string; text: string }[]): unknown {
  return {
    type: "doc",
    content: links.map((l) => ({
      type: "paragraph",
      content: [
        { type: "text", text: "Link: " },
        { type: "text", text: l.text, marks: [{ type: "link", attrs: { href: l.href } }] },
      ],
    })),
  };
}

const unsafeId = randomUUID();
const safeId = randomUUID();
const mailtoId = randomUUID();
const createdIds = [unsafeId, safeId, mailtoId];

test.beforeAll(async () => {
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);

  await createTestOffer(verified.rawSql, {
    id: unsafeId,
    title: e2eTitle(RUN_ID, "tiptap-unsafe"),
    description: buildTiptapWithLinks([
      { href: "javascript:alert(1)", text: "UnsafeJsLink" },
      { href: "data:text/html,<script>alert(1)</script>", text: "UnsafeDataLink" },
      { href: "vbscript:msgbox(1)", text: "UnsafeVbsLink" },
      { href: "file:///etc/passwd", text: "UnsafeFileLink" },
    ]),
    status: "PUBLISHED",
  });

  await createTestOffer(verified.rawSql, {
    id: safeId,
    title: e2eTitle(RUN_ID, "tiptap-safe"),
    description: buildTiptapWithLinks([
      { href: "http://example.com", text: "SafeHttpLink" },
      { href: "https://example.org", text: "SafeHttpsLink" },
    ]),
    status: "PUBLISHED",
  });

  await createTestOffer(verified.rawSql, {
    id: mailtoId,
    title: e2eTitle(RUN_ID, "tiptap-mailto"),
    description: buildTiptapWithLinks([
      { href: "mailto:test@example.com", text: "MailtoLink" },
    ]),
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

test("tiptap safety — unsafe hrefs text preserved but NOT clickable", async ({ page }) => {
  await page.goto(`/offres/${unsafeId}`);
  // The link TEXT is preserved
  await expect(page.getByText("UnsafeJsLink")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("UnsafeDataLink")).toBeVisible();
  await expect(page.getByText("UnsafeVbsLink")).toBeVisible();
  await expect(page.getByText("UnsafeFileLink")).toBeVisible();
  // But there is NO <a> tag with javascript:/data:/vbscript:/file: href
  const unsafeLinks = await page.locator('a[href^="javascript:"], a[href^="data:"], a[href^="vbscript:"], a[href^="file:"]').count();
  expect(unsafeLinks).toBe(0);
});

test("tiptap safety — safe http/https links clickable", async ({ page }) => {
  await page.goto(`/offres/${safeId}`);
  await expect(page.getByRole("link", { name: "SafeHttpLink" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "SafeHttpsLink" })).toBeVisible();
  const httpLink = page.getByRole("link", { name: "SafeHttpLink" });
  const href = await httpLink.getAttribute("href");
  expect(href).toBe("http://example.com");
});

test("tiptap safety — mailto link clickable", async ({ page }) => {
  await page.goto(`/offres/${mailtoId}`);
  const mailtoLink = page.getByRole("link", { name: "MailtoLink" });
  await expect(mailtoLink).toBeVisible({ timeout: 15_000 });
  const href = await mailtoLink.getAttribute("href");
  expect(href).toBe("mailto:test@example.com");
});
