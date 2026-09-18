# Environment Variables — JOURDAIN EMPLOI V1

## Environment Tiers

| Environment | Neon Branch (target) | DATABASE_URL (target) | BETTER_AUTH_URL |
|---|---|---|---|
| LOCAL (dev) | Developer's local or TEST | = TEST_DATABASE_URL or local | `http://localhost:3000` |
| LOCAL (E2E) | Neon test branch | = TEST_DATABASE_URL | `http://127.0.0.1:3100` |
| PREVIEW (dev) | Neon dev branch | = DEV_DATABASE_URL | Preview origin URL (NOT localhost) |
| PRODUCTION (main) | Neon main branch | = PROD_DATABASE_URL | Production origin URL |

**Note:** The above table describes the TARGET topology. The ACTUAL current Production environment configuration (whether `DATABASE_URL` is set in Vercel Production and which Neon branch it points to) is UNKNOWN from the local environment and must be verified by OWNER in the Vercel dashboard.

## Role Hierarchy

| Role | principalType | Capabilities |
|---|---|---|
| ADMIN | `ADMIN` | Offer CRUD (create, edit, save, publish, suspend, republish, archive). NO `offer:restore`. NO `user:*`. |
| SUPER_ADMIN | `SUPER_ADMIN` | Inherits all ADMIN + `offer:restore` + `user:list`, `user:create`, `user:update`, `user:delete`. |
| FANTOMAS | `FANTOMAS` | Inherits all SUPER_ADMIN + `system:bootstrap`, `system:recovery`. Independent break-glass auth (DB-free). |

**admin1** is canonically a **SUPER_ADMIN** (not ADMIN).

**Note:** `user:password-reset` was REMOVED from V1. Better Auth's `setUserPassword` admin endpoint requires an admin-session semantics that don't map cleanly to the independent principal model. A future password-reset mechanism may be designed separately if needed.

## Local Environment (.env.local, gitignored)

| Variable | Classification | Default | Notes |
|---|---|---|---|
| `TEST_DATABASE_URL` | SECRET | — | Neon test branch connection string |
| `DEV_DATABASE_URL` | SECRET | — | Neon dev branch connection string (optional for local dev) |
| `DATABASE_URL` | SECRET | — | Runtime alias — set to the appropriate target |
| `BETTER_AUTH_SECRET` | SECRET | — | Auth secret (per environment) |
| `BETTER_AUTH_URL` | NON-SECRET | `http://localhost:3000` | Must match runtime origin |
| `FANTOMAS_SESSION_SECRET` | SECRET | — | 32+ bytes base64. HMAC-SHA256 signing key for the Fantomas break-glass session cookie. |
| `INITIAL_ADMIN_LOGIN` | NON-SECRET | `admin1` | Bootstrap admin username |
| `INITIAL_ADMIN_PASSWORD` | SECRET | — | Admin bootstrap password |
| `INITIAL_ADMIN_EMAIL` | NON-SECRET | `admin1@jourdain.local` | Bootstrap admin email |
| `FANTOMAS_INITIAL_PASSWORD` | SECRET | — | DB-backed Fantomas bootstrap password (transitional) |
| `FANTOMAS_EMAIL` | NON-SECRET | `fantomas@jourdain.local` | DB-backed Fantomas user email (transitional) |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | `http://localhost:3000` | Site URL (per environment) |
| `E2E_EXPECTED_TEST_DATABASE_HOST` | NON-SECRET | — | Expected TEST DB hostname (E2E fingerprint, not needed in Vercel) |

## GitHub Actions

**No secrets required.** **No variables required.**

CI runs stateless gates only: lint, typecheck. These need no database, no secrets, no Vercel. Build is excluded (requires DATABASE_URL at build time).

## Vercel Preview Environment Variables

Configured in Vercel dashboard (NOT in vercel.json):

### Permanent (required at runtime)

| Variable | Classification | Notes |
|---|---|---|
| `DATABASE_URL` | SECRET | = DEV_DATABASE_URL (Neon dev branch) |
| `BETTER_AUTH_SECRET` | SECRET | Preview-specific auth secret |
| `BETTER_AUTH_URL` | NON-SECRET | Preview origin (NOT localhost) |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Preview origin |
| `FANTOMAS_SESSION_SECRET` | SECRET | 32+ bytes base64. Required for Fantomas break-glass login. |

### Bootstrap-Only (required for initial `pnpm db:bootstrap`, can be removed after)

| Variable | Classification | Default | Notes |
|---|---|---|---|
| `INITIAL_ADMIN_LOGIN` | NON-SECRET | `admin1` | Bootstrap admin username |
| `INITIAL_ADMIN_EMAIL` | NON-SECRET | `admin1@jourdain.local` | Bootstrap admin email |
| `INITIAL_ADMIN_PASSWORD` | SECRET | — | Admin bootstrap password |
| `FANTOMAS_EMAIL` | NON-SECRET | `fantomas@jourdain.local` | DB-backed Fantomas email (transitional) |
| `FANTOMAS_INITIAL_PASSWORD` | SECRET | — | DB-backed Fantomas password (transitional) |

## Vercel Production Environment Variables

Configured in Vercel dashboard during project setup:

### Permanent (required at runtime — TARGET configuration)

| Variable | Classification | Notes |
|---|---|---|
| `DATABASE_URL` | SECRET | = PROD_DATABASE_URL (Neon main branch). Must NOT point to dev or test. |
| `BETTER_AUTH_SECRET` | SECRET | Production strong secret (distinct from Preview) |
| `BETTER_AUTH_URL` | NON-SECRET | Production HTTPS origin (e.g., `https://jourdain-three.vercel.app`) |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Production HTTPS origin (same as `BETTER_AUTH_URL`). Used by `sitemap.ts`. |
| `FANTOMAS_SESSION_SECRET` | SECRET | 32+ bytes base64. Required for Fantomas break-glass login. |

### Bootstrap-Only (required for initial `pnpm db:bootstrap`, can be removed after)

| Variable | Classification | Default | Notes |
|---|---|---|---|
| `INITIAL_ADMIN_LOGIN` | NON-SECRET | `admin1` | Bootstrap admin username |
| `INITIAL_ADMIN_EMAIL` | NON-SECRET | `admin1@jourdain.local` | Bootstrap admin email |
| `INITIAL_ADMIN_PASSWORD` | SECRET | — | admin1's initial password (set secure value before bootstrap) |
| `FANTOMAS_EMAIL` | NON-SECRET | `fantomas@jourdain.local` | DB-backed Fantomas email (transitional) |
| `FANTOMAS_INITIAL_PASSWORD` | SECRET | — | DB-backed Fantomas password (transitional — NOT used by break-glass path) |

**Current Production env configuration status:** UNKNOWN from this environment. The actual Vercel Production env vars (including whether `DATABASE_URL` is set and which Neon branch it points to, whether `FANTOMAS_SESSION_SECRET` is configured) must be verified by OWNER in the Vercel dashboard.

## Migration Chain

Three migrations, applied in canonical order:

| Order | File | Description |
|---|---|---|
| 1 | `db/migrations/0000_medical_gunslinger.sql` | Initial schema (6 tables, 2 enums, 2 indexes). `principal_type` enum = `ADMIN, FANTOMAS`. |
| 2 | `db/migrations/0001_happy_skullbuster.sql` | Better Auth type fixes (boolean/integer/bigint). |
| 3 | `db/migrations/0002_deep_justin_hammer.sql` | `ALTER TYPE principal_type ADD VALUE 'SUPER_ADMIN'`. |

**Production migration requirement:** UNKNOWN — actual Neon main database state must be inspected read-only before executing migrations.

## Rules

1. Only variable NAMES in documentation — no values committed
2. `.env.local` holds local values (gitignored)
3. No GitHub Actions secrets or variables needed
4. Vercel env vars configured per environment in Vercel dashboard
5. `BETTER_AUTH_URL` must match runtime origin — never localhost in remote deployment
6. Bootstrap-only env vars can be removed after first bootstrap run
7. `FANTOMAS_SESSION_SECRET` is a PERMANENT env var — it's needed at runtime for the Fantomas break-glass login path, not just at bootstrap
