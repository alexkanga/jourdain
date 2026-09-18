import { db } from "@/db/index";
import { offers } from "@/db/schema";
import { eq, ilike, desc, and, sql, type SQL } from "drizzle-orm";
import type { OfferInput } from "@/lib/server/validation/schemas";

/**
 * Offers service — admin CRUD + lifecycle transitions.
 *
 * Server-side authority for all offer mutations. Every mutation:
 * 1. validates input (caller responsibility — Zod at Server Action layer);
 * 2. validates lifecycle state server-side (load + verify current status);
 * 3. executes only the permitted mutation;
 * 4. returns a controlled result.
 *
 * Per WP-003 contract:
 * - No physical delete (FR-034).
 * - No automatic status transitions from dates (FR-035, BR-026).
 * - ARCHIVED is a soft lifecycle state — Restaurer transitions out (BR-024 V1.1):
 *     ARCHIVED + published_at IS NULL → DRAFT (never-published offer)
 *     ARCHIVED + published_at NOT NULL → SUSPENDED (previously public;
 *       explicit Republier required to become public again — NO auto republish)
 * - save != publish (BR-021).
 * - published_at: SET on first publication; PRESERVED on republication,
 *   suspension, archive, restore, edit (BR-022, BR-023, BR-024, FR-025).
 */

export type OfferStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";

export type OfferRow = typeof offers.$inferSelect;

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const PAGE_SIZE = 20;

/**
 * Map OfferInput (Zod-validated) to a partial offers row for INSERT/UPDATE.
 * System-managed fields (id, status, published_at, created_at, updated_at)
 * are NEVER set from OfferInput — they are server-managed.
 */
function mapOfferInputToRow(input: OfferInput) {
  return {
    title: input.title,
    description: input.description,
    company: input.company || null,
    sector: input.sector || null,
    category: input.category || null,
    contractType: input.contractType || null,
    educationLevel: input.educationLevel || null,
    experience: input.experience || null,
    location: input.location || null,
    sourcePublicationDate: input.sourcePublicationDate || null,
    applicationDeadline: input.applicationDeadline || null,
    sourceName: input.sourceName || null,
    sourceUrl: input.sourceUrl || null,
    applicationModalities: input.applicationModalities || null,
    applicationEmail: input.applicationEmail || null,
    applicationUrl: input.applicationUrl || null,
  };
}

/**
 * List offers with optional status filter + ILIKE title search + pagination.
 * Sorted by created_at DESC (admin default sort).
 */
export async function listOffers(opts?: {
  status?: OfferStatus;
  q?: string;
  page?: number;
}): Promise<{ items: OfferRow[]; total: number; page: number; pageSize: number }> {
  const page = opts?.page && opts.page > 0 ? opts.page : 1;
  const pageSize = PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (opts?.status) {
    conditions.push(eq(offers.status, opts.status));
  }
  if (opts?.q && opts.q.trim() !== "") {
    conditions.push(ilike(offers.title, `%${opts.q.trim()}%`));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(offers)
      .where(where)
      .orderBy(desc(offers.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(offers)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  return { items, total, page, pageSize };
}

/**
 * Get a single offer by id.
 */
export async function getOfferById(id: string): Promise<OfferRow | null> {
  const rows = await db
    .select()
    .from(offers)
    .where(eq(offers.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Create a new offer. Always DRAFT, published_at NULL (BR-021, FR-020, FR-022).
 */
export async function createOffer(
  input: OfferInput,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const row = mapOfferInputToRow(input);
    const [inserted] = await db
      .insert(offers)
      .values({
        ...row,
        status: "DRAFT",
        publishedAt: null,
      })
      .returning({ id: offers.id });
    if (!inserted) {
      return { ok: false, error: "Erreur technique: offre non créée" };
    }
    return { ok: true, data: { id: inserted.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[offers.createOffer] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}

/**
 * Update an existing offer's content fields. Preserves status and published_at
 * (FR-021, FR-025). Only updated_at is set to now().
 */
export async function updateOffer(
  id: string,
  input: OfferInput,
): Promise<ServiceResult<{ id: string }>> {
  try {
    // Concurrency: load + verify existence
    const existing = await getOfferById(id);
    if (!existing) {
      return { ok: false, error: "Offre introuvable" };
    }
    const row = mapOfferInputToRow(input);
    // status and published_at are NOT in the SET clause — they are preserved.
    const [updated] = await db
      .update(offers)
      .set({
        ...row,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning({ id: offers.id });
    if (!updated) {
      return { ok: false, error: "Erreur technique: offre non modifiée" };
    }
    return { ok: true, data: { id: updated.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[offers.updateOffer] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}

/**
 * Publish a DRAFT offer. Sets published_at = now() (first publication).
 * Rejects if current status is not DRAFT.
 */
export async function publishOffer(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    const existing = await getOfferById(id);
    if (!existing) {
      return { ok: false, error: "Offre introuvable" };
    }
    if (existing.status !== "DRAFT") {
      return { ok: false, error: "L'offre n'est pas en brouillon" };
    }
    const [updated] = await db
      .update(offers)
      .set({
        status: "PUBLISHED",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning({ id: offers.id });
    if (!updated) {
      return { ok: false, error: "Erreur technique: offre non publiée" };
    }
    return { ok: true, data: { id: updated.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[offers.publishOffer] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}

/**
 * Suspend a PUBLISHED offer. Preserves content + published_at.
 * Rejects if current status is not PUBLISHED.
 */
export async function suspendOffer(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    const existing = await getOfferById(id);
    if (!existing) {
      return { ok: false, error: "Offre introuvable" };
    }
    if (existing.status !== "PUBLISHED") {
      return { ok: false, error: "L'offre n'est pas publiée" };
    }
    // published_at is NOT in the SET clause — preserved (BR-023)
    const [updated] = await db
      .update(offers)
      .set({
        status: "SUSPENDED",
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning({ id: offers.id });
    if (!updated) {
      return { ok: false, error: "Erreur technique: offre non suspendue" };
    }
    return { ok: true, data: { id: updated.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[offers.suspendOffer] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}

/**
 * Republish a SUSPENDED offer. Preserves published_at (NOT overwritten — BR-022).
 * Rejects if current status is not SUSPENDED.
 */
export async function republishOffer(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    const existing = await getOfferById(id);
    if (!existing) {
      return { ok: false, error: "Offre introuvable" };
    }
    if (existing.status !== "SUSPENDED") {
      return { ok: false, error: "L'offre n'est pas suspendue" };
    }
    // published_at is NOT in the SET clause — preserved, NOT overwritten (BR-022)
    const [updated] = await db
      .update(offers)
      .set({
        status: "PUBLISHED",
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning({ id: offers.id });
    if (!updated) {
      return { ok: false, error: "Erreur technique: offre non republicée" };
    }
    return { ok: true, data: { id: updated.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[offers.republishOffer] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}

/**
 * Archive any active offer (DRAFT, PUBLISHED, SUSPENDED). Preserves content + published_at.
 * Rejects if already ARCHIVED (no-op).
 * Archive is now a SOFT lifecycle state — Restaurer transitions out (BR-024 V1.1).
 */
export async function archiveOffer(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    const existing = await getOfferById(id);
    if (!existing) {
      return { ok: false, error: "Offre introuvable" };
    }
    if (existing.status === "ARCHIVED") {
      return { ok: false, error: "L'offre est déjà archivée" };
    }
    // published_at is NOT in the SET clause — preserved (BR-024)
    const [updated] = await db
      .update(offers)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning({ id: offers.id });
    if (!updated) {
      return { ok: false, error: "Erreur technique: offre non archivée" };
    }
    return { ok: true, data: { id: updated.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[offers.archiveOffer] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}

/**
 * Restore an ARCHIVED offer. Soft-restore rule (BR-024 V1.1):
 *   - If published_at IS NULL        → DRAFT     (never-published offer)
 *   - If published_at IS NOT NULL     → SUSPENDED (previously public; NO auto-republish)
 *
 * Preserves published_at (NEVER reset). The administrator must explicitly click
 * Republier to make a previously-published restored offer public again — restoring
 * MUST NOT automatically republish the offer.
 *
 * Rejects if current status is not ARCHIVED.
 */
export async function restoreOffer(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    const existing = await getOfferById(id);
    if (!existing) {
      return { ok: false, error: "Offre introuvable" };
    }
    if (existing.status !== "ARCHIVED") {
      return { ok: false, error: "L'offre n'est pas archivée" };
    }
    const targetStatus: "DRAFT" | "SUSPENDED" =
      existing.publishedAt === null ? "DRAFT" : "SUSPENDED";
    // published_at is NOT in the SET clause — preserved, NEVER reset (BR-022)
    const [updated] = await db
      .update(offers)
      .set({
        status: targetStatus,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, id))
      .returning({ id: offers.id });
    if (!updated) {
      return { ok: false, error: "Erreur technique: offre non restaurée" };
    }
    return { ok: true, data: { id: updated.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[offers.restoreOffer] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}
