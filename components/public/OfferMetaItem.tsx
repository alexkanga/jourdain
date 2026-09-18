import type { LucideIcon } from "lucide-react";

/**
 * OfferMetaItem — compact metadata row with icon + label + value.
 *
 * Used in the OfferCard and OfferInfoPanel to display offer metadata
 * (company, location, contract type, education level, dates).
 * Only rendered when the value is present — no blank labels.
 *
 * Server Component — no client JS.
 */

export function OfferMetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <Icon className="h-4 w-4 shrink-0 text-brand-primary/70" aria-hidden="true" />
      <span className="font-medium text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
