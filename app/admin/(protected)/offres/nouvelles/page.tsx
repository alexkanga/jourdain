import { OfferForm } from "@/components/admin/OfferForm";

/**
 * New offer form page — /admin/offres/nouvelles
 *
 * Server-side auth guard: app/admin/layout.tsx validates authenticated
 * session via getPrincipal() before this page renders.
 *
 * The form saves the new offer as DRAFT (BR-021 save ≠ publish; createOfferAction
 * always sets status='DRAFT', published_at=NULL).
 */

export default function NewOfferPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Nouvelle offre</h1>
      <OfferForm mode="create" />
    </div>
  );
}
