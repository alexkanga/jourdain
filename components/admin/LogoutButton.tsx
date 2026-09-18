"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

/**
 * LogoutButton — unified admin logout.
 *
 * Detects the active session type from the server-rendered `logoutMode`
 * prop (passed down from the admin layout based on principal.principalType)
 * and routes to the correct logout endpoint:
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
 *
 * UI-01 (Methodist Design System):
 *   - Uses the btn-ghost variant (clear but not visually dominant —
 *     per UI-01 spec: "logout clear but not visually dominant").
 *   - Includes a LogOut icon for visual clarity.
 *   - Accessible: aria-label, focus ring, disabled state.
 */

export function LogoutButton({
  logoutMode,
  className,
}: {
  /**
   * Server-rendered hint about which logout path to take.
   * Passed from the admin layout based on principal.principalType.
   * - "FANTOMAS" → POST /api/fantomas/logout
   * - "ADMIN" | "SUPER_ADMIN" → authClient.signOut()
   * If undefined, falls back to Better Auth signOut (legacy behavior).
   */
  logoutMode?: "FANTOMAS" | "ADMIN" | "SUPER_ADMIN";
  className?: string;
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
        // ADMIN/SUPER_ADMIN logout: existing Better Auth signOut — calls
        // /api/auth/sign-out which properly clears the Better Auth session
        // cookie via Set-Cookie.
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
      className={`btn-ghost w-full justify-start gap-2 ${className ?? ""}`}
      aria-label="Déconnexion"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      {pending ? "Déconnexion…" : "Déconnexion"}
    </button>
  );
}
