"use client";

import { useTransition } from "react";

/**
 * LogoutButton — unified admin logout.
 *
 * Detects the active session type from the server-rendered `logoutMode`
 * prop (passed down from app/admin/(protected)/layout.tsx based on
 * principal.principalType) and routes to the correct logout endpoint:
 *
 *   - Fantomas session (principalType === "FANTOMAS") →
 *     POST /api/fantomas/logout ONLY (clears the Fantomas cookie).
 *     Per OWNER revision: does NOT call Better Auth on the Fantomas path.
 *
 *   - DB-backed admin session (principalType === "ADMIN" or "SUPER_ADMIN")
 *     → existing Better Auth signOut via authClient.signOut()
 *     (calls /api/auth/sign-out).
 *
 * If logoutMode is undefined (legacy callers), falls back to Better Auth
 * signOut for backward compatibility.
 */

export function LogoutButton({
  logoutMode,
}: {
  /**
   * Server-rendered hint about which logout path to take.
   * Passed from app/admin/(protected)/layout.tsx based on principal.principalType.
   * - "FANTOMAS" → POST /api/fantomas/logout
   * - "ADMIN" | "SUPER_ADMIN" → authClient.signOut()
   * If undefined, falls back to Better Auth signOut (legacy behavior).
   */
  logoutMode?: "FANTOMAS" | "ADMIN" | "SUPER_ADMIN";
}) {
  const [pending, startTransition] = useTransition();

  async function handleLogout() {
    try {
      if (logoutMode === "FANTOMAS") {
        // Fantomas logout: POST /api/fantomas/logout — clears the Fantomas
        // cookie. Does NOT call Better Auth (OWNER revision). Idempotent.
        await fetch("/api/fantomas/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // ADMIN logout: existing Better Auth signOut — calls /api/auth/sign-out
        // which properly clears the Better Auth session cookie via Set-Cookie.
        const { authClient } = await import("@/lib/auth-client");
        await authClient.signOut();
      }
    } catch {
      // Even if the logout call fails, navigate to login.
    }
    // Full page navigation to ensure cookie state is clean
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={() => startTransition(handleLogout)}
      disabled={pending}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {pending ? "Déconnexion…" : "Déconnexion"}
    </button>
  );
}
