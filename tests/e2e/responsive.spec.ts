/**
 * Responsive E2E — mobile viewport.
 *
 * Per WP-005 §5.17:
 * - Public pages render correctly on mobile viewport (e.g., 375x667 — iPhone SE)
 * - No horizontal scroll, no overlapping elements, no clipped content
 */

import { test, expect } from "@playwright/test";

test("responsive — public root renders on mobile viewport (375x667)", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.goto("/");
  // No horizontal scroll: scrollWidth <= clientWidth
  const dims = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dims.scrollWidth).toBeLessThanOrEqual(dims.clientWidth + 5); // small tolerance for rounding
  // Page should render successfully
  const title = await page.title();
  expect(title).toBeTruthy();
  await ctx.close();
});

test("responsive — public root has visible body content on mobile", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 667 },
  });
  const page = await ctx.newPage();
  await page.goto("/");
  // The body should have visible content (not empty/clipped)
  const bodyVisible = await page.evaluate(() => {
    const body = document.body;
    const rect = body.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  expect(bodyVisible).toBe(true);
  await ctx.close();
});
