import { db } from "@/db/index";
import { offers } from "@/db/schema";
import { eq, and, ilike, desc, sql, type SQL } from "drizzle-orm";

/**
 * Public offers service — read-only queries for public portal.
 *
 * Enforces PUBLISHED-only visibility at the database/query boundary (BR-025).
 * No mutation methods. No admin capabilities.
 *
 * Per WP-004 contract:
 * - Only PUBLISHED offers are returned.
 * - Ordering: published_at DESC, created_at DESC (BR-070, BR-071).
 * - Search: ILIKE on title + company + location (ADR-0010).
 * - Detail: WHERE id = ? AND status = 'PUBLISHED' (FR-042).
 * - No hidden statuses exposed (DRAFT, SUSPENDED, ARCHIVED).
 */

export type PublicOfferRow = typeof offers.$inferSelect;

const PUBLIC_PAGE_SIZE = 12;

/**
 * List PUBLISHED offers with optional search and pagination.
 * Sorted by published_at DESC, created_at DESC (BR-070, BR-071).
 */
export async function listPublishedOffers(opts?: {
  q?: string;
  page?: number;
}): Promise<{ items: PublicOfferRow[]; total: number; page: number; pageSize: number }> {
  const page = opts?.page && opts.page > 0 ? opts.page : 1;
  const pageSize = PUBLIC_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [eq(offers.status, "PUBLISHED")];
  if (opts?.q && opts.q.trim() !== "") {
    const term = `%${opts.q.trim()}%`;
    conditions.push(
      sql`(${ilike(offers.title, term)} OR ${ilike(offers.company, term)} OR ${ilike(offers.location, term)})`,
    );
  }
  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(offers)
      .where(where)
      .orderBy(desc(offers.publishedAt), desc(offers.createdAt))
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
 * Get a single PUBLISHED offer by UUID.
 * Returns null if not found OR not PUBLISHED (FR-042: no status/existence leak).
 */
export async function getPublishedOfferById(
  id: string,
): Promise<PublicOfferRow | null> {
  const rows = await db
    .select()
    .from(offers)
    .where(and(eq(offers.id, id), eq(offers.status, "PUBLISHED")))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * List all PUBLISHED offers for sitemap generation (no pagination).
 * Returns only id and publishedAt for sitemap URLs.
 */
export async function listPublishedOfferIds(): Promise<
  { id: string; publishedAt: Date | null }[]
> {
  const rows = await db
    .select({ id: offers.id, publishedAt: offers.publishedAt })
    .from(offers)
    .where(eq(offers.status, "PUBLISHED"))
    .orderBy(desc(offers.publishedAt));
  return rows;
}
