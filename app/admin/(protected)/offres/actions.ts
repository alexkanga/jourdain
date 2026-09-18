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
    const parsed = JSON.parse(value);
    return normalizeTiptapDoc(parsed);
  } catch {
    return null;
  }
}

/**
 * Normalize Tiptap document: split paragraphs containing hardBreak nodes
 * into separate paragraph nodes. This fixes the common case where pasted
 * multi-line plain text is stored as one paragraph with <br> (hardBreak)
 * nodes instead of proper separate paragraphs.
 *
 * Only affects paragraph nodes with hardBreak in their content.
 * Leaves properly structured docs (multiple paragraphs, headings, lists)
 * unchanged. Preserves text marks (bold, italic, link).
 */
function normalizeTiptapDoc(doc: unknown): unknown {
  if (!doc || typeof doc !== "object") return doc;
  const d = doc as { type?: string; content?: unknown[] };
  if (d.type !== "doc" || !Array.isArray(d.content)) return doc;

  const newContent: unknown[] = [];
  for (const node of d.content) {
    const n = node as { type?: string; content?: unknown[] };
    if (n.type !== "paragraph" || !Array.isArray(n.content)) {
      newContent.push(node);
      continue;
    }

    // Check if this paragraph contains any hardBreak nodes
    const hasHardBreak = n.content.some(
      (c) => (c as { type?: string }).type === "hardBreak",
    );
    if (!hasHardBreak) {
      newContent.push(node);
      continue;
    }

    // Split the paragraph at hardBreak nodes into separate paragraphs
    let currentParagraph: { type: string; content: unknown[] } = {
      type: "paragraph",
      content: [],
    };
    for (const child of n.content) {
      const c = child as { type?: string };
      if (c.type === "hardBreak") {
        // Flush current paragraph if non-empty
        if (currentParagraph.content.length > 0) {
          newContent.push(currentParagraph);
        }
        currentParagraph = { type: "paragraph", content: [] };
      } else {
        currentParagraph.content.push(child);
      }
    }
    // Don't forget the last paragraph
    if (currentParagraph.content.length > 0) {
      newContent.push(currentParagraph);
    }
  }

  return { ...d, content: newContent };
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
