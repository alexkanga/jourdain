/**
 * Security E2E — admin route guard.
 *
 * Per WP-005 §5.14:
 * - unauthenticated visit to /admin/offres → redirected to /admin/login
 * - unauthenticated POST to admin Server Action → rejected
 */

import { test, expect } from "@playwright/test";

test("admin route guard — unauthenticated /admin/offres redirects to /admin/login", async ({ page }) => {
  await page.goto("/admin/offres");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
});

test("admin route guard — unauthenticated /admin/ redirects to /admin/login", async ({ page }) => {
  await page.goto("/admin/");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
});

test("admin route guard — /admin/login is reachable unauthenticated (no redirect loop)", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
  // There should be a login form visible
  await expect(page.getByRole("button", { name: /se connecter|sign in|connexion/i })).toBeVisible();
});
