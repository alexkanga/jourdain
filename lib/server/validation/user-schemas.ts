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
 * ─── PASSWORD RESET REMOVED FROM V1 ─────────────────────────────────
 * Per user-management final correction #2: the edit-user flow does NOT
 * include a password field. Better Auth's setUserPassword admin endpoint
 * requires an admin session with role in adminRoles — our users have
 * role='user' (our authority is principalType, not Better Auth role), so
 * we cannot use that endpoint cleanly. Direct hashPassword + account.password
 * update was rejected as inventing credential-hash manipulation.
 *
 * The CREATE flow still requires a password (initial credential) — this is
 * handled by Better Auth's auth.api.createUser (server-side, no session
 * required) which uses Better Auth's own hashPassword internally.
 *
 * A future password-reset mechanism may be designed separately if needed.
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

// Password (create only): required, minimum length 8 (Better Auth default).
// No complexity rules — the user-management work package did not specify any.
// The Bootstrap admin1/Fantomas passwords are governed by their own env vars.
// NOTE: There is NO password-edit field — password reset is removed from V1
// (per user-management final correction #2). The create flow sets the initial
// credential; the edit flow does NOT touch the password.
export const passwordCreateField = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères");

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

// Update user schema. Per user-management final correction #2: NO password
// field. Edit-user updates username, email, and role (ADMIN ↔ SUPER_ADMIN)
// only. Password reset is removed from V1.
export const updateUserSchema = z.object({
  id: z.string().min(1, "L'identifiant est requis"),
  username: usernameField,
  email: emailField,
  role: roleField,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Delete user schema. Only the id is needed; the Server Action loads the
// current principal to enforce the self-delete and last-SUPER_ADMIN lockouts.
export const deleteUserSchema = z.object({
  id: z.string().min(1, "L'identifiant est requis"),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
