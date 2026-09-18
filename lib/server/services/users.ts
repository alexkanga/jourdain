import { db } from "@/db/index";
import { users, accounts, sessions } from "@/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { auth } from "@/lib/server/auth/auth";
import { hashPassword } from "better-auth/crypto";
import type { Principal } from "@/lib/server/auth/capabilities";

/**
 * User-management service — internal CRUD for managed admin users.
 *
 * Per user-management work package:
 *   - Only DB-backed ADMIN and SUPER_ADMIN users are "managed" by this module.
 *   - FANTOMAS is system-owned — never listed, never created, never updated,
 *     never deleted via this module.
 *   - Credential hashing uses Better Auth's `hashPassword` (the SAME scrypt
 *     implementation Better Auth uses internally). We import it from
 *     `better-auth/crypto` and apply it directly to the account row, because
 *     Better Auth's admin plugin endpoints (removeUser, setUserPassword,
 *     listUsers) require an HTTP session whose `role` is in `adminRoles` —
 *     and our users have `role="user"` (JOURDAIN's business authority is
 *     `principalType`, not Better Auth's `role`). Application-level
 *     authorization (can()/requireCapability() reading principalType) is
 *     the actual security authority for user:* capabilities.
 *   - New-user creation uses `auth.api.createUser` (server-side, no headers)
 *     which does NOT require a session — the admin plugin's createUser
 *     endpoint only checks `if (session)` and skips permission checks
 *     for server-side calls without headers/request.
 *
 * Lockout protections (enforced here at the service layer, defense-in-depth
 * behind the Server Action capability check):
 *   1. SELF_DELETE — caller cannot delete their own account.
 *   2. LAST_SUPER_ADMIN — never delete or demote the last remaining
 *      DB-backed SUPER_ADMIN. Fantomas does NOT count toward this minimum.
 *   3. FANTOMAS — never deletable/demotable via this module (filter excludes
 *      principalType=FANTOMAS from list, and delete/update reject FANTOMAS).
 *
 * Session invalidation on delete:
 *   - We delete the user row; the schema's `session.userId` FK has
 *     `onDelete: "cascade"`, so all the user's sessions are deleted with
 *     them. The next request with one of those (now-deleted) session
 *     tokens will fail `auth.api.getSession` → getPrincipal returns null
 *     → no more access. No separate session blacklist needed.
 */

export type ManagedUserRow = typeof users.$inferSelect;

export type UserServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── List ────────────────────────────────────────────────────────────

/**
 * List all DB-backed managed admin users — ADMIN and SUPER_ADMIN only.
 * FANTOMAS users are EXCLUDED from this list (system-owned, not managed).
 *
 * Sorted by createdAt ASC (oldest first — admin1 typically first).
 *
 * Direct DB query (Better Auth's listUsers admin endpoint requires a
 * session with role in adminRoles, which our users don't have).
 */
export async function listManagedUsers(): Promise<ManagedUserRow[]> {
  const rows = await db
    .select()
    .from(users)
    .where(ne(users.principalType, "FANTOMAS"))
    .orderBy(users.createdAt);
  return rows;
}

// ─── Count SUPER_ADMIN ───────────────────────────────────────────────

/**
 * Count the current number of DB-backed SUPER_ADMIN users.
 * Used by the LAST_SUPER_ADMIN lockout check.
 * Fantomas does NOT count (it's principalType=FANTOMAS, not SUPER_ADMIN).
 */
export async function countSuperAdmins(): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.principalType, "SUPER_ADMIN"));
  return rows.length;
}

// ─── Get by id ──────────────────────────────────────────────────────

/**
 * Get a single managed user by id. Returns null for FANTOMAS users
 * (they are not managed by this module) and for non-existent ids.
 */
export async function getManagedUserById(
  id: string,
): Promise<ManagedUserRow | null> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), ne(users.principalType, "FANTOMAS")))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Create ──────────────────────────────────────────────────────────

/**
 * Create a new managed admin user (ADMIN or SUPER_ADMIN).
 *
 * Uses Better Auth's admin plugin `auth.api.createUser` (server-side, no
 * headers — bypasses the plugin's own session check). Better Auth handles:
 *   - password hashing via scrypt (same `hashPassword` from
 *     `better-auth/crypto`)
 *   - email uniqueness check
 *   - username uniqueness (Username plugin, normalized to lowercase)
 *   - credential account row creation
 *
 * After creation, sets the principalType server-side (input: false — not
 * settable via createUser body). The role field is left at Better Auth's
 * default "user" — we don't use Better Auth's role for authorization.
 *
 * Rejects:
 *   - duplicate username (Better Auth Username plugin uniqueness constraint)
 *   - duplicate email (Better Auth uniqueness constraint)
 *   - any error from Better Auth (returned as a controlled error)
 */
export async function createManagedUser(input: {
  username: string;
  email: string;
  password: string;
  role: "ADMIN" | "SUPER_ADMIN";
}): Promise<UserServiceResult<{ id: string }>> {
  try {
    // Better Auth handles: password hashing (scrypt), email/username
    // uniqueness checks, account row creation. Username goes in `data`
    // (additional field via Username plugin). The Username plugin
    // normalizes to lowercase.
    await auth.api.createUser({
      body: {
        email: input.email,
        password: input.password,
        name: input.username,
        data: {
          username: input.username,
        },
      },
    });

    // Find the newly-created user by username (normalized to lowercase by
    // the Username plugin). Set principalType to the requested role.
    const normalizedUsername = input.username.toLowerCase();
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    if (!newUser) {
      // Better Auth reported success but the user isn't in our DB — should
      // not happen. Defensive: return an error.
      return {
        ok: false,
        error: "Erreur technique: utilisateur créé mais introuvable en base",
      };
    }

    await db
      .update(users)
      .set({ principalType: input.role })
      .where(eq(users.id, newUser.id));

    return { ok: true, data: { id: newUser.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Better Auth surfaces duplicate-key errors with specific messages and
    // error codes (in `e.body.code` for APIError instances). We match on
    // both the message text and the code to normalize to French user-facing
    // strings. Known codes observed in Better Auth 1.7.4:
    //   - USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL (duplicate email)
    //   - USERNAME_IS_ALREADY_TAKEN (duplicate username, via Username plugin)
    const code = (e as { body?: { code?: string } })?.body?.code ?? "";
    if (/email.*already.*exists|USER_ALREADY_EXISTS/i.test(msg) || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      return { ok: false, error: "Cet email est déjà utilisé" };
    }
    if (/username.*already.*exists|USERNAME_ALREADY_EXISTS|username.*already.*taken|USERNAME_IS_ALREADY_TAKEN/i.test(msg) || code === "USERNAME_IS_ALREADY_TAKEN") {
      return { ok: false, error: "Ce nom d'utilisateur est déjà utilisé" };
    }
    console.error("[users.createManagedUser] error:", msg, "code:", code);
    return { ok: false, error: "Erreur technique lors de la création" };
  }
}

// ─── Update ──────────────────────────────────────────────────────────

/**
 * Update an existing managed user's username, email, role, and optionally
 * password.
 *
 * - Username/email/role updates: direct DB update (Better Auth's additional
 *   fields are server-managed; username is normalized to lowercase by the
 *   Username plugin and has a unique constraint enforced by the DB).
 * - Password update (when non-empty): hash via Better Auth's `hashPassword`
 *   (the SAME scrypt implementation Better Auth uses internally) and
 *   update the account row's password field directly. We use direct DB
 *   access here because Better Auth's `setUserPassword` admin endpoint
 *   requires a session with role in adminRoles, which our users don't have.
 *   Using `hashPassword` directly produces a hash byte-identical to what
 *   `setUserPassword` would produce — the verification path on sign-in is
 *   unchanged.
 *
 * Lockout protections enforced:
 *   - LAST_SUPER_ADMIN: if the update would demote the only remaining
 *     DB-backed SUPER_ADMIN to ADMIN, reject.
 *   - FANTOMAS: getManagedUserById already excludes FANTOMAS — any
 *     attempt to update a FANTOMAS user returns "user not found" (no leak).
 *   - Self-demotion is allowed (you can demote yourself IF another
 *     SUPER_ADMIN exists) — only the LAST_SUPER_ADMIN rule prevents
 *     demoting the last one.
 *
 * The `caller` param is accepted for symmetry with deleteManagedUser
 * (which uses it for the SELF_DELETE check). Update does not currently
 * use the caller — self-demotion is allowed when another SUPER_ADMIN
 * exists. The param is retained for future extensibility (e.g., audit
 * log) and is intentionally marked unused.
 */
export async function updateManagedUser(
  input: {
    id: string;
    username: string;
    email: string;
    password?: string;
    role: "ADMIN" | "SUPER_ADMIN";
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _caller: Principal,
): Promise<UserServiceResult<{ id: string }>> {
  try {
    const existing = await getManagedUserById(input.id);
    if (!existing) {
      return { ok: false, error: "Utilisateur introuvable" };
    }

    // LAST_SUPER_ADMIN demotion lockout: if the user is currently a
    // SUPER_ADMIN and the new role is ADMIN, check that at least one OTHER
    // SUPER_ADMIN would remain after the demotion.
    if (existing.principalType === "SUPER_ADMIN" && input.role === "ADMIN") {
      const otherSuperAdmins = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.principalType, "SUPER_ADMIN"),
            ne(users.id, input.id),
          ),
        );
      if (otherSuperAdmins.length === 0) {
        return {
          ok: false,
          error:
            "Impossible de rétrograder le dernier super administrateur. Au moins un super administrateur doit rester.",
        };
      }
    }

    // Update username/email/role via direct DB write. Better Auth's
    // additional fields are managed by us server-side; the username field
    // has a unique constraint enforced by the DB.
    const normalizedUsername = input.username.toLowerCase();
    try {
      await db
        .update(users)
        .set({
          username: normalizedUsername,
          email: input.email.toLowerCase(),
          principalType: input.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/username.*unique|duplicate.*username|users_username_key/i.test(msg)) {
        return { ok: false, error: "Ce nom d'utilisateur est déjà utilisé" };
      }
      if (/email.*unique|duplicate.*email|users_email_key/i.test(msg)) {
        return { ok: false, error: "Cet email est déjà utilisé" };
      }
      throw e;
    }

    // Optional password reset. Hash via Better Auth's hashPassword (scrypt)
    // and update the account row directly. Same hash Better Auth uses on
    // sign-in verification.
    if (input.password && input.password.length > 0) {
      const hashed = await hashPassword(input.password);
      await db
        .update(accounts)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(accounts.userId, input.id));
    }

    return { ok: true, data: { id: input.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[users.updateManagedUser] error:", msg);
    return { ok: false, error: "Erreur technique lors de la modification" };
  }
}

// ─── Delete ──────────────────────────────────────────────────────────

/**
 * Delete a managed user.
 *
 * Deletes the user row directly via Drizzle. The schema's `session.userId`
 * and `account.userId` FKs have `onDelete: "cascade"` — Postgres automatically
 * deletes all the user's sessions and credential accounts when the user row
 * is deleted. The next request with one of those (now-deleted) session
 * tokens will fail `auth.api.getSession` → getPrincipal returns null → no
 * more access. No separate session blacklist needed.
 *
 * Lockout protections enforced:
 *   - SELF_DELETE: caller cannot delete their own account.
 *   - LAST_SUPER_ADMIN: if the user is the last DB-backed SUPER_ADMIN,
 *     reject.
 *   - FANTOMAS: getManagedUserById already excludes FANTOMAS — any attempt
 *     to delete a FANTOMAS user returns "user not found" (no leak).
 *
 * We use direct DB deletion instead of `auth.api.removeUser` because the
 * admin plugin's removeUser endpoint requires a session with role in
 * adminRoles, which our users don't have. The cascade behavior is identical
 * — both paths delete user + sessions + accounts.
 */
export async function deleteManagedUser(
  id: string,
  caller: Principal,
): Promise<UserServiceResult<{ id: string }>> {
  try {
    // SELF_DELETE: caller cannot delete their own account.
    if (caller.id === id) {
      return {
        ok: false,
        error: "Vous ne pouvez pas supprimer votre propre compte",
      };
    }

    const existing = await getManagedUserById(id);
    if (!existing) {
      return { ok: false, error: "Utilisateur introuvable" };
    }

    // LAST_SUPER_ADMIN: if the user is currently a SUPER_ADMIN, check that
    // at least one OTHER SUPER_ADMIN would remain after the deletion.
    if (existing.principalType === "SUPER_ADMIN") {
      const otherSuperAdmins = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.principalType, "SUPER_ADMIN"),
            ne(users.id, id),
          ),
        );
      if (otherSuperAdmins.length === 0) {
        return {
          ok: false,
          error:
            "Impossible de supprimer le dernier super administrateur. Au moins un super administrateur doit rester.",
        };
      }
    }

    // Defensive: explicitly delete sessions first (the FK cascade should
    // handle it, but explicit deletion avoids any race where a session
    // could be read between user deletion and the cascade firing).
    // Then delete the user. Both wrapped implicitly by the cascade, but
    // we do it explicitly for clarity + defense-in-depth.
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(accounts).where(eq(accounts.userId, id));
    await db.delete(users).where(eq(users.id, id));

    return { ok: true, data: { id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[users.deleteManagedUser] error:", msg);
    return { ok: false, error: "Erreur technique lors de la suppression" };
  }
}
