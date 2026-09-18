"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { FANTOMAS_USERNAME } from "@/lib/server/auth/fantomas-auth";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
 * UI-01 (Methodist Design System):
 *   - Brand logo + JOURDAIN EMPLOI heading + institutional subtitle.
 *   - Methodist green primary button.
 *   - Accessible focus ring.
 *   - Responsive center layout.
 *
 * Only AFTER successful authentication may an authorized JOURDAIN
 * administrative principal (ADMIN, SUPER_ADMIN, or FANTOMAS) enter the
 * protected admin area. The admin layout guard (getPrincipal) enforces
 * this server-side.
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
    <div className="flex min-h-screen items-center justify-center bg-surface-warm px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand block */}
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo size="lg" className="mb-3" />
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            JOURDAIN EMPLOI
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Église Méthodiste de Côte d&apos;Ivoire
          </p>
          <p className="mt-4 text-sm text-text-secondary">
            Connectez-vous pour gérer les offres.
          </p>
        </div>

        {/* Login card */}
        <div className="card-surface p-6">
          {error && (
            <div
              className="mb-4 rounded-sm border border-danger bg-danger-surface p-3 text-sm text-danger"
              role="alert"
            >
              {error}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
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
                autoComplete="username"
                className="block w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                placeholder="Fantomas"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-text-primary"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-text-primary placeholder:text-text-secondary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full"
            >
              {pending ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-text-secondary">
          Pas d&apos;inscription publique. Comptes administratifs uniquement.
        </p>
      </div>
    </div>
  );
}
