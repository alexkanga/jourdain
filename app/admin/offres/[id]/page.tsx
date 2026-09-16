import { notFound } from "next/navigation";
import { getOfferById } from "@/lib/server/services/offers";
import { OfferForm } from "@/components/admin/OfferForm";

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
    </div>
  );
}
