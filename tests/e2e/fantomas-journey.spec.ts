/**
 * FANTOMAS E2E journey — break-glass path.
 *
 * Per Fantomas mini-design (OWNER-authorized implementation):
 *   1. FANTOMAS logs in via /admin/login with username "fantomas" and
 *      password "fantomas" (OWNER-confirmed break-glass credentials).
 *      The LoginForm client-side branches on username === "fantomas" and
 *      POSTs to /api/fantomas/login (NOT Better Auth).
 *   2. The Fantomas session cookie (jourdain_fantomas_session) is set
 *      via Set-Cookie header.
 *   3. FANTOMAS accesses /admin/offres → authorized (principalType =
 *      "FANTOMAS" inherits all ADMIN capabilities + Fantomas-only ones).
 *   4. The header shows the principal identity (username + principalType badge).
 *
 * DB-backed FANTOMAS user (created by bootstrap with FANTOMAS_INITIAL_PASSWORD)
 * is KEPT temporarily per OWNER decision #4 but is NOT used by the new
 * break-glass path. The new path is fully independent of Better Auth / Neon.
 *
 * Do NOT expand FANTOMAS scope beyond currently implemented behavior (AISE §21).
 */

import { test, expect } from "@playwright/test";

test("FANTOMAS — break-glass login fantomas/fantomas succeeds", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/nom d'utilisateur|username/i).fill("fantomas");
  await page.getByLabel(/mot de passe|password/i).fill("fantomas");
  await page.getByRole("button", { name: /se connecter|sign in|connexion/i }).click();
  // Should succeed and redirect to /admin/offres
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });
  // The header should display the FANTOMAS principalType badge
  await expect(page.getByText("FANTOMAS", { exact: true })).toBeVisible({ timeout: 5_000 });
  await ctx.close();
});

test("FANTOMAS — can access /admin/offres (inherits ADMIN capabilities)", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/nom d'utilisateur|username/i).fill("fantomas");
  await page.getByLabel(/mot de passe|password/i).fill("fantomas");
  await page.getByRole("button", { name: /se connecter|sign in|connexion/i }).click();
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });
  // The admin offer list page should be visible (not redirected to login)
  await expect(page).toHaveURL(/\/admin\/offres/);
  await ctx.close();
});

test("FANTOMAS — wrong password rejected on break-glass path", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/nom d'utilisateur|username/i).fill("fantomas");
  await page.getByLabel(/mot de passe|password/i).fill("wrong-password");
  await page.getByRole("button", { name: /se connecter|sign in|connexion/i }).click();
  // Should stay on /admin/login and show error
  await expect(page.getByText(/identifiants invalides/i)).toBeVisible({ timeout: 5_000 });
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5_000 });
  await ctx.close();
});

test("FANTOMAS — logout clears Fantomas cookie (no Better Auth call)", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/nom d'utilisateur|username/i).fill("fantomas");
  await page.getByLabel(/mot de passe|password/i).fill("fantomas");
  await page.getByRole("button", { name: /se connecter|sign in|connexion/i }).click();
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });

  // Capture cookies before logout
  const cookiesBefore = await ctx.cookies();
  const fantomasCookieBefore = cookiesBefore.find(
    (c) => c.name === "jourdain_fantomas_session",
  );
  expect(fantomasCookieBefore, "Fantomas session cookie should be present before logout").toBeTruthy();

  // Click the Logout button — should call /api/fantomas/logout (NOT Better Auth)
  await page.getByRole("button", { name: /déconnexion|se déconnecter|logout/i }).click();
  await page.waitForURL(/\/admin\/login/, { timeout: 30_000 });

  // After logout, the Fantomas cookie should be cleared
  const cookiesAfter = await ctx.cookies();
  const fantomasCookieAfter = cookiesAfter.find(
    (c) => c.name === "jourdain_fantomas_session",
  );
  // Cookie either absent or has empty value
  expect(
    fantomasCookieAfter === undefined || fantomasCookieAfter.value === "",
    "Fantomas session cookie should be cleared or empty after logout",
  ).toBe(true);

  // Post-logout: direct /admin/offres access should redirect to /admin/login
  await page.goto("/admin/offres");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });

  await ctx.close();
});
