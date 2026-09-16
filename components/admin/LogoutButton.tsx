"use client";

import { useTransition } from "react";

/**
 * LogoutButton — admin logout. Client component that uses the Better Auth
 * client-side signOut method to properly clear the session cookie in the
 * browser. After sign-out, navigates to /admin/login.
 *
 * Per WP-003: the client-side API calls the Better Auth HTTP endpoint
 * (/api/auth/sign-out) which properly sets the Set-Cookie header to
 * clear the session cookie (Max-Age=0). The server-side auth.api.signOut
 * would delete the DB record but might not clear the browser cookie
 * in a Server Action context.
 */

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  async function handleLogout() {
    try {
      // Use client-side Better Auth signOut — this calls the HTTP endpoint
      // which properly clears the session cookie via Set-Cookie header.
      await import("@/lib/auth-client").then(({ authClient }) =>
        authClient.signOut(),
      );
    } catch {
      // Even if signOut fails, navigate to login
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
