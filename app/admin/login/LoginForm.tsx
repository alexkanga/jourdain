"use client";

import { useTransition } from "react";
import { loginAction, type LoginActionResult } from "./actions";

/**
 * LoginForm — admin login form (Client Component).
 *
 * Wraps the loginAction Server Action via useTransition so we can display
 * inline error feedback for invalid credentials. Authentication itself is
 * permitted before session; this is a public form (no requireCapability).
 */

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<LoginActionResult["ok"] extends true ? never : string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await loginAction(fd);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            JOURDAIN EMPLOI — Administration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous pour gérer les offres.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
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
                autoComplete="username"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Fantomas"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {pending ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Pas d&apos;inscription publique. Comptes administratifs uniquement.
        </p>
      </div>
    </div>
  );
}

// Local useState import (kept at bottom to avoid top-of-file clutter)
import { useState } from "react";
