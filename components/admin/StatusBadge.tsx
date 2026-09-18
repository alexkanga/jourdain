import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * StatusBadge — French status badge for an offer.
 * Pure server component (no client-side state).
 *
 * UI-03: migrated to Methodist semantic tokens.
 * Labels unchanged (e2e asserts exact French strings).
 *
 * DRAFT:     Brouillon   — neutral/slate
 * PUBLISHED: Publiée     — green (success)
 * SUSPENDED: Suspendue   — gold/amber (warning)
 * ARCHIVED:  Archivée    — muted red/slate
 */

const STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  SUSPENDED: "Suspendue",
  ARCHIVED: "Archivée",
};

const STATUS_CLASSES: Record<OfferStatus, string> = {
  DRAFT: "bg-surface-muted text-text-secondary",
  PUBLISHED: "bg-success-surface text-success",
  SUSPENDED: "bg-warning-surface text-warning",
  ARCHIVED: "bg-danger-surface text-danger",
};

export function StatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
