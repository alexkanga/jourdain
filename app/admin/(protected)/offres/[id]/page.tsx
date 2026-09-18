import { notFound } from "next/navigation";
import { getOfferById } from "@/lib/server/services/offers";
import { OfferForm } from "@/components/admin/OfferForm";
import { LifecycleButtons } from "@/components/admin/LifecycleButtons";
import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * Edit offer page — /admin/offres/[id]
 *
 * Server-side auth guard: app/admin/layout.tsx validates authenticated
 * session via getPrincipal() before this page renders.
 *
 * Loads the existing offer server-side and passes it to the OfferForm
 * Client Component. updateOfferAction preserves status (FR-025) and
 * published_at (BR-022) on save.
 *
 * Lifecycle buttons (Suspendre, Republier, Archiver) are shown below the
 * form depending on the current status, matching the list page behavior.
 *
 * FR-021: editing is allowed for any existing offer regardless of status.
 * ARCHIVED offers may be edited (content can change) but status stays ARCHIVED.
 */

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offer = await getOfferById(id);
  if (!offer) notFound();

  // Pass the offer row to the client form. description is Tiptap JSON (object).
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        Modifier l&apos;offre
      </h1>
      <OfferForm mode="edit" offer={offer} />
      {offer.status !== "DRAFT" && offer.status !== "ARCHIVED" && (
        <div className="mt-8 border-t border-gray-200 pt-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Actions sur le cycle de vie
          </h2>
          <LifecycleButtons id={offer.id} status={offer.status as OfferStatus} />
        </div>
      )}
    </div>
  );
}
