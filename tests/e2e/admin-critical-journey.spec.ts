/**
 * Admin critical 15-step journey — per S6 §18.4.
 *
 * ONE spec, ONE offer across all 15 steps (one continuous user journey).
 * Steps:
 * 1. ADMIN login
 * 2. create DRAFT
 * 3. edit DRAFT (in detail page)
 * 4. publish → PUBLISHED
 * 5. PUBLIC sees in list
 * 6. PUBLIC detail — all fields
 * 7. PUBLIC verifies no Apply button
 * 8. suspend → SUSPENDED
 * 9. PUBLIC list 404 / direct URL 404
 * 10. republish (preserves published_at)
 * 11. PUBLIC sees again
 * 12. archive (terminal) — confirmation dialog accepted
 * 13. PUBLIC not visible, direct URL 404
 * 14. ADMIN list shows ARCHIVED, content preserved — Restaurer available
 * 15. logout
 *
 * UI selectors (per §5.33 data-testid policy — prefer role/label/text):
 * - Admin offer list: each row has the title as a link + action buttons (Publier/Suspendre/Republier/Archiver/Restaurer) directly in Actions column.
 * - Edit page: title input + Tiptap editor (contenteditable) + Enregistrer button.
 * - Archive action displays a window.confirm() dialog — accepted in this journey.
 * - Restore (Restaurer) is available for ARCHIVED rows (BR-024 V1.1 soft-restore).
 */

import { test, expect } from "@playwright/test";
import { parseEnvLocal } from "./helpers/env";
import { loginViaUI } from "./helpers/auth";

const env = parseEnvLocal();

test("admin critical 15-step journey", async ({ browser }) => {
  // ===== Step 1: ADMIN login =====
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginViaUI(adminPage, (env.INITIAL_ADMIN_LOGIN || "admin1").toLowerCase(), env.INITIAL_ADMIN_PASSWORD!);
  await expect(adminPage).toHaveURL(/\/admin\/offres/, { timeout: 15_000 });

  // ===== Step 2: create DRAFT =====
  await adminPage.getByRole("link", { name: /nouvelle offre/i }).click();
  await adminPage.waitForURL(/\/admin\/offres\/nouvelles/, { timeout: 10_000 });
  await adminPage.getByLabel(/titre/i).first().fill("E2E_ADMIN_CRITICAL_JOURNEY_OFFER");
  // Description (Tiptap editor — contenteditable)
  const editorRegion = adminPage.locator("[contenteditable='true']").first();
  await editorRegion.click();
  await editorRegion.fill("E2E initial DRAFT description");
  await adminPage.getByRole("button", { name: /enregistrer|sauvegarder|save/i }).click();
  await adminPage.waitForURL(/\/admin\/offres/, { timeout: 15_000 });
  await expect(adminPage.getByText("E2E_ADMIN_CRITICAL_JOURNEY_OFFER")).toBeVisible({ timeout: 10_000 });

  // ===== Step 3: edit DRAFT (navigate to edit page, modify, save) =====
  // Click the offer title to navigate to its edit/detail page
  await adminPage.getByRole("link", { name: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).click();
  await adminPage.waitForURL(/\/admin\/offres\/[0-9a-f-]+/, { timeout: 10_000 });
  // Modify the description
  const editor2 = adminPage.locator("[contenteditable='true']").first();
  await editor2.click();
  await editor2.fill("");
  await editor2.type("E2E EDITED DRAFT description");
  await adminPage.getByRole("button", { name: /enregistrer|sauvegarder|save/i }).click();
  await adminPage.waitForURL(/\/admin\/offres/, { timeout: 15_000 });

  // ===== Step 4: publish → PUBLISHED (action button in the admin list row) =====
  // The offer row's Actions cell contains a "Publier" button
  const offerRow = adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first();
  await offerRow.getByRole("button", { name: /publier/i }).click();
  // Verify status changes to "Publiée" (visible in the row)
  await expect(adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first().getByText(/publiée|published/i)).toBeVisible({ timeout: 10_000 });

  // Capture the offer URL from the public side (for later 404 checks)
  const offerHref = await adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first().getByRole("link", { name: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).getAttribute("href");
  const offerId = offerHref?.replace("/admin/offres/", "");
  expect(offerId).toBeTruthy();
  const publicDetailUrl = `/offres/${offerId}`;

  // ===== Step 5: PUBLIC sees in list =====
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto("/");
  await expect(publicPage.getByText("E2E_ADMIN_CRITICAL_JOURNEY_OFFER")).toBeVisible({ timeout: 15_000 });

  // ===== Step 6: PUBLIC detail — all fields =====
  await publicPage.getByRole("link", { name: /voir l'offre/i }).first().click();
  await publicPage.waitForURL(/\/offres\/[0-9a-f-]+/, { timeout: 10_000 });
  await expect(publicPage.getByRole("heading", { name: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" })).toBeVisible();
  await expect(publicPage.getByText("E2E EDITED DRAFT description")).toBeVisible();

  // ===== Step 7: PUBLIC verifies no Apply button =====
  await expect(publicPage.getByRole("button", { name: /postuler|apply/i })).toHaveCount(0);
  await expect(publicPage.getByRole("link", { name: /postuler|apply/i })).toHaveCount(0);

  // ===== Step 8: suspend → SUSPENDED =====
  await adminPage.goto("/admin/offres");
  const rowAfterPublish = adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first();
  await rowAfterPublish.getByRole("button", { name: /suspendre/i }).click();
  await expect(adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first().getByText(/suspendue|suspended/i)).toBeVisible({ timeout: 10_000 });

  // ===== Step 9: PUBLIC list 404 / direct URL 404 =====
  await publicPage.goto("/");
  await expect(publicPage.getByText("E2E_ADMIN_CRITICAL_JOURNEY_OFFER")).toHaveCount(0);
  const responseSuspended = await publicPage.goto(publicDetailUrl);
  expect(responseSuspended?.status()).toBe(404);

  // ===== Step 10: republish (preserves published_at) =====
  // The republish button label is "Republier" (fixed from "Republicaliser" typo).
  const rowSuspended = adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first();
  await rowSuspended.getByRole("button", { name: /republier/i }).click();
  await expect(adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first().getByText(/publiée|published/i)).toBeVisible({ timeout: 10_000 });

  // ===== Step 11: PUBLIC sees again =====
  await publicPage.goto("/");
  await expect(publicPage.getByText("E2E_ADMIN_CRITICAL_JOURNEY_OFFER")).toBeVisible({ timeout: 15_000 });

  // ===== Step 12: archive (terminal) — confirmation dialog accepted =====
  // The Archiver button now shows a window.confirm() dialog before archiving.
  // We register a one-time dialog handler that accepts it.
  const rowForArchive = adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first();
  adminPage.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    // Verify the confirmation message matches the archive warning contract.
    expect(dialog.message()).toContain("Archiver cette offre");
    expect(dialog.message()).toContain("retirée du portail public");
    expect(dialog.message()).toContain("restaurer");
    await dialog.accept();
  });
  await rowForArchive.getByRole("button", { name: /archiver/i }).click();
  // Use exact text matching for the status badge ("Archivée") to avoid matching
  // "Aucune action (archivée)" in the Actions cell. The status badge is in a cell
  // with role="cell" containing the exact text "Archivée".
  await expect(adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first().getByRole("cell", { name: "Archivée", exact: true })).toBeVisible({ timeout: 10_000 });

  // ===== Step 13: PUBLIC not visible, direct URL 404 =====
  await publicPage.goto("/");
  await expect(publicPage.getByText("E2E_ADMIN_CRITICAL_JOURNEY_OFFER")).toHaveCount(0);
  const responseArchived = await publicPage.goto(publicDetailUrl);
  expect(responseArchived?.status()).toBe(404);

  // ===== Step 14: ADMIN list shows ARCHIVED, content preserved — Restaurer available =====
  await adminPage.goto("/admin/offres");
  await expect(adminPage.getByText("E2E_ADMIN_CRITICAL_JOURNEY_OFFER")).toBeVisible({ timeout: 15_000 });
  await expect(adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first().getByRole("cell", { name: "Archivée", exact: true })).toBeVisible();
  // Restaurer button is visible for the ARCHIVED row (BR-024 V1.1 soft-restore)
  await expect(adminPage.locator("tr").filter({ hasText: "E2E_ADMIN_CRITICAL_JOURNEY_OFFER" }).first().getByRole("button", { name: /restaurer/i })).toBeVisible();

  // ===== Step 15: logout =====
  await adminPage.getByRole("button", { name: /déconnexion|se déconnecter|logout/i }).click();
  await adminPage.waitForURL(/\/admin\/login/, { timeout: 20_000 });

  await adminContext.close();
  await publicContext.close();
});
