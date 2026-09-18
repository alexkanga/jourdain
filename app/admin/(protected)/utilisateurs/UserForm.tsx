"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, updateUserAction } from "./actions";
import type { ManagedUserRow } from "@/lib/server/services/users";

/**
 * UserForm — create or edit a managed admin user.
 *
 * Per user-management work package + final correction #2:
 *   - Role options are ADMIN and SUPER_ADMIN ONLY. FANTOMAS is never
 *     accepted as form input (the server-side Zod schema enforces this —
 *     the client dropdown is just UX, not security).
 *   - Password field:
 *       - Create mode: required (min 8 chars) — initial credential.
 *       - Edit mode: NO password field. Password reset is REMOVED from V1
 *         (Better Auth setUserPassword requires admin-session semantics
 *         that don't map cleanly to our independent principal model;
 *         direct hashPassword + account.password update was rejected as
 *         inventing credential-hash manipulation). Edit-user updates
 *         username, email, and role only.
 *   - On success, navigate to /admin/utilisateurs (list).
 *   - On error, display the controlled error message above the form.
 *
 * The form uses FormData + Server Actions — no client-side credential
 * processing. The initial password (create) is hashed server-side by
 * Better Auth's auth.api.createUser (which uses hashPassword internally).
 */

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "SUPER_ADMIN", label: "Super administrateur" },
] as const;

export function UserForm({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: ManagedUserRow;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreate = mode === "create";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = isCreate
        ? await createUserAction(formData)
        : await updateUserAction(formData);
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      // Success — navigate to the users list. Full page navigation so the
      // server re-reads the principal + revalidates the list.
      router.push("/admin/utilisateurs");
      router.refresh();
    } catch {
      setError("Erreur technique");
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          {isCreate ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
        </h1>
      </div>

      <div className="max-w-2xl rounded-md border border-gray-200 bg-white p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          {isCreate ? null : (
            <input type="hidden" name="id" value={user?.id ?? ""} />
          )}

          {/* Nom d'utilisateur */}
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nom d&apos;utilisateur
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              defaultValue={user?.username ?? ""}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={user?.email ?? ""}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Mot de passe — CREATE MODE ONLY.
              Per user-management final correction #2: password reset is
              REMOVED from V1. The edit-user flow does NOT include a password
              field. The create flow requires the initial credential, which
              is hashed server-side by Better Auth's auth.api.createUser. */}
          {isCreate && (
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Mot de passe initial
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Au moins 8 caractères
              </p>
            </div>
          )}

          {/* Rôle */}
          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Rôle
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue={user?.principalType ?? "ADMIN"}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              FANTOMAS n&apos;est pas assignable depuis l&apos;interface.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {pending
                ? "Enregistrement…"
                : isCreate
                  ? "Créer l'utilisateur"
                  : "Enregistrer les modifications"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/utilisateurs")}
              disabled={pending}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
