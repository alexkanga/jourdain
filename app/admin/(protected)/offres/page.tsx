import Link from "next/link";
import { listOffers } from "@/lib/server/services/offers";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LifecycleButtons } from "@/components/admin/LifecycleButtons";
import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * Admin offer list page — Server Component.
 *
 * Server-side authority: app/admin/layout.tsx validates authenticated
 * session via getPrincipal() before this page renders. An unauthenticated
 * request is redirected to /admin/login by the layout guard.
 *
 * Features:
 * - All offers regardless of status, sorted by created_at DESC (FR-010)
 * - Status badge visible per row (FR-011)
 * - Status filter via ?status=DRAFT|PUBLISHED|SUSPENDED|ARCHIVED (FR-012 MUST)
 * - Title search via ?q= (ILIKE on title, case-insensitive — FR-013 SHOULD)
 * - Pagination (FR-010 acceptance: list navigable)
 * - "Nouvelle offre" button links to /admin/offres/nouvelles
 * - Empty state (FR-061)
 * - Lifecycle actions per row, depending on current status
 */

const STATUS_OPTIONS: OfferStatus[] = ["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"];
const STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  SUSPENDED: "Suspendue",
  ARCHIVED: "Archivée",
};

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && STATUS_OPTIONS.includes(sp.status as OfferStatus)
      ? (sp.status as OfferStatus)
      : undefined;
  const q = sp.q?.trim() || undefined;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const { items, total, pageSize } = await listOffers({ status, q, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Offres</h1>
        <Link
          href="/admin/offres/nouvelles"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Nouvelle offre
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form action="/admin/offres" method="GET" className="flex flex-col">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Statut
          </label>
          <div className="flex gap-2">
            <select
              key={`status-${status ?? ""}`}
              defaultValue={status ?? ""}
              name="status"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {q && (
              <input type="hidden" name="q" value={q} />
            )}
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Filtrer
            </button>
          </div>
        </form>
        <form className="flex-1 min-w-[200px]" action="/admin/offres" method="GET" role="search">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Recherche par titre
          </label>
          <div className="flex gap-2">
            <input
              key={`q-${q ?? ""}`}
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Rechercher…"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Filtrer
            </button>
            {(q || status) && (
              <Link
                href="/admin/offres"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Réinitialiser
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-8 text-center text-gray-500">
          {total === 0
            ? "Aucune offre disponible"
            : "Aucune offre ne correspond à votre filtre"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="px-4 py-3 font-medium">Entreprise</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Publiée le</th>
                <th className="px-4 py-3 font-medium">Échéance</th>
                <th className="px-4 py-3 font-medium">Maj</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/offres/${offer.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {offer.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {offer.company || (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={offer.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(offer.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(offer.applicationDeadline)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(offer.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <LifecycleButtons id={offer.id} status={offer.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {total} offre{total > 1 ? "s" : ""} — page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/offres?${new URLSearchParams({
                  ...(status ? { status } : {}),
                  ...(q ? { q } : {}),
                  page: String(page - 1),
                }).toString()}`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                Précédent
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/admin/offres?${new URLSearchParams({
                  ...(status ? { status } : {}),
                  ...(q ? { q } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                Suivant
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
