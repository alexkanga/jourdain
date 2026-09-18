"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, updateUserAction } from "./actions";
import type { ManagedUserRow } from "@/lib/server/services/users";

/**
 * UserForm — create or edit a managed admin user.
 *
 * UI-03: migrated to Methodist design tokens. Visual hierarchy improved
 * with .form-section and .form-input classes. Behavior unchanged.
 *
 * Per user-management final correction #2:
 *   - Create mode: password field (initial credential, required).
 *   - Edit mode: NO password field (password reset removed from V1).
 *   - Role options: ADMIN, SUPER_ADMIN ONLY. FANTOMAS never accepted.
 *
 * E2e selectors preserved:
 *   - getByLabel(/nom d'utilisateur/i) → htmlFor="username"
 *   - getByLabel(/^email$/i) → htmlFor="email"
 *   - getByLabel(/mot de passe/i) → htmlFor="password" (create only)
 *   - getByLabel(/^rôle$/i) → htmlFor="role" (native <select>)
 *   - getByRole("button", { name: /créer l'utilisateur/i })
 *   - getByRole("button", { name: /enregistrer les modifications/i })
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
        <h1 className="font-heading text-xl font-bold text-text-primary sm:text-2xl">
          {isCreate ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
        </h1>
      </div>

      <div className="max-w-2xl card-surface p-6">
        {error && (
          <div className="mb-4 rounded-sm border border-danger bg-danger-surface p-3 text-sm text-danger" role="alert">
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
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              Nom d&apos;utilisateur
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              defaultValue={user?.username ?? ""}
              className="form-input"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={user?.email ?? ""}
              className="form-input"
            />
          </div>

          {/* Mot de passe — CREATE MODE ONLY */}
          {isCreate && (
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-text-primary"
              >
                Mot de passe initial
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="form-input"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Au moins 8 caractères
              </p>
            </div>
          )}

          {/* Rôle */}
          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              Rôle
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue={user?.principalType ?? "ADMIN"}
              className="form-input"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-secondary">
              FANTOMAS n&apos;est pas assignable depuis l&apos;interface.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary"
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
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
