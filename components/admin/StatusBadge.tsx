import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * StatusBadge — French status badge for an offer.
 * Pure server component (no client-side state).
 */

const STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  SUSPENDED: "Suspendue",
  ARCHIVED: "Archivée",
};

const STATUS_CLASSES: Record<OfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  SUSPENDED: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
