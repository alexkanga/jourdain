/**
 * FANTOMAS E2E journey.
 *
 * Per WP-005 §5.15:
 * 1. FANTOMAS logs in via /admin/login with mixed-case input "Fantomas" → succeeds
 *    (Username plugin normalizes to "fantomas")
 * 2. FANTOMAS accesses /admin/offres → authorized (inherits ADMIN capabilities)
 * 3-6. create/edit/publish/suspend/republish/archive — all authorized (inherits ADMIN)
 *
 * Do NOT expand FANTOMAS scope beyond currently implemented behavior (AISE §21).
 */

import { test, expect } from "@playwright/test";
import { parseEnvLocal } from "./helpers/env";

const env = parseEnvLocal();

test("FANTOMAS — login with mixed-case input succeeds", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/nom d'utilisateur|username/i).fill("Fantomas"); // mixed-case
  await page.getByLabel(/mot de passe|password/i).fill(env.FANTOMAS_INITIAL_PASSWORD!);
  await page.getByRole("button", { name: /se connecter|sign in|connexion/i }).click();
  // Should succeed and redirect to /admin/offres
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });
  await ctx.close();
});

test("FANTOMAS — can access /admin/offres (inherits ADMIN capabilities)", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/nom d'utilisateur|username/i).fill("fantomas");
  await page.getByLabel(/mot de passe|password/i).fill(env.FANTOMAS_INITIAL_PASSWORD!);
  await page.getByRole("button", { name: /se connecter|sign in|connexion/i }).click();
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });
  // The admin offer list page should be visible (not redirected to login)
  await expect(page).toHaveURL(/\/admin\/offres/);
  await ctx.close();
});
