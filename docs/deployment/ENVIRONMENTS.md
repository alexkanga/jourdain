# Environment Variables — JOURDAIN EMPLOI V1

## Environment Tiers

| Environment | Neon Branch | DATABASE_URL | BETTER_AUTH_URL |
|---|---|---|---|
| LOCAL (dev) | Developer's local or TEST | = TEST_DATABASE_URL or local | `http://localhost:3000` |
| LOCAL (E2E) | Neon test branch | = TEST_DATABASE_URL | `http://127.0.0.1:3100` |
| PREVIEW (dev) | Neon dev branch | = DEV_DATABASE_URL | Preview origin URL (NOT localhost) |
| PRODUCTION | Neon main branch | = PROD_DATABASE_URL | Production origin URL |

## Local Environment (.env.local, gitignored)

| Variable | Classification | Notes |
|---|---|---|
| `TEST_DATABASE_URL` | SECRET | Neon test branch connection string |
| `DEV_DATABASE_URL` | SECRET | Neon dev branch connection string (optional for local dev) |
| `DATABASE_URL` | SECRET | Runtime alias — set to the appropriate target |
| `BETTER_AUTH_SECRET` | SECRET | Auth secret (per environment) |
| `BETTER_AUTH_URL` | NON-SECRET | Must match runtime origin |
| `INITIAL_ADMIN_LOGIN` | NON-SECRET | `admin1` (bootstrap) |
| `INITIAL_ADMIN_PASSWORD` | SECRET | Admin bootstrap password |
| `INITIAL_ADMIN_EMAIL` | NON-SECRET | `admin1@jourdain.local` |
| `FANTOMAS_INITIAL_PASSWORD` | SECRET | Fantomas bootstrap password |
| `FANTOMAS_EMAIL` | NON-SECRET | `fantomas@jourdain.local` |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Site URL (per environment) |
| `E2E_EXPECTED_TEST_DATABASE_HOST` | NON-SECRET | Expected TEST DB hostname (E2E fingerprint) |

## GitHub Actions

**No secrets required.** **No variables required.**

CI runs stateless gates only: lint, typecheck. These need no database, no secrets, no Vercel. Build is excluded (requires DATABASE_URL at build time).

## Vercel Preview Environment Variables

Configured in Vercel dashboard (NOT in vercel.json):

| Variable | Classification |
|---|---|
| `DATABASE_URL` | SECRET (= DEV_DATABASE_URL) |
| `BETTER_AUTH_SECRET` | SECRET (Preview-specific) |
| `BETTER_AUTH_URL` | NON-SECRET (Preview origin, NOT localhost) |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC (Preview origin) |

## Vercel Production Environment Variables

Configured in Vercel dashboard during project setup:

| Variable | Classification |
|---|---|
| `DATABASE_URL` | SECRET (= PROD_DATABASE_URL) |
| `BETTER_AUTH_SECRET` | SECRET (Production strong secret) |
| `BETTER_AUTH_URL` | NON-SECRET (Production origin) |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC (Production origin) |

**Production secret values set during Vercel project setup.**

## Rules

1. Only variable NAMES in documentation — no values committed
2. `.env.local` holds local values (gitignored)
3. No GitHub Actions secrets or variables needed
4. Vercel env vars configured per environment in Vercel dashboard
5. BETTER_AUTH_URL must match runtime origin — never localhost in remote deployment
6. Bootstrap credentials can be removed after first bootstrap run
