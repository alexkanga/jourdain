"use client";

import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

/**
 * Minimal Better Auth browser client for WP-003 admin UI.
 *
 * Purpose: login (username + password), logout, session-aware UX.
 *
 * SECURITY INVARIANT:
 * - This client is UX only. It does NOT perform authorization decisions.
 * - All authorization is server-side (admin layout guard via getPrincipal +
 *   every Server Action via requireCapability + can() reading principalType).
 * - Client-side session awareness is for UI only (e.g., showing/hiding
 *   admin controls based on session presence — never as a security gate).
 *
 * Per WP-003 contract:
 * - NOT a replacement of Better Auth (uses Better Auth's installed client API).
 * - NOT a new authentication system.
 * - NOT public signup, NOT user-management, NOT candidate/recruiter auth.
 * - MUST NOT be used as a security authority.
 *
 * The usernameClient plugin matches the server-side username() plugin
 * configuration (from WP-002). It provides the client-side signIn.username()
 * method that calls the Better Auth /api/auth/sign-in/username HTTP endpoint,
 * which properly sets the Set-Cookie header in the browser response.
 */

export const authClient = createAuthClient({
  plugins: [usernameClient()],
  // baseURL defaults to the current origin in the browser; Better Auth
  // resolves /api/auth/* routes against the same origin.
});

// Convenience re-exports for admin UI components
export const { signIn, signOut, useSession } = authClient;
