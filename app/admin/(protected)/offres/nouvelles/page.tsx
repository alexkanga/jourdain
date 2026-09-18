import { OfferForm } from "@/components/admin/OfferForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

/**
 * Create offer page — /admin/offres/nouvelles
 *
 * UI-03: migrated to Methodist tokens. AdminPageHeader replaces inline h1.
 * createOfferAction always saves as DRAFT (BR-021 save ≠ publish).
 */

export default async function CreateOfferPage() {
  return (
    <div>
      <AdminPageHeader title="Nouvelle offre" />
      <OfferForm mode="create" />
    </div>
  );
}
