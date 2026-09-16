import { LoginForm } from "./LoginForm";

/**
 * Admin login page — public (no auth required).
 *
 * Authentication itself is permitted before the user has an authenticated
 * session. No circular rule requiring authenticated capability before
 * sign-in.
 *
 * After successful authentication, only authorized administrative principals
 * (ADMIN or FANTOMAS) may enter /admin/offres. The admin layout guard
 * (getPrincipal) enforces this server-side.
 */

export default function AdminLoginPage() {
  return <LoginForm />;
}

