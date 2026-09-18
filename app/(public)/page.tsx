import Link from "next/link";
import { Search, X } from "lucide-react";
import { listPublishedOffers } from "@/lib/server/services/public-offers";
import { OfferCard } from "@/components/public/OfferCard";
import { PublicHero } from "@/components/public/PublicHero";
import { PublicEmptyState } from "@/components/public/PublicEmptyState";
import type { Metadata } from "next";

/**
 * Public offer list — root URL `/` (FR-040).
 *
 * UI-02 refresh: hero + prominent search panel + responsive card grid
 * + redesigned pagination. Existing query semantics unchanged:
 *   - PUBLISHED-only filter (BR-025)
 *   - Search via ?q= on title/company/location (FR-050, ADR-0010)
 *   - Pagination: 12 per page, server-side (FR-040)
 *   - Ordering: published_at DESC, created_at DESC (BR-070, BR-071)
 *
 * NO authentication required (PERM-001).
 */

export const metadata: Metadata = {
  title: "Offres d'emploi",
  description: "Consultez les offres d'emploi publiées sur JOURDAIN EMPLOI.",
};

export default async function PublicListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const { items, total, pageSize } = await listPublishedOffers({ q, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasQuery = !!q;

  // Build pagination URLs preserving the query parameter
  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/?${params.toString()}`;
  }

  // Section heading depends on whether there's an active search
  const sectionHeading = hasQuery ? "Résultats de recherche" : "Offres récentes";
  const sectionSubtitle = hasQuery
    ? items.length > 0
      ? `${total} offre${total > 1 ? "s" : ""} trouvée${total > 1 ? "s" : ""} pour « ${q} »`
      : `Aucune offre trouvée pour « ${q} »`
    : "Découvrez les dernières opportunités disponibles.";

  return (
    <>
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <PublicHero />

      {/* ─── Search panel ─────────────────────────────────────────── */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-public-content px-4 py-6 sm:px-6">
          <form action="/" method="GET" role="search" className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="search-input" className="sr-only">
              Rechercher un poste, une entreprise ou un lieu
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary"
                aria-hidden="true"
              />
              <input
                id="search-input"
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Rechercher un poste, une entreprise ou un lieu..."
                className="w-full rounded-sm border border-border-strong bg-surface py-2.5 pl-11 pr-4 text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <button
              type="submit"
              className="btn-primary sm:w-auto"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Rechercher
            </button>
            {hasQuery && (
              <Link
                href="/"
                className="btn-ghost text-text-secondary hover:text-text-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Réinitialiser
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* ─── Results section ──────────────────────────────────────── */}
      <div className="mx-auto max-w-public-content px-4 py-8 sm:px-6">
        {/* Section heading */}
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold text-text-primary sm:text-2xl">
            {sectionHeading}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {sectionSubtitle}
          </p>
        </div>

        {/* Cards / empty state */}
        {items.length === 0 ? (
          hasQuery ? (
            <PublicEmptyState mode="no-results" searchQuery={q} />
          ) : (
            <PublicEmptyState mode="no-offers" />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {items.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Pagination">
            <span className="text-sm text-text-secondary">
              {total} offre{total > 1 ? "s" : ""} — page {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="btn-secondary"
                  aria-label="Page précédente"
                >
                  ← Précédent
                </Link>
              ) : (
                <span
                  className="btn-secondary cursor-not-allowed opacity-50"
                  aria-disabled="true"
                >
                  ← Précédent
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="btn-secondary"
                  aria-label="Page suivante"
                >
                  Suivant →
                </Link>
              ) : (
                <span
                  className="btn-secondary cursor-not-allowed opacity-50"
                  aria-disabled="true"
                >
                  Suivant →
                </span>
              )}
            </div>
          </nav>
        )}
      </div>
    </>
  );
}
