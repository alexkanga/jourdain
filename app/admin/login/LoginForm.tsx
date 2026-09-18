"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { FANTOMAS_USERNAME } from "@/lib/server/auth/fantomas-auth";

/**
 * LoginForm — admin login form (Client Component).
 *
 * Two server-side auth paths (per Fantomas mini-design, OWNER-authorized):
 *   - username === "fantomas" → POST /api/fantomas/login (break-glass,
 *     DB-free, Web Crypto HMAC session cookie `jourdain_fantomas_session`).
 *   - any other username → Better Auth path via authClient.signIn.username
 *     (calls /api/auth/sign-in/username, sets `better-auth.session_token`).
 *
 * The username routing decision is client-side. The credential check is
 * server-side ONLY — no credential comparison happens in client JS. The
 * "fantomas" username is a public break-glass identity (already shown as
 * the placeholder in the form); routing on it does not leak secret info.
 *
 * On invalid credentials: displays "Identifiants invalides" — no
 * information leak about which field was wrong (per FR-001 acceptance).
 *
 * Only AFTER successful authentication may an authorized JOURDAIN
 * administrative principal (ADMIN or FANTOMAS) enter the protected admin
 * area. The admin layout guard (getPrincipal) enforces this server-side.
 */

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      // ── Route by username ──────────────────────────────────────────
      // Fantomas break-glass path: POST to /api/fantomas/login directly.
      // No credential check client-side — server returns 401 on mismatch.
      // Use fetch (not authClient) because this is NOT a Better Auth call.
      if (username === FANTOMAS_USERNAME) {
        const res = await fetch("/api/fantomas/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          setError("Identifiants invalides");
          setPending(false);
          return;
        }
        // Login succeeded — Fantomas cookie is set via Set-Cookie header.
        // Full page navigation so the server reads the new cookie.
        window.location.href = "/admin/offres";
        return;
      }

      // ── Existing Better Auth path ──────────────────────────────────
      const result = await authClient.signIn.username({
        username,
        password,
      });

      if (result.error) {
        setError("Identifiants invalides");
        setPending(false);
        return;
      }

      // Login succeeded — Better Auth has set the session cookie via
      // Set-Cookie header. Navigate to the protected admin area.
      // Use full page navigation to ensure the server reads the new cookie.
      window.location.href = "/admin/offres";
    } catch {
      setError("Identifiants invalides");
      setPending(false);
    }
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
