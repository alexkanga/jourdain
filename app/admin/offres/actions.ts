"use server";

import { requireCapability } from "@/lib/server/auth/authorization";
import {
  createOffer,
  updateOffer,
  getOfferById,
} from "@/lib/server/services/offers";
import { offerSchema } from "@/lib/server/validation/schemas";
import { revalidatePath } from "next/cache";

/**
 * createOfferAction + updateOfferAction Server Actions.
 *
 * Every action:
 * 1. authenticate server-side via requireCapability (getPrincipal → getSession);
 * 2. authorize server-side via can() reading principalType;
 * 3. validate input via Zod offerSchema (server-side authoritative);
 * 4. (for update) load existing offer, verify existence;
 * 5. execute the permitted mutation (preserve status + published_at);
 * 6. return controlled { ok, error? } — never throw to the client.
 *
 * Save ≠ Publish (BR-021): createOfferAction always saves as DRAFT.
 * updateOfferAction preserves status (FR-021, FR-025) and published_at (BR-022).
 */

export type OfferMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function parseDescription(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function createOfferAction(
  formData: FormData,
): Promise<OfferMutationResult> {
  try {
    await requireCapability("offer:create");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const raw = {
    title: String(formData.get("title") ?? ""),
    description: parseDescription(String(formData.get("description") ?? "")),
    company: String(formData.get("company") ?? "") || undefined,
    sector: String(formData.get("sector") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    contractType: String(formData.get("contractType") ?? "") || undefined,
    educationLevel: String(formData.get("educationLevel") ?? "") || undefined,
    experience: String(formData.get("experience") ?? "") || undefined,
    location: String(formData.get("location") ?? "") || undefined,
    sourcePublicationDate: String(formData.get("sourcePublicationDate") ?? "") || undefined,
    applicationDeadline: String(formData.get("applicationDeadline") ?? "") || undefined,
    sourceName: String(formData.get("sourceName") ?? "") || undefined,
    sourceUrl: String(formData.get("sourceUrl") ?? "") || undefined,
    applicationModalities: String(formData.get("applicationModalities") ?? "") || undefined,
    applicationEmail: String(formData.get("applicationEmail") ?? "") || undefined,
    applicationUrl: String(formData.get("applicationUrl") ?? "") || undefined,
  };

  const parsed = offerSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message ?? "Données invalides";
    return { ok: false, error: firstErr };
  }

  const r = await createOffer(parsed.data);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/admin/offres");
  return { ok: true, id: r.data.id };
}

export async function updateOfferAction(
  formData: FormData,
): Promise<OfferMutationResult> {
  try {
    await requireCapability("offer:edit");
    await requireCapability("offer:save");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Identifiant d'offre manquant" };

  // Concurrency: load + verify existence
  const existing = await getOfferById(id);
  if (!existing) return { ok: false, error: "Offre introuvable" };

  const raw = {
    title: String(formData.get("title") ?? ""),
    description: parseDescription(String(formData.get("description") ?? "")),
    company: String(formData.get("company") ?? "") || undefined,
    sector: String(formData.get("sector") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || undefined,
    contractType: String(formData.get("contractType") ?? "") || undefined,
    educationLevel: String(formData.get("educationLevel") ?? "") || undefined,
    experience: String(formData.get("experience") ?? "") || undefined,
    location: String(formData.get("location") ?? "") || undefined,
    sourcePublicationDate: String(formData.get("sourcePublicationDate") ?? "") || undefined,
    applicationDeadline: String(formData.get("applicationDeadline") ?? "") || undefined,
    sourceName: String(formData.get("sourceName") ?? "") || undefined,
    sourceUrl: String(formData.get("sourceUrl") ?? "") || undefined,
    applicationModalities: String(formData.get("applicationModalities") ?? "") || undefined,
    applicationEmail: String(formData.get("applicationEmail") ?? "") || undefined,
    applicationUrl: String(formData.get("applicationUrl") ?? "") || undefined,
  };

  const parsed = offerSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message ?? "Données invalides";
    return { ok: false, error: firstErr };
  }

  const r = await updateOffer(id, parsed.data);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/admin/offres");
  revalidatePath(`/admin/offres/${id}`);
  return { ok: true, id: r.data.id };
}
