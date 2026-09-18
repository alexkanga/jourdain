import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { FANTOMAS_COOKIE_NAME } from "@/lib/server/auth/fantomas-auth";

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
 *   authenticated session via getPrincipal() (Fantomas-first then Better
 *   Auth getSession);
 * - every privileged Server Action calls requireCapability() first;
 * - all mutations validate input (Zod) and lifecycle state server-side.
 *
 * Two independent session cookies are recognized (presence check only —
 * signature verification stays server-side in getPrincipal for security):
 *   - Better Auth: `better-auth.session_token` (HTTP) /
 *     `__Secure-better-auth.session_token` (HTTPS) — via getSessionCookie().
 *   - Fantomas: `jourdain_fantomas_session` — read from req.cookies.
 *
 * If either cookie is present, the request proceeds to the admin area.
 * The admin layout guard + Server Actions still validate the session
 * server-side (Fantomas HMAC verification or Better Auth getSession).
 *
 * getSessionCookie() handles both Better Auth cookie name variants
 * automatically, handling HTTP (local dev/E2E) and HTTPS (Vercel
 * Preview/Production). No manual cookie-name detection needed for Better
 * Auth. The Fantomas cookie has a single name regardless of environment
 * (Secure attribute is dynamic — but the name itself is constant).
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
  // Edge-safe: both checks are pure cookie existence (no signature
  // verification — that stays server-side in getPrincipal for security).
  const betterAuthCookie = getSessionCookie(request);
  const fantomasCookie = request.cookies.get(FANTOMAS_COOKIE_NAME)?.value;

  if (!betterAuthCookie && !fantomasCookie) {
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
