import { NextResponse } from "next/server";
import {
  isFantomasCredential,
  signFantomasSessionCookie,
  buildFantomasSetCookie,
} from "@/lib/server/auth/fantomas-auth";

/**
 * POST /api/fantomas/login — Fantomas break-glass login.
 *
 * Independent of Better Auth, Neon, PostgreSQL. Server-side credential
 * check (exact equality — OWNER-confirmed credentials fantomas/fantomas,
 * NOT a hand-rolled "constant-time" comparison). On success, sets the
 * self-verifying HMAC-signed `jourdain_fantomas_session` cookie.
 *
 * Returns 200 on success, 401 on invalid credentials, 500 on missing
 * FANTOMAS_SESSION_SECRET (server misconfiguration).
 *
 * Body: { "username": string, "password": string }
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 },
    );
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  // Server-side credential check — exact equality (OWNER-confirmed).
  if (!isFantomasCredential(username, password)) {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 },
    );
  }

  // Mint the signed Fantomas session cookie (Web Crypto HMAC-SHA256).
  const value = await signFantomasSessionCookie();
  if (!value) {
    // FANTOMAS_SESSION_SECRET missing or invalid → server misconfiguration.
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 },
    );
  }

  // Detect HTTPS from the request URL — set Secure on Vercel (HTTPS),
  // omit on localhost HTTP (browser refuses to store Secure cookies on HTTP).
  const secure = req.url.startsWith("https://");
  const setCookie = buildFantomasSetCookie(value, { secure });

  const res = NextResponse.json({ ok: true });
  res.headers.set("set-cookie", setCookie);
  return res;
}
