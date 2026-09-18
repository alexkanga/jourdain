import { NextResponse } from "next/server";
import { buildFantomasClearCookie } from "@/lib/server/auth/fantomas-auth";

/**
 * POST /api/fantomas/logout — Fantomas break-glass logout.
 *
 * Clears the `jourdain_fantomas_session` cookie (Max-Age=0, empty value).
 * Does NOT call Better Auth, does NOT touch the DB. Idempotent — calling
 * with no Fantomas cookie present is a safe no-op.
 *
 * Per OWNER revision: Fantomas logout calls ONLY this endpoint. ADMIN
 * logout uses the existing Better Auth signOut path. LogoutButton detects
 * the active session type and routes to the correct endpoint.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secure = req.url.startsWith("https://");
  const setCookie = buildFantomasClearCookie({ secure });
  const res = NextResponse.json({ ok: true });
  res.headers.set("set-cookie", setCookie);
  return res;
}
