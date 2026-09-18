"use server";

import { requireCapability, getPrincipal } from "@/lib/server/auth/authorization";
import {
  listManagedUsers,
  getManagedUserById,
  createManagedUser,
  updateManagedUser,
  deleteManagedUser,
  type ManagedUserRow,
} from "@/lib/server/services/users";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/server/validation/user-schemas";
import { revalidatePath } from "next/cache";
import type { Principal } from "@/lib/server/auth/capabilities";

/**
 * User-management Server Actions.
 *
 * Every action:
 *   1. authenticates server-side via requireCapability (getPrincipal → can());
 *   2. authorizes via principalType (ADMIN: NO; SUPER_ADMIN: YES; FANTOMAS: YES);
 *   3. validates input via Zod;
 *   4. executes only the permitted mutation (with service-layer lockout
 *      protections as defense-in-depth);
 *   5. returns a controlled { ok, error? } — never throws to the client.
 *
 * Per user-management work package:
 *   - ADMIN cannot invoke any user:* action (requireCapability throws).
 *   - SUPER_ADMIN and FANTOMAS can invoke all user:* actions.
 *   - The Fantomas DB-backed user is excluded from list results and any
 *     attempt to update/delete it returns "Utilisateur introuvable".
 */

export type UserMutationResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

// ─── List ────────────────────────────────────────────────────────────

export async function listManagedUsersAction(): Promise<
  { ok: true; users: ManagedUserRow[] } | { ok: false; error: string }
> {
  try {
    await requireCapability("user:list");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  try {
    const users = await listManagedUsers();
    return { ok: true, users };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[listManagedUsersAction] error:", msg);
    return { ok: false, error: "Erreur technique" };
  }
}

// ─── Create ──────────────────────────────────────────────────────────

export async function createUserAction(
  formData: FormData,
): Promise<UserMutationResult> {
  try {
    await requireCapability("user:create");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const raw = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message ?? "Données invalides";
    return { ok: false, error: firstErr };
  }
  const input: CreateUserInput = parsed.data;
  const r = await createManagedUser(input);
  if (!r.ok) return r;
  revalidatePath("/admin/utilisateurs");
  return { ok: true, id: r.data.id };
}

// ─── Update ──────────────────────────────────────────────────────────

export async function updateUserAction(
  formData: FormData,
): Promise<UserMutationResult> {
  let caller: Principal;
  try {
    caller = await requireCapability("user:update");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  // Per user-management final correction #2: password reset is REMOVED
  // from V1. The edit flow does NOT include a password field — only
  // username, email, and role.
  const raw = {
    id: String(formData.get("id") ?? ""),
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message ?? "Données invalides";
    return { ok: false, error: firstErr };
  }
  const input: UpdateUserInput = parsed.data;
  const r = await updateManagedUser(input, caller);
  if (!r.ok) return r;
  revalidatePath("/admin/utilisateurs");
  revalidatePath(`/admin/utilisateurs/${input.id}`);
  return { ok: true, id: r.data.id };
}

// ─── Delete ──────────────────────────────────────────────────────────

export async function deleteUserAction(
  formData: FormData,
): Promise<UserMutationResult> {
  let caller: Principal;
  try {
    caller = await requireCapability("user:delete");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const parsed = deleteUserSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Identifiant d'utilisateur invalide" };
  }
  const r = await deleteManagedUser(parsed.data.id, caller);
  if (!r.ok) return r;
  revalidatePath("/admin/utilisateurs");
  return { ok: true };
}

// ─── Get single (for edit form) ──────────────────────────────────────

export async function getManagedUserAction(
  id: string,
): Promise<
  { ok: true; user: ManagedUserRow } | { ok: false; error: string }
> {
  try {
    await requireCapability("user:list");
  } catch {
    return { ok: false, error: "Action non autorisée" };
  }
  const user = await getManagedUserById(id);
  if (!user) {
    return { ok: false, error: "Utilisateur introuvable" };
  }
  return { ok: true, user };
}

// ─── Capability check (for UI visibility) ────────────────────────────

/**
 * canManageUsers() — for the admin layout to decide whether to render the
 * "Utilisateurs" nav link. Returns true if the current principal has
 * user:list capability (SUPER_ADMIN or FANTOMAS).
 *
 * This is a UI-visibility hint only — Server Actions still enforce
 * capabilities independently. A user who hides the link via devtools and
 * navigates to /admin/utilisateurs directly will be denied by the page's
 * own requireCapability check (see page.tsx).
 */
export async function canManageUsersAction(): Promise<boolean> {
  try {
    const principal = await getPrincipal();
    if (!principal) return false;
    const { can } = await import("@/lib/server/auth/capabilities");
    return can(principal, "user:list");
  } catch {
    return false;
  }
}
