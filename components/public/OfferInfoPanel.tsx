import { Building2, MapPin, Briefcase, GraduationCap, Calendar, Clock, Globe } from "lucide-react";
import type { PublicOfferRow } from "@/lib/server/services/public-offers";
import { OfferMetaItem } from "./OfferMetaItem";

/**
 * OfferInfoPanel — right-side information panel on the offer detail page.
 *
 * Per UI-02 spec: white card, subtle border/shadow, rounded, sticky on
 * desktop. Contains: Secteur, Catégorie, Contrat, Formation,
 * Expérience, Lieu, Publié le, Date limite, Source.
 *
 * Only displays fields that exist — no blank labels.
 *
 * URL SAFETY: source_url is validated at render time (defense in depth).
 * Only http/https URLs are rendered as clickable links.
 *
 * Server Component — no client JS.
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

function safeHttpUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

export function OfferInfoPanel({ offer }: { offer: PublicOfferRow }) {
  const safeSourceUrl = safeHttpUrl(offer.sourceUrl);
  const hasSourceInfo = offer.sourceName || safeSourceUrl;

  // Collect only the metadata items that have values
  const items: { icon: typeof Building2; label: string; value: string }[] = [];
  if (offer.sector) items.push({ icon: Building2, label: "Secteur", value: offer.sector });
  if (offer.category) items.push({ icon: Briefcase, label: "Catégorie", value: offer.category });
  if (offer.contractType) items.push({ icon: Briefcase, label: "Contrat", value: offer.contractType });
  if (offer.educationLevel) items.push({ icon: GraduationCap, label: "Formation", value: offer.educationLevel });
  if (offer.experience) items.push({ icon: Briefcase, label: "Expérience", value: offer.experience });
  if (offer.location) items.push({ icon: MapPin, label: "Lieu", value: offer.location });
  if (offer.publishedAt) items.push({ icon: Calendar, label: "Publié le", value: formatDate(offer.publishedAt) });
  if (offer.sourcePublicationDate) items.push({ icon: Calendar, label: "Date source", value: formatDate(offer.sourcePublicationDate) });
  if (offer.applicationDeadline) items.push({ icon: Clock, label: "Date limite", value: formatDate(offer.applicationDeadline) });

  return (
    <aside className="card-surface h-fit p-5 lg:sticky lg:top-20">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-text-primary">
        Informations sur l&apos;offre
      </h2>

      {items.length > 0 && (
        <dl className="mt-4 space-y-3">
          {items.map((item, i) => (
            <OfferMetaItem
              key={i}
              icon={item.icon}
              label={item.label}
              value={item.value}
            />
          ))}
        </dl>
      )}

      {/* Source block — only when source_name or safe source_url exists */}
      {hasSourceInfo && (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text-primary">Source</h3>
          <div className="mt-2 space-y-1 text-sm text-text-secondary">
            {offer.sourceName && <p>{offer.sourceName}</p>}
            {safeSourceUrl && (
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-primary transition-colors duration-fast hover:text-brand-primary-hover"
              >
                <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
                Voir la source
              </a>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
