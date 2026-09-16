/**
 * Security E2E — logout invalidates protected access.
 *
 * Per WP-005 §5.14 + §15 (LOGOUT TEST CORRECTION):
 * - ADMIN login → access /admin/offres (authenticated)
 * - click Logout → navigates to /admin/login
 * - session cookie cleared/invalidated
 * - direct /admin/offres access after logout → redirected to /admin/login
 *
 * S11 independent verification (3/3 clean-context runs) confirmed:
 * 1. login succeeds via real ADMIN UI
 * 2. logout navigates to /admin/login
 * 3. session cookie is cleared after logout
 * 4. /admin/offres after logout redirects to /admin/login (session invalidated)
 *
 * This is a REGULAR Playwright security test (NOT test.fail).
 * If this test fails from a clean environment:
 * STOP and report LOGOUT SECURITY REGRESSION (per §17).
 * Do NOT re-add test.fail, skip, or weaken assertions.
 * Do NOT modify product LogoutButton code without OWNER authorization.
 */

import { test, expect } from "@playwright/test";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { clearTestRateLimit } from "./helpers/fixtures";
import { loginViaUI } from "./helpers/auth";

const env = parseEnvLocal();

test.beforeAll(async () => {
  // Clear TEST rateLimit before this test to ensure login + logout are not
  // rate-limited by accumulated state from prior specs. Per §5.10 ordering:
  // this happens AFTER Phase A target certification (via certifyTestTarget).
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);
});

test("logout invalidates protected access", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Step 1: Login via actual ADMIN UI
  await loginViaUI(page, (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase(), env.INITIAL_ADMIN_PASSWORD!);
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });

  // Step 2: Confirm protected /admin/offres accessible (authenticated)
  await page.goto("/admin/offres");
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 10_000 });

  // Step 3: Authenticated session exists before logout (session cookie present)
  const cookiesBefore = await ctx.cookies();
  const sessionCookieBefore = cookiesBefore.find((c) =>
    c.name.startsWith("better-auth.session_token"),
  );
  expect(sessionCookieBefore, "Session cookie should be present before logout").toBeTruthy();

  // Step 4: Click actual LogoutButton
  // Step 5: Navigation reaches /admin/login
  await Promise.all([
    page.waitForURL(/\/admin\/login/, { timeout: 30_000, waitUntil: "load" }),
    page.getByRole("button", { name: /^déconnexion$/i }).click(),
  ]);
  await expect(page).toHaveURL(/\/admin\/login/);

  // Step 6 + 7: Verify session invalidation via the authoritative server-side check.
  // The authoritative security boundary is the server-side session validation
  // (Better Auth getPrincipal → null → admin layout redirects to /admin/login).
  //
  // Wait for the /admin/login page to fully load so the signOut Set-Cookie
  // response has been applied to the browser cookie jar. The product
  // LogoutButton DOES `await authClient.signOut()` before navigating, but
  // the browser cookie jar needs a moment to apply the Set-Cookie header
  // from the signOut HTTP response. S11 independent verification confirmed
  // the cookie IS cleared and /admin/offres redirects to /admin/login.
  await page.waitForLoadState("domcontentloaded");
  await page.goto("/admin/offres");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15_000 });

  // Step 8 (secondary): Cookie verification where stable.
  // After the redirect to /admin/login, the cookie jar has settled.
  // The session cookie should be cleared (gone) OR have an expiry in the past.
  const cookiesAfter = await ctx.cookies();
  const sessionCookieAfter = cookiesAfter.find((c) =>
    c.name.startsWith("better-auth.session_token"),
  );
  if (sessionCookieAfter) {
    // If present, it must be expired (Max-Age=0 sets expiry in the past).
    expect(sessionCookieAfter.expires).toBeLessThan(Date.now() / 1000);
  }
  // If sessionCookieAfter is undefined, the cookie was removed — correct behavior.

  await ctx.close();
});
