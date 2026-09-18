import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublishedOfferById } from "@/lib/server/services/public-offers";
import { OfferDetail } from "@/components/public/OfferDetail";
import type { Metadata } from "next";

/**
 * Public offer detail — /offres/{uuid} (FR-041, FR-042, ADR-0009).
 *
 * UI-02 refresh: back link + two-column layout (main Tiptap content +
 * right info panel). Existing query semantics unchanged:
 *   - Server-side: WHERE id = {uuid} AND status = 'PUBLISHED'.
 *   - Non-PUBLISHED or nonexistent → notFound() (FR-042: no status/existence leak).
 *   - Malformed UUID → notFound() before DB query.
 *
 * NO authentication required (PERM-001).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Offre introuvable" };
  const offer = await getPublishedOfferById(id);
  if (!offer) return { title: "Offre introuvable" };
  return {
    title: `${offer.title} — JOURDAIN EMPLOI`,
    description: offer.company
      ? `${offer.title} — ${offer.company}`
      : offer.title,
  };
}

export default async function PublicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Malformed UUID → notFound() without DB query (FR-042, ADR-0009)
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const offer = await getPublishedOfferById(id);
  if (!offer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-public-content px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary transition-colors duration-fast hover:text-brand-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux offres
      </Link>
      <OfferDetail offer={offer} />
    </div>
  );
}
