import Link from "next/link";
import { Building2, MapPin, Briefcase, GraduationCap, Calendar, Clock, ArrowRight } from "lucide-react";
import type { PublicOfferRow } from "@/lib/server/services/public-offers";

/**
 * OfferCard — public offer card displayed in the offer list.
 *
 * Per UI-02 spec: white surface, subtle border, medium/large radius,
 * restrained shadow, clear spacing, title visually dominant, company
 * secondary, metadata in compact rows/chips, green link/action, tiny
 * gold accent allowed.
 *
 * Per S5 §10.1: title, company (if present), location (if present),
 * contract_type (if present), published_at, application_deadline (if present),
 * "Voir l'offre" link. Absent fields omitted (no placeholder).
 * Per BR-033: company omitted on card if absent (no "Entreprise non communiquée" on card).
 *
 * Hover (desktop): border becomes slightly brand-green, shadow increases
 * subtly, translateY max -2px, arrow moves a few pixels.
 * Duration: 150–250ms. Respects prefers-reduced-motion (handled by globals.css).
 *
 * Server Component — no client JS. The card is NOT a single clickable
 * element (to avoid nested interactive controls); the "Voir l'offre"
 * link is the explicit action.
 */

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function OfferCard({ offer }: { offer: PublicOfferRow }) {
  return (
    <article className="group card-surface flex flex-col p-5 transition-all duration-fast hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-card">
      {/* Title — visually dominant */}
      <h2 className="font-heading text-lg font-bold leading-snug text-text-primary">
        {offer.title}
      </h2>

      {/* Company — secondary */}
      {offer.company && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
          <Building2 className="h-4 w-4 shrink-0 text-brand-primary/60" aria-hidden="true" />
          {offer.company}
        </p>
      )}

      {/* Metadata — compact rows, only when present */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-secondary">
        {offer.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-brand-primary/60" aria-hidden="true" />
            {offer.location}
          </span>
        )}
        {offer.contractType && (
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 shrink-0 text-brand-primary/60" aria-hidden="true" />
            {offer.contractType}
          </span>
        )}
        {offer.educationLevel && (
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 shrink-0 text-brand-primary/60" aria-hidden="true" />
            {offer.educationLevel}
          </span>
        )}
        {offer.publishedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-brand-primary/60" aria-hidden="true" />
            {formatDate(offer.publishedAt)}
          </span>
        )}
        {offer.applicationDeadline && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 text-brand-gold/70" aria-hidden="true" />
            Date limite : {formatDate(offer.applicationDeadline)}
          </span>
        )}
      </div>

      {/* Action — explicit "Voir l'offre" link */}
      <div className="mt-4 pt-1">
        <Link
          href={`/offres/${offer.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary transition-colors duration-fast hover:text-brand-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Voir l&apos;offre
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-fast group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
