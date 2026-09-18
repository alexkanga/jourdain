import { Inbox } from "lucide-react";

/**
 * PublicEmptyState — polished empty state for the public offers list.
 *
 * Two modes:
 *   - "no-offers": no PUBLISHED offers at all → welcoming message.
 *   - "no-results": search yielded nothing → search-specific message + reset.
 *
 * Uses a Lucide icon (Inbox) for visual warmth — no fake illustration
 * dependency, no external image.
 *
 * Server Component — no client JS.
 */

export function PublicEmptyState({
  mode,
  searchQuery,
  onReset,
}: {
  mode: "no-offers" | "no-results";
  searchQuery?: string;
  onReset?: () => void;
}) {
  if (mode === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface px-6 py-12 text-center">
        <Inbox className="h-10 w-10 text-text-secondary/50" aria-hidden="true" />
        <p className="mt-4 text-base font-medium text-text-primary">
          Aucune offre ne correspond à votre recherche.
        </p>
        {searchQuery && (
          <p className="mt-1 text-sm text-text-secondary">
            Pour « {searchQuery} »
          </p>
        )}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary mt-4"
          >
            Réinitialiser la recherche
          </button>
        )}
      </div>
    );
  }

  // mode === "no-offers"
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface px-6 py-12 text-center">
      <Inbox className="h-10 w-10 text-text-secondary/50" aria-hidden="true" />
      <p className="mt-4 text-base font-medium text-text-primary">
        Aucune offre disponible pour le moment.
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        Revenez prochainement pour découvrir de nouvelles opportunités.
      </p>
    </div>
  );
}
