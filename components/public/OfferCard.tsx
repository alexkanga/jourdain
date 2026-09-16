import Link from "next/link";
import type { PublicOfferRow } from "@/lib/server/services/public-offers";

/**
 * OfferCard — public offer card displayed in the offer list.
 * Per S5 §10.1: title, company (if present), location (if present),
 * contract_type (if present), published_at, application_deadline (if present),
 * "Voir l'offre" link. Absent fields omitted (no placeholder).
 * Per BR-033: company omitted on card if absent (no "Entreprise non communiquée" on card).
 */

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function OfferCard({ offer }: { offer: PublicOfferRow }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-lg font-semibold text-gray-900">
        {offer.title}
      </h2>
      {offer.company && (
        <p className="mt-1 text-sm text-gray-600">{offer.company}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
        {offer.location && <span>{offer.location}</span>}
        {offer.contractType && <span>{offer.contractType}</span>}
        <span>Publié le {formatDate(offer.publishedAt)}</span>
        {offer.applicationDeadline && (
          <span>Echéance : {formatDate(offer.applicationDeadline)}</span>
        )}
      </div>
      <Link
        href={`/offres/${offer.id}`}
        className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Voir l&apos;offre
      </Link>
    </article>
  );
}
