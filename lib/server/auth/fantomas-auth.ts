import type { Principal } from "./capabilities";

/**
 * Fantomas break-glass authentication (OPTION A — dedicated session secret).
 *
 * Design (per Fantomas mini-design, OWNER-authorized):
 *   - Independent of Better Auth, Neon, PostgreSQL.
 *   - Self-verifying HMAC-SHA256 session cookie (`jourdain_fantomas_session`).
 *   - Web Crypto API ONLY (globalThis.crypto.subtle) — Edge-compatible.
 *   - NO `node:crypto` import, NO `Buffer` usage (works in Edge Runtime).
 *   - Credentials `fantomas / fantomas` are OWNER-accepted public break-glass
 *     credentials — compared server-side with exact equality. No
 *     hand-written "constant-time" comparison (OWNER revision: use exact
 *     server-side credential comparison).
 *   - principalType "FANTOMAS" — inherits all ADMIN capabilities + the
 *     Fantomas-only capabilities (system:bootstrap, system:recovery).
 *
 * Identity resolution order (in lib/server/auth/authorization.ts getPrincipal):
 *   1. valid Fantomas session cookie (HMAC verified here, no DB) → return FANTOMAS Principal
 *   2. valid Better Auth session (DB-backed) — fall through
 *   3. unauthenticated — null
 * Fantomas has priority. Better Auth is NOT called first.
 */

// ─── Public constants ──────────────────────────────────────────────
export const FANTOMAS_COOKIE_NAME = "jourdain_fantomas_session";
export const FANTOMAS_USERNAME = "fantomas";
export const FANTOMAS_PASSWORD = "fantomas";
export const FANTOMAS_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours (OWNER-confirmed)

/**
 * The Fantomas break-glass identity is a SINGLE constant Principal.
 * There is no per-user DB record and no per-user id — Fantomas is a
 * deterministic break-glass identity, not a stored user.
 */
export const FANTOMAS_PRINCIPAL: Principal = {
  id: "fantomas", // constant — used by Server Actions as the actor id
  username: "fantomas",
  principalType: "FANTOMAS",
};

// ─── Helpers (Edge-compatible: no node:crypto, no Buffer) ───────────

/**
 * Base64url-encode a Uint8Array (no padding). Edge + Node compatible.
 */
function base64url(bytes: Uint8Array): string {
  // Build standard base64 via_chunks to avoid Buffer (Edge-safe).
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Base64url-decode a string to a fresh Uint8Array backed by a real ArrayBuffer
 * (not SharedArrayBuffer — required by Web Crypto `BufferSource` typing in
 * TypeScript 5.7+ lib). Edge + Node compatible.
 */
function base64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4;
  const padded = pad === 0 ? s : s + "=".repeat(4 - pad);
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  // `new Uint8Array(length)` always allocates a real ArrayBuffer (not
  // SharedArrayBuffer), which is what Web Crypto BufferSource expects.
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out as Uint8Array<ArrayBuffer>;
}

/**
 * Encode a UTF-8 string to a fresh Uint8Array backed by a real ArrayBuffer.
 * Edge + Node compatible. The TextEncoder produces a Uint8Array<ArrayBuffer>
 * by default in modern TS lib — but we cast explicitly to satisfy the
 * BufferSource typing used by Web Crypto.
 */
function utf8(s: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;
}

/**
 * Decode a UTF-8 Uint8Array to string via TextDecoder (Edge + Node).
 */
function utf8str(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// ─── Credential check ───────────────────────────────────────────────

/**
 * Server-side Fantomas credential check.
 *
 * OWNER-confirmed credentials: `fantomas / fantomas` — these are PUBLIC
 * break-glass credentials, not secret material. OWNER explicitly rejected
 * hand-written "constant-time" comparison — use exact equality.
 *
 * The credential check is server-side ONLY; the client only decides which
 * endpoint to POST to based on the username — it never sees the password
 * comparison logic.
 */
export function isFantomasCredential(
  username: string,
  password: string,
): boolean {
  return username === FANTOMAS_USERNAME && password === FANTOMAS_PASSWORD;
}

// ─── Session sign / verify (Web Crypto HMAC-SHA256) ─────────────────

interface FantomasSessionPayload {
  /** subject — constant "fantomas" (single break-glass identity) */
  sub: string;
  /** issued-at — epoch seconds */
  iat: number;
  /** expiration — epoch seconds */
  exp: number;
}

/**
 * Resolve the Fantomas HMAC key as a Web Crypto CryptoKey.
 *
 * Reads FANTOMAS_SESSION_SECRET from env (OPTION A — dedicated secret,
 * independent of BETTER_AUTH_SECRET). Decoded from base64 to raw 32 bytes.
 * If the env var is missing or invalid, returns null — the caller treats
 * this as "no Fantomas auth possible" (does not throw, does not crash
 * admin pages without the secret configured).
 *
 * The CryptoKey is cached on first successful import to avoid re-importing
 * on every request. Cache is per-module (per-Edge-instance) — acceptable
 * for a single high-entropy key that never changes during a deploy.
 */
let cachedKey: CryptoKey | null = null;
let cachedKeySecret: string | null = null;

async function getFantomasHmacKey(): Promise<CryptoKey | null> {
  const secret = process.env.FANTOMAS_SESSION_SECRET;
  if (!secret || secret.trim() === "") return null;
  if (cachedKey && cachedKeySecret === secret) return cachedKey;

  try {
    // Decode base64 secret → raw key bytes. Tolerate both padded and
    // unpadded base64 (developers may paste either form).
    const raw = base64urlDecode(secret.trim().replace(/=+$/, ""));
    // Web Crypto requires HMAC keys to be at least the digest size for the
    // hash (SHA-256 = 32 bytes). If the supplied secret is shorter, hash it
    // to derive a 32-byte key — single SHA-256 is sufficient because the
    // input is already high-entropy (it's a server secret, not a password).
    let keyBytes: Uint8Array<ArrayBuffer> = raw;
    if (raw.length < 32) {
      const digest = await crypto.subtle.digest("SHA-256", raw);
      keyBytes = new Uint8Array(digest) as Uint8Array<ArrayBuffer>;
    }
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    cachedKey = key;
    cachedKeySecret = secret;
    return key;
  } catch {
    cachedKey = null;
    cachedKeySecret = null;
    return null;
  }
}

/**
 * Mint a signed Fantomas session cookie value.
 *
 * Format: `base64url(payload).base64url(hmac)`
 * where payload = JSON { sub, iat, exp } and hmac = HMAC-SHA256(payloadBytes, key).
 *
 * Returns null if FANTOMAS_SESSION_SECRET is missing/invalid (caller
 * should treat as server misconfiguration → login fails with 500).
 */
export async function signFantomasSessionCookie(
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string | null> {
  const key = await getFantomasHmacKey();
  if (!key) return null;

  const payload: FantomasSessionPayload = {
    sub: FANTOMAS_USERNAME,
    iat: nowSeconds,
    exp: nowSeconds + FANTOMAS_SESSION_MAX_AGE_SECONDS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadBytes = utf8(payloadJson);
  const sigBuf = await crypto.subtle.sign("HMAC", key, payloadBytes);
  const sig = new Uint8Array(sigBuf);
  return `${base64url(payloadBytes)}.${base64url(sig)}`;
}

/**
 * Verify a signed Fantomas session cookie value.
 *
 * Returns the Fantomas Principal if:
 *   - the cookie format is valid (`payload.sig`)
 *   - the HMAC verifies (Web Crypto subtle.verify — constant-time inside
 *     Web Crypto, NOT hand-rolled)
 *   - the payload.sub === "fantomas"
 *   - the payload.exp > nowSeconds
 *
 * Returns null otherwise (including missing/invalid FANTOMAS_SESSION_SECRET,
 * malformed cookie, tampered payload, expired session). No DB lookup,
 * no Better Auth call — pure CPU operation.
 */
export async function verifyFantomasSessionCookie(
  cookieValue: string | undefined | null,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<Principal | null> {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0 || dot === cookieValue.length - 1) return null;
  const payloadB64 = cookieValue.slice(0, dot);
  const sigB64 = cookieValue.slice(dot + 1);
  let payloadBytes: Uint8Array<ArrayBuffer>;
  let sig: Uint8Array<ArrayBuffer>;
  try {
    payloadBytes = base64urlDecode(payloadB64);
    sig = base64urlDecode(sigB64);
  } catch {
    return null;
  }
  const key = await getFantomasHmacKey();
  if (!key) return null;
  const ok = await crypto.subtle.verify("HMAC", key, sig, payloadBytes);
  if (!ok) return null;
  let payload: FantomasSessionPayload;
  try {
    payload = JSON.parse(utf8str(payloadBytes)) as FantomasSessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
    return null;
  }
  if (payload.sub !== FANTOMAS_USERNAME) return null;
  if (payload.exp <= nowSeconds) return null;
  return FANTOMAS_PRINCIPAL;
}

/**
 * Read the Fantomas cookie value from a Headers / cookie string.
 * Used by getPrincipal() and the /api/fantomas/* endpoints.
 *
 * Edge-compatible: pure string parsing, no `cookie` npm package.
 */
export function readFantomasCookie(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  // Cookies are separated by "; " — find the fantomas cookie by name prefix.
  // Match `jourdain_fantomas_session=` exactly at a cookie boundary.
  const name = FANTOMAS_COOKIE_NAME + "=";
  const start = cookieHeader.indexOf(name);
  if (start === -1) return null;
  // Confirm it's at a cookie boundary (start of string or right after "; ").
  if (start !== 0 && cookieHeader[start - 1] !== " ") {
    // Could be a substring of another cookie name — keep searching.
    return null;
  }
  const valueStart = start + name.length;
  const valueEnd = cookieHeader.indexOf(";", valueStart);
  const value =
    valueEnd === -1
      ? cookieHeader.slice(valueStart)
      : cookieHeader.slice(valueStart, valueEnd);
  return value;
}

/**
 * Build the Set-Cookie header value for the Fantomas session cookie.
 *
 * HttpOnly: YES (no client JS access)
 * SameSite: Lax (cookie sent on top-level navigations, not on cross-site
 *   subresource requests — matches the existing Better Auth cookie policy)
 * Secure: dynamic — set to "Secure" when the request is HTTPS, omitted on
 *   localhost HTTP so the browser actually stores the cookie (browsers
 *   refuse to store cookies with Secure on HTTP).
 * Path: / (whole site — needed for /admin/* and /api/fantomas/*)
 * Max-Age: 8h (matches FANTOMAS_SESSION_MAX_AGE_SECONDS)
 */
export function buildFantomasSetCookie(
  value: string,
  opts: { secure: boolean; maxAgeSeconds?: number },
): string {
  const maxAge = opts.maxAgeSeconds ?? FANTOMAS_SESSION_MAX_AGE_SECONDS;
  const parts = [
    `${FANTOMAS_COOKIE_NAME}=${value}`,
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    "Path=/",
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

/**
 * Build the Set-Cookie header value to CLEAR the Fantomas session cookie.
 * Max-Age=0 + empty value → browser deletes the cookie.
 */
export function buildFantomasClearCookie(opts: { secure: boolean }): string {
  const parts = [
    `${FANTOMAS_COOKIE_NAME}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Path=/",
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}
