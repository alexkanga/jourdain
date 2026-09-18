import { notFound } from "next/navigation";
import { getOfferById } from "@/lib/server/services/offers";
import { OfferForm } from "@/components/admin/OfferForm";
import { LifecycleButtons } from "@/components/admin/LifecycleButtons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { can } from "@/lib/server/auth/capabilities";
import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * Edit offer page — /admin/offres/[id]
 *
 * UI-03: migrated to Methodist tokens. Added Restore action on the edit
 * page for ARCHIVED offers when the principal has offer:restore capability
 * (SUPER_ADMIN, FANTOMAS). ADMIN sees no Restore button. Server-side
 * restoreOfferAction enforces requireCapability("offer:restore").
 *
 * Server-side auth guard: admin layout validates authenticated session.
 * Loads the existing offer server-side and passes it to the OfferForm.
 * updateOfferAction preserves status (FR-025) and published_at (BR-022).
 *
 * FR-021: editing is allowed for any existing offer regardless of status.
 * ARCHIVED offers may be edited (content can change) but status stays
 * ARCHIVED until explicitly restored.
 */

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offer = await getOfferById(id);
  if (!offer) notFound();

  // Compute offer:restore capability for the edit page — passed to
  // LifecycleButtons so Restaurer appears for SUPER_ADMIN/FANTOMAS on
  // archived offers. ADMIN sees no Restore button.
  const principal = await getPrincipal();
  const canRestoreOffer = principal ? can(principal, "offer:restore") : false;

  // Lifecycle actions section: shown for active statuses (PUBLISHED,
  // SUSPENDED) AND for ARCHIVED when the principal can restore. DRAFT
  // has no lifecycle actions on the edit page (it has Publier on the
  // list page).
  const showLifecycleActions =
    offer.status !== "DRAFT" && (offer.status !== "ARCHIVED" || canRestoreOffer);

  return (
    <div>
      <AdminPageHeader title="Modifier l'offre" />

      <OfferForm mode="edit" offer={offer} />

      {showLifecycleActions && (
        <div className="mt-8 border-t border-border pt-4">
          <h2 className="mb-3 font-heading text-sm font-semibold text-text-primary">
            Actions sur le cycle de vie
          </h2>
          <LifecycleButtons
            id={offer.id}
            status={offer.status as OfferStatus}
            canRestoreOffer={canRestoreOffer}
          />
        </div>
      )}
    </div>
  );
}
