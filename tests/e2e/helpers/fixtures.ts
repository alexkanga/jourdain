/**
 * E2E fixture helpers — direct DB helpers via Neon SQL.
 *
 * Per WP-005 contract §5.8 + §5.9:
 * - Fixtures created ONLY on TEST (positively verified per Phase A — NO insert before Phase A passes).
 * - Cleanup ONLY on TEST.
 * - FIXTURE MARKER POLICY: do NOT replace canonical UUID `id` with arbitrary prefixed strings.
 *   The marker lives in the existing `title` business field with prefix `E2E_<run-id>_<scenario>`.
 *   No new schema column is added for E2E.
 * - Normal cleanup: delete exact recorded UUIDs (by id), NOT by title prefix.
 * - Orphan recovery: find TEST offers with title LIKE 'E2E_%', collect UUIDs, delete exact UUIDs.
 * - No broad unrestricted DELETE without an explicit UUID list.
 *
 * The rawSql passed in is the verified TEST Neon connection (from certifyTestTarget).
 */

import { randomBytes } from "node:crypto";
import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Generate a unique run-id for this E2E run (ISO timestamp + random hex).
 */
export function newRunId(): string {
  const ts = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15);
  const hex = randomBytes(3).toString("hex");
  return `${ts}_${hex}`;
}

/**
 * Marker prefix for E2E fixture titles.
 * Lives in the `title` business field — NOT in a new schema column,
 * NOT replacing the canonical UUID `id`.
 */
const E2E_MARKER_PREFIX = "E2E_";

/**
 * Build a fixture title with the E2E marker prefix.
 */
export function e2eTitle(runId: string, scenario: string, suffix?: string): string {
  const s = suffix ? `${scenario}_${suffix}` : scenario;
  return `${E2E_MARKER_PREFIX}${runId}_${s}`;
}

/**
 * Create a test offer directly in TEST via the verified Neon connection.
 *
 * Returns the row including the canonical UUID `id` (which the caller MUST track for cleanup).
 */
export async function createTestOffer(
  rawSql: NeonQueryFunction<false, false>,
  args: {
    id: string;
    title: string;
    description?: unknown; // Tiptap JSON
    company?: string | null;
    location?: string | null;
    contractType?: string | null;
    status?: "DRAFT" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";
    publishedAt?: Date | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    applicationUrl?: string | null;
    applicationEmail?: string | null;
    applicationModalities?: string | null;
  },
): Promise<{ id: string; title: string; status: string }> {
  const id = args.id;
  const title = args.title;
  const description = args.description ?? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "E2E fixture content" }] }] };
  const company = args.company ?? null;
  const location = args.location ?? null;
  const contractType = args.contractType ?? null;
  const status = args.status ?? "DRAFT";
  const publishedAt = args.publishedAt ?? null;
  const sourceName = args.sourceName ?? null;
  const sourceUrl = args.sourceUrl ?? null;
  const applicationUrl = args.applicationUrl ?? null;
  const applicationEmail = args.applicationEmail ?? null;
  const applicationModalities = args.applicationModalities ?? null;

  await rawSql`
    INSERT INTO "offers" (
      id, title, description, company, location, contract_type,
      status, published_at, source_name, source_url,
      application_url, application_email, application_modalities,
      created_at, updated_at
    ) VALUES (
      ${id}, ${title}, ${JSON.stringify(description)}::jsonb, ${company}, ${location}, ${contractType},
      ${status}, ${publishedAt ? publishedAt.toISOString() : null}, ${sourceName}, ${sourceUrl},
      ${applicationUrl}, ${applicationEmail}, ${applicationModalities},
      NOW(), NOW()
    )
  `;
  return { id, title, status };
}

/**
 * Delete a test offer by exact canonical UUID.
 * Normal cleanup — never deletes by title prefix.
 */
export async function deleteTestOffer(
  rawSql: NeonQueryFunction<false, false>,
  id: string,
): Promise<void> {
  await rawSql`DELETE FROM "offers" WHERE id = ${id}`;
}

/**
 * Orphan recovery cleanup — find TEST offers with title LIKE 'E2E_%',
 * collect their canonical UUIDs, then delete those exact UUIDs.
 *
 * No broad unrestricted DELETE — always delete by id after collecting UUIDs.
 */
export async function cleanupOrphanFixtures(
  rawSql: NeonQueryFunction<false, false>,
): Promise<number> {
  const rows = await rawSql`
    SELECT id FROM "offers" WHERE title LIKE 'E2E_%'
  ` as Array<{ id: string }>;
  let deleted = 0;
  for (const row of rows) {
    try {
      await rawSql`DELETE FROM "offers" WHERE id = ${row.id}`;
      deleted++;
    } catch {
      // ignore individual delete failures (e.g., FK constraints)
    }
  }
  return deleted;
}

/**
 * Clear TEST rateLimit table.
 * Per §5.10 ordering: MUST be called AFTER Phase A target certification.
 * NEVER clear DEV rateLimit. NEVER disable rate limiter globally.
 */
export async function clearTestRateLimit(
  rawSql: NeonQueryFunction<false, false>,
): Promise<void> {
  await rawSql`DELETE FROM "rateLimit"`;
}

/**
 * Phase B SAFE sentinel — insert a uniquely identifiable PUBLISHED offer
 * DIRECTLY into TEST via the runner's verified Neon SQL connection.
 * NOT through the application Server Action.
 *
 * Returns the canonical UUID of the sentinel offer (for cleanup).
 */
export async function seedSentinel(
  rawSql: NeonQueryFunction<false, false>,
  sentinelId: string,
  sentinelTitle: string,
): Promise<{ id: string; title: string }> {
  await rawSql`
    INSERT INTO "offers" (
      id, title, description, company, location, contract_type,
      status, published_at,
      created_at, updated_at
    ) VALUES (
      ${sentinelId}, ${sentinelTitle},
      ${JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "E2E sentinel" }] }] })}::jsonb,
      NULL, NULL, NULL,
      'PUBLISHED', NOW(),
      NOW(), NOW()
    )
  `;
  return { id: sentinelId, title: sentinelTitle };
}
