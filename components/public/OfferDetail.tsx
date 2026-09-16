import { TiptapRenderer } from "./TiptapRenderer";
import type { PublicOfferRow } from "@/lib/server/services/public-offers";

/**
 * OfferDetail — public offer detail page content.
 * Per S5 §10.2: all available fields, company as "Entreprise non communiquée" if absent,
 * application modalities as informational block (no Apply button), source block if present.
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

export function OfferDetail({ offer }: { offer: PublicOfferRow }) {
  const hasApplicationInfo =
    offer.applicationModalities || offer.applicationEmail || offer.applicationUrl;
  const hasSourceInfo = offer.sourceName || offer.sourceUrl;

  return (
    <article className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span>{offer.company ? offer.company : "Entreprise non communiquée"}</span>
        {offer.location && <span>{offer.location}</span>}
        {offer.contractType && <span>{offer.contractType}</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
        {offer.sector && <span>Secteur : {offer.sector}</span>}
        {offer.category && <span>Catégorie : {offer.category}</span>}
        {offer.educationLevel && <span>Formation : {offer.educationLevel}</span>}
        {offer.experience && <span>Expérience : {offer.experience}</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
        <span>Publié le {formatDate(offer.publishedAt)}</span>
        {offer.sourcePublicationDate && (
          <span>Source : {formatDate(offer.sourcePublicationDate)}</span>
        )}
        {offer.applicationDeadline && (
          <span>Echéance : {formatDate(offer.applicationDeadline)}</span>
        )}
      </div>

      <div className="prose prose-sm mt-6 max-w-none">
        <TiptapRenderer content={offer.description} />
      </div>

      {hasApplicationInfo && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-700">Modalités de candidature</h2>
          <div className="mt-2 space-y-2 text-sm text-gray-600">
            {offer.applicationModalities && <p>{offer.applicationModalities}</p>}
            {offer.applicationEmail && (
              <p>
                Email :{" "}
                <a href={`mailto:${offer.applicationEmail}`} className="text-blue-600 hover:text-blue-800">
                  {offer.applicationEmail}
                </a>
              </p>
            )}
            {offer.applicationUrl && (
              <p>
                <a
                  href={offer.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Candidater en ligne
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {hasSourceInfo && (
        <div className="mt-4 text-sm text-gray-500">
          {offer.sourceName && <span>Source : {offer.sourceName}</span>}
          {offer.sourceUrl && (
            <a
              href={offer.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              Voir la source
            </a>
          )}
        </div>
      )}
    </article>
  );
}
