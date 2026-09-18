import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Root-level middleware — UX/redirect ONLY.
 *
 * Per WP-003 contract: middleware is NOT the security authority for /admin.
 * Its sole purpose is to provide an early redirect of unauthenticated
 * /admin/* requests to /admin/login (saves a full page render for
 * unauthenticated visitors; UX optimization).
 *
 * INVARIANT: Bypassing middleware MUST NOT grant access to protected data
 * or mutations. The real security authority is server-side:
 * - admin layout guard (app/admin/(protected)/layout.tsx) validates
 *   authenticated session via getPrincipal() (calls Better Auth getSession);
 * - every privileged Server Action calls requireCapability() first;
 * - all mutations validate input (Zod) and lifecycle state server-side.
 *
 * This middleware uses Better Auth's official getSessionCookie() helper
 * to check whether a session cookie exists. If absent, redirect to
 * /admin/login. If present, the request proceeds — but the admin layout
 * guard and Server Actions still validate the session server-side.
 *
 * getSessionCookie() handles both cookie name variants:
 *   - "better-auth.session_token"          (HTTP, local dev/E2E)
 *   - "__Secure-better-auth.session_token"  (HTTPS, Vercel Preview/Production)
 * No manual cookie-name detection or prefix logic is needed.
 *
 * Client-side hiding or disabled buttons are UX only and do NOT authorize.
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only /admin/* routes (but NOT /admin/login itself — that's public)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // UX/redirect only: if no session cookie present, early-redirect to login.
  // This is a UX optimization, NOT the security authority. Server-side layout
  // guard + Server Actions remain the real authority even if this check is
  // bypassed.
  //
  // getSessionCookie() is Better Auth's official cookie helper. It checks
  // both "better-auth.session_token" and "__Secure-better-auth.session_token"
  // automatically, handling HTTP (local) and HTTPS (Vercel) environments.
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all /admin/* routes; the function above filters to /admin and
  // short-circuits /admin/login.
  matcher: ["/admin/:path*"],
};
