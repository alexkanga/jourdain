import Link from "next/link";
import { listOffers } from "@/lib/server/services/offers";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LifecycleButtons } from "@/components/admin/LifecycleButtons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { OfferStatus } from "@/lib/server/services/offers";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { can } from "@/lib/server/auth/capabilities";
import { Plus } from "lucide-react";

/**
 * Admin offer list page — Server Component.
 *
 * UI-03: Methodist admin refresh — AdminPageHeader, cohesive filters,
 * responsive table (overflow-x-auto on mobile), empty state, consistent
 * status badges, lifecycle action buttons with Methodist variants.
 *
 * Server-side authority: admin layout guard validates authenticated session.
 * Status filter + title search + pagination semantics unchanged.
 * canRestoreOffer computed from principal capability and passed to
 * LifecycleButtons — UX only, server-side requireCapability is authoritative.
 */

const STATUS_OPTIONS: OfferStatus[] = ["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"];
const STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  SUSPENDED: "Suspendue",
  ARCHIVED: "Archivée",
};

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
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

  // Compute offer:restore capability for the current principal.
  const principal = await getPrincipal();
  const canRestoreOffer = principal ? can(principal, "offer:restore") : false;

  return (
    <div>
      {/* Page header */}
      <AdminPageHeader
        title="Offres"
        description="Gérez les offres d'emploi publiées sur JOURDAIN."
        action={
          <Link
            href="/admin/offres/nouvelles"
            className="btn-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle offre
          </Link>
        }
      />

      {/* Filters — cohesive row on desktop, stacked on mobile */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Status filter */}
        <form action="/admin/offres" method="GET" className="flex flex-col">
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Statut
          </label>
          <div className="flex gap-2">
            <select
              key={`status-${status ?? ""}`}
              defaultValue={status ?? ""}
              name="status"
              className="form-input !w-auto"
            >
              <option value="">Tous</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {q && <input type="hidden" name="q" value={q} />}
            <button type="submit" className="btn-secondary !px-3 !py-2 !text-sm">
              Filtrer
            </button>
          </div>
        </form>

        {/* Title search */}
        <form className="flex flex-1 flex-col sm:min-w-[200px]" action="/admin/offres" method="GET" role="search">
          <label className="mb-1 block text-xs font-medium text-text-secondary" htmlFor="admin-offer-search">
            Recherche par titre
          </label>
          <div className="flex gap-2">
            <input
              id="admin-offer-search"
              key={`q-${q ?? ""}`}
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Rechercher…"
              className="form-input"
            />
            <button type="submit" className="btn-secondary !px-3 !py-2 !text-sm">
              Filtrer
            </button>
          </div>
        </form>

        {/* Reset */}
        {(q || status) && (
          <Link
            href="/admin/offres"
            className="btn-ghost !px-3 !py-2 !text-sm self-end"
          >
            Réinitialiser
          </Link>
        )}
      </div>

      {/* List / empty state */}
      {items.length === 0 ? (
        <div className="card-surface p-8 text-center text-text-secondary">
          {total === 0
            ? "Aucune offre ne correspond à vos critères."
            : "Aucune offre disponible."}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
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
            <tbody>
              {items.map((offer) => (
                <tr key={offer.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/offres/${offer.id}`}
                      className="font-medium text-brand-primary hover:text-brand-primary-hover"
                    >
                      {offer.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {offer.company || (
                      <span className="text-text-secondary/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={offer.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(offer.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(offer.applicationDeadline)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(offer.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <LifecycleButtons id={offer.id} status={offer.status} canRestoreOffer={canRestoreOffer} />
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
          <span className="text-text-secondary">
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
                className="btn-secondary !px-3 !py-1.5 !text-sm"
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
                className="btn-secondary !px-3 !py-1.5 !text-sm"
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
