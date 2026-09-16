import Link from "next/link";
import { listPublishedOffers } from "@/lib/server/services/public-offers";
import { OfferCard } from "@/components/public/OfferCard";
import type { Metadata } from "next";

/**
 * Public offer list — root URL `/` (FR-040).
 *
 * Displays PUBLISHED offers sorted by published_at DESC, created_at DESC.
 * Server-side PUBLISHED-only filtering (BR-025).
 * Search via ?q= (FR-050 SHOULD, ADR-0010).
 * Pagination: simple page-based server-side (FR-040).
 * Empty state: "Aucune offre disponible actuellement" (FR-060).
 *
 * NO authentication required (PERM-001).
 */

export const metadata: Metadata = {
  title: "JOURDAIN EMPLOI — Offres d'emploi",
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Offres d&apos;emploi</h1>

      {/* Search */}
      <form action="/" method="GET" className="mt-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par titre, entreprise, lieu…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Rechercher
        </button>
        {(q || sp.page) && (
          <Link
            href="/"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {/* List */}
      {items.length === 0 ? (
        <div className="mt-8 rounded-md border border-gray-200 bg-white p-8 text-center text-gray-500">
          {q
            ? "Aucune offre ne correspond à votre recherche."
            : "Aucune offre disponible actuellement."}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {total} offre{total > 1 ? "s" : ""} — page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) }).toString()}`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) }).toString()}`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                Suivant
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
