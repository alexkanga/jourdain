import { z } from "zod";

/**
 * Zod validation schemas for the user-management module.
 *
 * Per user-management work package:
 *   - Only ADMIN and SUPER_ADMIN are assignable roles from the UI.
 *   - FANTOMAS is NEVER accepted as a form input — it's a system-owned
 *     principal type created only by the bootstrap.
 *   - Username normalization is delegated to Better Auth's Username plugin
 *     (lowercase) at creation time; we still validate the input shape here.
 *
 * The schemas are used at the Server Action layer as the authoritative
 * input validator (UI hiding is UX only).
 */

// Allowed assignable roles from the UI. NEVER include "FANTOMAS" here —
// Fantomas is system-owned and cannot be created or assigned via the
// user-management module.
export const ASSIGNABLE_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

// Username: required, non-empty. Better Auth's Username plugin normalizes to
// lowercase; we just check it's a non-empty string. Length bounds match the
// Better Auth username plugin defaults (1–32 chars is the typical convention).
export const usernameField = z
  .string()
  .min(1, "Le nom d'utilisateur est requis")
  .max(32, "Le nom d'utilisateur ne peut pas dépasser 32 caractères")
  .trim();

// Email: required, valid email format.
export const emailField = z
  .string()
  .min(1, "L'email est requis")
  .email("L'email doit être valide")
  .trim()
  .toLowerCase();

// Password (create): required, minimum length 8 (Better Auth default).
// No complexity rules — the user-management work package did not specify any.
// The Bootstrap admin1/Fantomas passwords are governed by their own env vars.
export const passwordCreateField = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères");

// Password (edit): optional. When blank, password is unchanged. When
// non-blank, must meet the create-password minimum length.
export const passwordEditField = z
  .string()
  .refine(
    (v) => v === "" || v.length >= 8,
    "Le mot de passe doit contenir au moins 8 caractères (ou rester vide pour ne pas modifier)",
  );

// Role: must be one of ASSIGNABLE_ROLES. Zod enum rejects "FANTOMAS" and any
// other arbitrary value.
export const roleField = z.enum(ASSIGNABLE_ROLES, {
  message: "Le rôle doit être ADMIN ou SUPER_ADMIN",
});

// Create user schema.
export const createUserSchema = z.object({
  username: usernameField,
  email: emailField,
  password: passwordCreateField,
  role: roleField,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Update user schema. Password is optional (blank = unchanged).
export const updateUserSchema = z.object({
  id: z.string().min(1, "L'identifiant est requis"),
  username: usernameField,
  email: emailField,
  password: passwordEditField.optional().or(z.literal("")),
  role: roleField,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Delete user schema. Only the id is needed; the Server Action loads the
// current principal to enforce the self-delete and last-SUPER_ADMIN lockouts.
export const deleteUserSchema = z.object({
  id: z.string().min(1, "L'identifiant est requis"),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
