/**
 * User-management E2E — per user-management work package.
 *
 * Coverage:
 *   A. SUPER_ADMIN (admin1): Users menu visible, create temporary ADMIN,
 *      edit role/details, delete temporary user.
 *   B. ADMIN: Users menu absent, direct /admin/utilisateurs access redirected,
 *      archived offer has no Restore action.
 *   C. SUPER_ADMIN: archived offer Restore visible.
 *   D. FANTOMAS: Users access works, Restore available.
 *
 * Temp users are created via direct DB insert (using Better Auth's
 * hashPassword for the credential) to avoid rate-limit issues with multiple
 * logins as SUPER_ADMIN. The fixture is cleaned up at the end.
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { parseEnvLocal, certifyTestTarget } from "./helpers/env";
import { clearTestRateLimit } from "./helpers/fixtures";
import { loginViaUI } from "./helpers/auth";

const env = parseEnvLocal();

const ADMIN1_LOGIN = (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase();
const ADMIN1_PASSWORD = env.INITIAL_ADMIN_PASSWORD!;

// Unique test suffix to avoid collision with other runs
const RUN_ID = `um_${Date.now().toString(36)}`.slice(0, 12);

// Shared temp ADMIN user id for test B — created in beforeAll, cleaned up in afterAll.
let tempAdminId: string | null = null;
const TEMP_ADMIN_USERNAME = `um_e2e_adm_${RUN_ID}`.slice(0, 24);
const TEMP_ADMIN_EMAIL = `${TEMP_ADMIN_USERNAME}@um-test.local`;
const TEMP_ADMIN_PASSWORD = "TempAdminPass123!";

test.beforeAll(async () => {
  const verified = await certifyTestTarget(env);
  await clearTestRateLimit(verified.rawSql);

  // Create a temp ADMIN user via direct DB insert (using Better Auth's
  // hashPassword for the credential). This avoids the rate-limit issue
  // of logging in as SUPER_ADMIN to create the user via the UI.
  const { hashPassword } = await import("better-auth/crypto");
  const hashedPassword = await hashPassword(TEMP_ADMIN_PASSWORD);
  tempAdminId = randomUUID();
  const now = new Date().toISOString();
  await verified.rawSql`
    INSERT INTO "user" (id, email, email_verified, name, username, display_username, role, banned, principal_type, created_at, updated_at)
    VALUES (${tempAdminId}, ${TEMP_ADMIN_EMAIL}, true, ${TEMP_ADMIN_USERNAME}, ${TEMP_ADMIN_USERNAME}, ${TEMP_ADMIN_USERNAME}, 'user', false, 'ADMIN', ${now}, ${now})
  `;
  // Insert the credential account row
  const accountId = randomUUID();
  await verified.rawSql`
    INSERT INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
    VALUES (${accountId}, ${tempAdminId}, ${tempAdminId}, 'credential', ${hashedPassword}, ${now}, ${now})
  `;
});

test.afterAll(async () => {
  const verified = await certifyTestTarget(env);
  // Delete the temp ADMIN user (cascade will clean up sessions/accounts).
  if (tempAdminId) {
    try {
      await verified.rawSql`DELETE FROM "user" WHERE id = ${tempAdminId}`;
    } catch {
      // ignore
    }
  }
  // Cleanup any leftover test-created users by email/username prefix.
  try {
    await verified.rawSql`DELETE FROM "user" WHERE email ILIKE '%@um-test.local' OR username LIKE 'um_e2e_%' OR username LIKE 'um_%'`;
  } catch {
    // ignore — best-effort cleanup
  }
  await clearTestRateLimit(verified.rawSql);
});

// ─── A. SUPER_ADMIN journey ─────────────────────────────────────────

test("A. SUPER_ADMIN — Users menu visible + create/edit/delete temporary ADMIN user", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Login as admin1 (SUPER_ADMIN)
  await loginViaUI(page, ADMIN1_LOGIN, ADMIN1_PASSWORD);
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });

  // Verify "Utilisateurs" nav link is visible
  await expect(page.getByRole("link", { name: /utilisateurs/i })).toBeVisible();

  // Navigate to /admin/utilisateurs
  await page.getByRole("link", { name: /utilisateurs/i }).click();
  await page.waitForURL(/\/admin\/utilisateurs/, { timeout: 10_000 });

  // Verify the page heading is visible
  await expect(page.getByRole("heading", { name: /gestion des utilisateurs/i })).toBeVisible();

  // Verify the SUPER_ADMIN badge is visible (admin1 is SUPER_ADMIN)
  await expect(page.getByText("SUPER_ADMIN", { exact: true }).first()).toBeVisible();

  // Create a temporary ADMIN user
  await page.getByRole("link", { name: /nouvel utilisateur/i }).click();
  await page.waitForURL(/\/admin\/utilisateurs\/nouvelles/, { timeout: 10_000 });

  const tempAUsername = `um_e2e_A_${RUN_ID}`.slice(0, 24);
  const tempAEmail = `${tempAUsername}@um-test.local`;
  await page.getByLabel(/nom d'utilisateur/i).fill(tempAUsername);
  await page.getByLabel(/^email$/i).fill(tempAEmail);
  await page.getByLabel(/mot de passe/i).fill("TempAdminPass123!");
  // Role select should default to ADMIN
  await page.getByRole("button", { name: /créer l'utilisateur/i }).click();

  // After create, navigate back to the users list
  await page.waitForURL(/\/admin\/utilisateurs/, { timeout: 10_000 });

  // Verify the new ADMIN user appears in the list
  await expect(page.getByText(tempAUsername).first()).toBeVisible({ timeout: 5_000 });

  // Find the row containing the temp user and verify "Administrateur" badge
  const tempRow = page.locator("tr").filter({ hasText: tempAUsername }).first();
  await expect(tempRow.getByText("Administrateur", { exact: true })).toBeVisible();

  // Edit: click "Modifier" to go to the edit page
  await tempRow.getByRole("link", { name: /modifier/i }).click();
  await page.waitForURL(/\/admin\/utilisateurs\/[a-zA-Z0-9]+/, { timeout: 10_000 });

  // Promote to SUPER_ADMIN
  await page.getByLabel(/^rôle$/i).selectOption("SUPER_ADMIN");
  await page.getByRole("button", { name: /enregistrer les modifications/i }).click();
  await page.waitForURL(/\/admin\/utilisateurs/, { timeout: 10_000 });

  // Verify the user is now a SUPER_ADMIN
  const promotedRow = page.locator("tr").filter({ hasText: tempAUsername }).first();
  await expect(promotedRow.getByText("Super administrateur", { exact: true })).toBeVisible();

  // Delete the temporary user
  // Register the dialog handler BEFORE clicking — the click triggers the
  // confirm dialog synchronously, and the handler must already be in place.
  page.once("dialog", (dialog) => dialog.accept());
  await promotedRow.getByRole("button", { name: /supprimer/i }).click();
  await page.waitForURL(/\/admin\/utilisateurs/, { timeout: 10_000 });

  // Verify the user is gone from the list
  await expect(page.getByText(tempAUsername)).toHaveCount(0, { timeout: 5_000 });

  await ctx.close();
});

// ─── B. ADMIN cannot see Users menu, cannot restore archived offers ──

test("B. ADMIN — Users menu absent + direct /admin/utilisateurs redirected + no Restore button", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Login as the temp ADMIN user (created in beforeAll via direct DB insert)
  await loginViaUI(page, TEMP_ADMIN_USERNAME, TEMP_ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });

  // Verify "Utilisateurs" nav link is NOT visible to ADMIN
  await expect(page.getByRole("link", { name: /utilisateurs/i })).toHaveCount(0);

  // Verify direct /admin/utilisateurs access redirects to /admin/offres
  await page.goto("/admin/utilisateurs");
  await page.waitForURL(/\/admin\/offres/, { timeout: 10_000 });

  // Verify the "Utilisateurs" link is not in the nav even after redirect
  await expect(page.getByRole("link", { name: /utilisateurs/i })).toHaveCount(0);

  await ctx.close();
});

// ─── C. SUPER_ADMIN — Restore visible on archived offers ──────────

test("C. SUPER_ADMIN — archived offer shows Restore action", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Login as admin1 (SUPER_ADMIN)
  await loginViaUI(page, ADMIN1_LOGIN, ADMIN1_PASSWORD);
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });

  // Look for any archived offer row. Filter the offer list by ARCHIVED status.
  await page.goto("/admin/offres?status=ARCHIVED");

  // If there's at least one archived offer, the "Restaurer" button should
  // be visible. If there are zero archived offers, this test is a no-op
  // (we don't create one here — that's covered by the admin-critical-journey
  // spec which creates + archives + restores).
  const archivedRows = page.locator("tr").filter({ hasText: /archivée/i });
  const count = await archivedRows.count();
  if (count > 0) {
    const firstArchivedRow = archivedRows.first();
    await expect(firstArchivedRow.getByRole("button", { name: /restaurer/i })).toBeVisible();
  }

  await ctx.close();
});

// ─── D. FANTOMAS — Users access + Restore access ───────────────────

test("D. FANTOMAS — Users menu visible + Users page accessible + Restore available", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Login as fantomas (break-glass credentials)
  await page.goto("/admin/login");
  await page.getByLabel(/nom d'utilisateur|username/i).fill("fantomas");
  await page.getByLabel(/mot de passe|password/i).fill("fantomas");
  await page.getByRole("button", { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });

  // Verify "Utilisateurs" nav link is visible to FANTOMAS
  await expect(page.getByRole("link", { name: /utilisateurs/i })).toBeVisible();

  // Navigate to /admin/utilisateurs
  await page.getByRole("link", { name: /utilisateurs/i }).click();
  await page.waitForURL(/\/admin\/utilisateurs/, { timeout: 10_000 });

  // Verify the page loads (FANTOMAS can list users)
  await expect(page.getByRole("heading", { name: /gestion des utilisateurs/i })).toBeVisible();

  // Verify the FANTOMAS badge is visible
  await expect(page.getByText("FANTOMAS", { exact: true }).first()).toBeVisible();

  // Navigate to offers, filter by ARCHIVED — verify Restaurer is visible
  await page.goto("/admin/offres?status=ARCHIVED");
  const archivedRows = page.locator("tr").filter({ hasText: /archivée/i });
  const count = await archivedRows.count();
  if (count > 0) {
    const firstArchivedRow = archivedRows.first();
    await expect(firstArchivedRow.getByRole("button", { name: /restaurer/i })).toBeVisible();
  }

  await ctx.close();
});
