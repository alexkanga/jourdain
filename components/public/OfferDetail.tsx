import { MapPin, Briefcase, Calendar, Clock } from "lucide-react";
import { TiptapRenderer } from "./TiptapRenderer";
import { OfferInfoPanel } from "./OfferInfoPanel";
import type { PublicOfferRow } from "@/lib/server/services/public-offers";

/**
 * OfferDetail — public offer detail page content.
 *
 * Per UI-02 spec: two-column desktop layout (main Tiptap content +
 * right information panel). Mobile: single-column, info panel stacks
 * below the main content.
 *
 * Per S5 §10.2: all available fields, company as "Entreprise non communiquée" if absent,
 * application modalities as informational block (no Apply button), source block if present.
 *
 * URL SAFETY: application_url and source_url are validated at render time
 * (defense in depth). Only http/https URLs are rendered as clickable links.
 * Unsafe values (javascript:, data:, vbscript:, file:, etc.) are silently
 * omitted — no clickable <a> is rendered, no unsafe href is emitted in markup.
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

export function OfferDetail({ offer }: { offer: PublicOfferRow }) {
  const safeAppUrl = safeHttpUrl(offer.applicationUrl);
  const hasApplicationInfo =
    offer.applicationModalities || offer.applicationEmail || safeAppUrl;

  return (
    <article>
      {/* ─── Title area ───────────────────────────────────────────── */}
      <h1 className="font-heading text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
        {offer.title}
      </h1>

      {/* Company */}
      <p className="mt-2 text-lg text-text-secondary">
        {offer.company ? offer.company : "Entreprise non communiquée"}
      </p>

      {/* Metadata summary — location + contract type */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
        {offer.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-brand-primary/70" aria-hidden="true" />
            {offer.location}
          </span>
        )}
        {offer.contractType && (
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 shrink-0 text-brand-primary/70" aria-hidden="true" />
            {offer.contractType}
          </span>
        )}
        {offer.publishedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-brand-primary/70" aria-hidden="true" />
            Publié le {formatDate(offer.publishedAt)}
          </span>
        )}
        {offer.applicationDeadline && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 text-brand-gold/70" aria-hidden="true" />
            Date limite : {formatDate(offer.applicationDeadline)}
          </span>
        )}
      </div>

      {/* Divider */}
      <hr className="mt-6 border-border" />

      {/* ─── Two-column layout: main content + info panel ─────────── */}
      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Main content — Tiptap description + application info */}
        <div className="min-w-0 flex-1 lg:max-w-2xl">
          {/* Tiptap description — readable prose */}
          <div className="prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-text-primary prose-p:text-text-primary prose-p:leading-relaxed prose-a:text-brand-primary prose-strong:text-text-primary prose-li:text-text-primary">
            <TiptapRenderer content={offer.description} />
          </div>

          {/* Application modalities — informational only, no Apply button */}
          {hasApplicationInfo && (
            <div className="mt-8 rounded-lg border border-border bg-surface-muted p-5">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-text-primary">
                Modalités de candidature
              </h2>
              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                {offer.applicationModalities && <p>{offer.applicationModalities}</p>}
                {offer.applicationEmail && (
                  <p>
                    Email :{" "}
                    <a
                      href={`mailto:${offer.applicationEmail}`}
                      className="text-brand-primary transition-colors duration-fast hover:text-brand-primary-hover"
                    >
                      {offer.applicationEmail}
                    </a>
                  </p>
                )}
                {safeAppUrl && (
                  <p>
                    <a
                      href={safeAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary transition-colors duration-fast hover:text-brand-primary-hover"
                    >
                      Candidater en ligne
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info panel — right sidebar on desktop, below on mobile */}
        <div className="lg:w-80 lg:shrink-0">
          <OfferInfoPanel offer={offer} />
        </div>
      </div>
    </article>
  );
}
