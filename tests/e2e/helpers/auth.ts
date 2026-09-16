/**
 * E2E auth helpers — deterministic TEST identity preparation + UI login.
 *
 * Per WP-005 contract §5.11:
 * - Use the existing canonical bootstrap mechanism (pnpm db:bootstrap → db/bootstrap/bootstrap.ts)
 *   deterministically, scoped to verified TEST only.
 * - The bootstrap is idempotent: if admin1/fantomas already exist, it does NOT overwrite.
 * - Verify ADMIN identity exists in TEST (direct read-only SQL).
 * - Verify FANTOMAS identity exists in TEST (direct read-only SQL).
 * - Do NOT bootstrap DEV. Do NOT bootstrap Production.
 * - Do NOT introduce a second authentication implementation.
 * - Better Auth remains the identity/session authority.
 *
 * For UI login, the E2E specs use the real /admin/login form (Better Auth client API),
 * NOT direct session creation — exercises the real auth boundary.
 */

import { spawn } from "node:child_process";
import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Run the existing canonical bootstrap with the TEST-scoped env.
 * Idempotent — creates admin1/fantomas only if missing.
 */
export function runBootstrap(env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn("npx", ["tsx", "db/bootstrap/bootstrap.ts"], {
      cwd: process.cwd(),
      stdio: "pipe",
      env,
    });
    let stderr = "";
    p.stdout?.on("data", () => {}); // discard stdout
    p.stderr?.on("data", (d) => { stderr += d.toString(); });
    p.on("error", reject);
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`db:bootstrap failed (code=${code}):\n${stderr.slice(-2000)}`));
    });
  });
}

/**
 * Verify ADMIN and FANTOMAS identities exist in TEST.
 * Read-only queries — no mutation.
 *
 * Per §5.11 step 4-6: if either identity is missing after bootstrap,
 * STOP with E2E_TEST_IDENTITY_PREPARATION_GAP.
 */
export async function verifyTestIdentity(
  rawSql: NeonQueryFunction<false, false>,
): Promise<void> {
  const adminRows = await rawSql`
    SELECT id, username, principal_type FROM "user" WHERE username = 'admin1'
  ` as Array<{ id: string; username: string; principal_type: string }>;
  if (adminRows.length === 0) {
    throw new Error(
      "E2E_TEST_IDENTITY_PREPARATION_GAP: admin1 missing in TEST after bootstrap. The existing canonical bootstrap cannot safely prepare required identities.",
    );
  }
  if (adminRows[0].principal_type !== "ADMIN") {
    throw new Error(
      `E2E_TEST_IDENTITY_PREPARATION_GAP: admin1 principal_type is "${adminRows[0].principal_type}" (expected "ADMIN").`,
    );
  }
  const fantomasRows = await rawSql`
    SELECT id, username, principal_type FROM "user" WHERE username = 'fantomas'
  ` as Array<{ id: string; username: string; principal_type: string }>;
  if (fantomasRows.length === 0) {
    throw new Error(
      "E2E_TEST_IDENTITY_PREPARATION_GAP: fantomas missing in TEST after bootstrap. The existing canonical bootstrap cannot safely prepare required identities.",
    );
  }
  if (fantomasRows[0].principal_type !== "FANTOMAS") {
    throw new Error(
      `E2E_TEST_IDENTITY_PREPARATION_GAP: fantomas principal_type is "${fantomasRows[0].principal_type}" (expected "FANTOMAS").`,
    );
  }
}

/**
 * Login via the real /admin/login UI using Playwright page.
 * Exercises the real Better Auth client-side auth boundary.
 *
 * Uses role+label selectors (NOT data-testid) per §5.33 data-testid policy.
 */
export async function loginViaUI(
  page: import("@playwright/test").Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto("/admin/login");
  // Use label-based selectors (preferred per §5.33)
  await page.getByLabel(/nom d'utilisateur|username/i).fill(username);
  await page.getByLabel(/mot de passe|password/i).fill(password);
  await page.getByRole("button", { name: /se connecter|sign in|connexion/i }).click();
  // Wait for navigation to /admin/offres (the authenticated admin landing)
  await page.waitForURL(/\/admin\/offres/, { timeout: 15_000 });
}
