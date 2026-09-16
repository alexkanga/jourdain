"use server";

import { requireCapability } from "@/lib/server/auth/authorization";
import {
  publishOffer,
  suspendOffer,
  republishOffer,
  archiveOffer,
} from "@/lib/server/services/offers";
import { offerIdSchema } from "@/lib/server/validation/schemas";
import { revalidatePath } from "next/cache";

/**
 * Lifecycle Server Actions for offers.
 *
 * Every action:
 * 1. authenticate server-side via requireCapability (getPrincipal → getSession);
 * 2. authorize server-side via can() reading principalType (NOT Better Auth role);
 * 3. validate input via Zod offerIdSchema;
 * 4. validate lifecycle state server-side (load offer, verify current status);
 * 5. execute only the permitted mutation;
 * 6. return a controlled result { ok, error? } — never throw to the client.
 *
 * ARCHIVED is terminal (BR-024) — no V1 action transitions out.
 * published_at: SET on first publish; PRESERVED on suspend, republish, archive (BR-022).
 */

export type LifecycleActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function publishOfferAction(
  formData: FormData,
): Promise<LifecycleActionResult> {
  try {
    await requireCapability("offer:publish");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const parsed = offerIdSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Identifiant d'offre invalide" };
  }
  const r = await publishOffer(parsed.data.id);
  if (!r.ok) return r;
  revalidatePath("/admin/offres");
  revalidatePath(`/admin/offres/${parsed.data.id}`);
  return { ok: true };
}

export async function suspendOfferAction(
  formData: FormData,
): Promise<LifecycleActionResult> {
  try {
    await requireCapability("offer:suspend");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const parsed = offerIdSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Identifiant d'offre invalide" };
  }
  const r = await suspendOffer(parsed.data.id);
  if (!r.ok) return r;
  revalidatePath("/admin/offres");
  revalidatePath(`/admin/offres/${parsed.data.id}`);
  return { ok: true };
}

export async function republishOfferAction(
  formData: FormData,
): Promise<LifecycleActionResult> {
  try {
    await requireCapability("offer:republish");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const parsed = offerIdSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Identifiant d'offre invalide" };
  }
  const r = await republishOffer(parsed.data.id);
  if (!r.ok) return r;
  revalidatePath("/admin/offres");
  revalidatePath(`/admin/offres/${parsed.data.id}`);
  return { ok: true };
}

export async function archiveOfferAction(
  formData: FormData,
): Promise<LifecycleActionResult> {
  try {
    await requireCapability("offer:archive");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const parsed = offerIdSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Identifiant d'offre invalide" };
  }
  const r = await archiveOffer(parsed.data.id);
  if (!r.ok) return r;
  revalidatePath("/admin/offres");
  revalidatePath(`/admin/offres/${parsed.data.id}`);
  return { ok: true };
}
