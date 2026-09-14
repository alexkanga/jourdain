# ADR-0003 — Authentication: Better Auth + Username + Admin Plugin + scrypt + Rate Limiting

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-003, TD-009, TD-031
RELATED REQ IDS:  FR-001, FR-002, FR-003, FR-004, NFR-010, NFR-011, NFR-012, NFR-013, PERM-003

CONTEXT:
V1 requires: login/logout, no public registration, username-based daily login (Fantomas logs in as "Fantomas"), database sessions (stateful admin back-office), server-side user creation for bootstrap, rate limiting for brute-force protection, no secrets in the repository (S0 §13).

DECISION:
Better Auth with the following configuration:
- emailAndPassword: { enabled: true, disableSignUp: true } — password auth, public sign-up DISABLED.
- Username plugin (better-auth/plugins/username) — daily login identifier is username (NOT email).
- Admin plugin (better-auth/plugins/admin) — explicitly configured server-side; enables auth.api.createUser() for bootstrap; NOT the business authorization system; no user-management UI in V1.
- Database sessions (session table managed by Better Auth Drizzle adapter).
- Password hashing: scrypt via Better Auth default (Node.js built-in crypto.scrypt; no bcrypt/bcryptjs dependency).
- Rate limiting: Better Auth integrated rate limiter with database storage on Neon (NOT in-memory, NOT Redis, NOT custom module).

ALTERNATIVES CONSIDERED:
- Auth.js v5 (NextAuth) — rejected: Credentials provider is discouraged in Auth.js docs for database-backed auth; @auth/drizzle-adapter less actively maintained than Better Auth's adapter; Better Auth is more aligned with Drizzle-first + Next.js App Router stack.
- Custom auth — rejected: fragile, reinvents session management, CSRF, password hashing, rate limiting.
- bcrypt/bcryptjs — rejected: Better Auth handles hashing internally (scrypt); removes the bcrypt-vs-bcryptjs question and the Vercel native-build risk.
- In-memory rate limiting — rejected: not serverless-compatible (per-instance counter does not persist across Vercel function instances).
- Redis/Vercel KV/Upstash for rate limiting — rejected: paid add-ons, not justified for V1.

RATIONALE:
Better Auth is the simplest mature solution covering all V1 auth needs with the smallest surface. Username plugin provides the daily login identifier. Admin plugin enables server-side user creation for bootstrap. scrypt is built-in (no native binding, no Vercel build risk). Database-backed rate limiting is serverless-compatible without paid add-ons.

CONSEQUENCES:
+ No bcrypt dependency (scrypt is built-in).
+ No Redis/Vercel KV dependency for rate limiting.
+ Bootstrap uses auth.api.createUser() — no manual password hash INSERT.
+ Admin plugin is server-side only; no user-management UI in V1.
- Better Auth API may churn (mitigated by pinning version + CI).
- Email field is required by Better Auth but synthetic for system principals (not used for daily login).

VERIFICATION:
Integration tests use real Better Auth flow for login/logout. Bootstrap script test verifies idempotent user creation. Rate-limit test verifies threshold enforcement.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-003, TD-009, TD-031), S6 §12 (auth flows), S6 §14.10 (rate limiting)
