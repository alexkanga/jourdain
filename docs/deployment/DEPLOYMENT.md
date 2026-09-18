# Deployment Guide — JOURDAIN EMPLOI V1

## Architecture Overview

One project, two deployment targets:

- **GitHub** = repository + lightweight stateless CI (lint + typecheck)
- **AISE/local** = full application verification (Vitest 263 + Playwright 107)
- **Vercel** = hosting (ONE project: dev → Preview, main → Production)
- **Neon** = database (Production main branch; dev branch for Preview; test branch for local/CI)

## Branch-to-Deployment Mapping

| Git Branch | Vercel `git.deploymentEnabled` | Deploys? | Vercel Environment |
|---|---|---|---|
| `main` | `true` | YES | Production |
| `dev` | `true` | YES | Preview |
| `wp/*` | `false` | NO | — |
| all other branches | `false` (catch-all `**`) | NO | — |

## GitHub CI

Stateless gates only (no secrets, no database, no Vercel):

| Gate | Requires Secrets? | Database? | Vercel? |
|---|---|---|---|
| `pnpm lint` | NO | NO | NO |
| `pnpm typecheck` | NO | NO | NO |

Build is excluded from GitHub CI because Next.js page-data collection
requires DATABASE_URL at build time. Build remains a LOCAL AISE quality gate.

**No GitHub Actions Secrets required.**
**No GitHub Actions Variables required.**
**No manual GitHub configuration required.**

## Local AISE Quality Gate

Full verification runs locally (mandatory before integration):

| Gate | Count | Database | Vercel? |
|---|---|---|---|
| `pnpm lint` | — | NO | NO |
| `pnpm typecheck` | — | NO | NO |
| `pnpm test` (Vitest) | 263/263 | TEST_DATABASE_URL | NO |
| `pnpm build` | — | DATABASE_URL | NO |
| `pnpm test:e2e` (Playwright) | 107/107 | TEST_DATABASE_URL + local Next.js | NO |

## Vercel Configuration

`vercel.json` controls branch deployment eligibility:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "dev": true,
      "wp/*": false,
      "**": false
    }
  },
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

- `main` → Vercel Production deployment.
- `dev` → Vercel Preview deployment (for human review).
- `wp/*` and all other branches → NO deployment.
- Vercel build = `pnpm build` only (no migration, no bootstrap).

## Vercel Environment Variables

Configured in Vercel dashboard (NOT in vercel.json):

### Permanent Production Environment Variables (REQUIRED at runtime)

| Variable | Classification | Notes |
|---|---|---|
| `DATABASE_URL` | SECRET | Neon main branch connection string. Must NOT point to dev or test. |
| `BETTER_AUTH_SECRET` | SECRET | High-entropy auth secret. Distinct from Preview/Local values. |
| `BETTER_AUTH_URL` | NON-SECRET | Production HTTPS origin (e.g., `https://jourdain-three.vercel.app`). NOT localhost. Required for `__Secure-` cookie prefix. |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Production HTTPS origin. Same as `BETTER_AUTH_URL`. Used by `sitemap.ts` for offer URLs. |
| `FANTOMAS_SESSION_SECRET` | SECRET | 32+ bytes base64. HMAC-SHA256 signing key for the Fantomas break-glass session cookie (`jourdain_fantomas_session`). Without it, Fantomas break-glass login returns HTTP 500. Better Auth ADMIN login and public portal are unaffected. |

### Bootstrap-Only Environment Variables (REQUIRED for initial `pnpm db:bootstrap`, can be removed after)

| Variable | Classification | Default | Notes |
|---|---|---|---|
| `INITIAL_ADMIN_LOGIN` | NON-SECRET | `admin1` | Bootstrap admin username. |
| `INITIAL_ADMIN_EMAIL` | NON-SECRET | `admin1@jourdain.local` | Bootstrap admin email. |
| `INITIAL_ADMIN_PASSWORD` | SECRET | — | admin1's initial password. Set to a secure value before bootstrap. |
| `FANTOMAS_EMAIL` | NON-SECRET | `fantomas@jourdain.local` | DB-backed Fantomas user email (transitional). |
| `FANTOMAS_INITIAL_PASSWORD` | SECRET | — | DB-backed Fantomas user's password (transitional — NOT used by the break-glass path which uses `fantomas/fantomas`). |

**Note:** Bootstrap-only env vars are needed ONLY for the initial `pnpm db:bootstrap` run against each environment. They can be removed from Vercel after the first bootstrap succeeds. The application runtime does NOT read them.

**Current Production env configuration status:** UNKNOWN from the local environment. The actual Vercel Production env vars (including whether `DATABASE_URL` is set and which Neon branch it points to) must be verified by OWNER in the Vercel dashboard.

## Migration Workflow

### Migration Chain (3 migrations, applied in order)

| Order | File | Description |
|---|---|---|
| 1 | `db/migrations/0000_medical_gunslinger.sql` | Initial schema: 6 tables (user, session, account, verification, rateLimit, offers), 2 enums (offer_status, principal_type), 2 indexes. `principal_type` enum = `ADMIN, FANTOMAS`. |
| 2 | `db/migrations/0001_happy_skullbuster.sql` | Better Auth type fixes: `user.email_verified` and `user.banned` → `boolean`; `rateLimit.count` → `integer`; `rateLimit.last_request` → `bigint`. Non-destructive (uses USING clauses). |
| 3 | `db/migrations/0002_deep_justin_hammer.sql` | `ALTER TYPE principal_type ADD VALUE 'SUPER_ADMIN' BEFORE 'FANTOMAS'`. Adds the SUPER_ADMIN tier to the existing enum. |

| Environment | How | Who | When |
|---|---|---|---|
| TEST | Local: `pnpm db:migrate` with `DATABASE_URL=TEST_DATABASE_URL` | Developer/Agent | Before local tests |
| DEV/Preview | Manual: `pnpm db:migrate` with `DATABASE_URL=DEV_DATABASE_URL` | Operator | When needed |
| PRODUCTION | Manual + OWNER authorization: `pnpm db:migrate` with `DATABASE_URL=PROD_DATABASE_URL` | Operator | Before first Production deploy |

**Vercel build does NOT execute migrations.** Build = `pnpm build` only.

**Production migration requirement:** The actual Neon main database state is UNKNOWN from this environment. Before executing migrations against Production, OWNER must perform a READ-ONLY inspection of the Neon main database to determine which migrations (if any) are already applied. The canonical migration order is: `0000 → 0001 → 0002`. Only unapplied migrations should be executed.

## Bootstrap Workflow

### Role Hierarchy

| Role | principalType | Capabilities |
|---|---|---|
| ADMIN | `ADMIN` | Offer CRUD (create, edit, save, publish, suspend, republish, archive). NO offer:restore. NO user management. |
| SUPER_ADMIN | `SUPER_ADMIN` | Inherits all ADMIN capabilities + `offer:restore` + user management (`user:list`, `user:create`, `user:update`, `user:delete`). |
| FANTOMAS | `FANTOMAS` | Inherits all SUPER_ADMIN capabilities + `system:bootstrap`, `system:recovery` (break-glass). |

### admin1 Canonical Role

admin1 is canonically a **SUPER_ADMIN** (not ADMIN). The bootstrap creates admin1 with `principalType = SUPER_ADMIN`. If admin1 already exists as ADMIN (from a prior bootstrap before the user-management work package), the next bootstrap run idempotently promotes it to SUPER_ADMIN.

### Fantomas Break-Glass vs DB-Backed Fantomas

- **Fantomas break-glass** (new, V1): independent of Better Auth / Neon / PostgreSQL. Uses `fantomas/fantomas` credentials + Web Crypto HMAC-SHA256 signed cookie (`jourdain_fantomas_session`) with `FANTOMAS_SESSION_SECRET`. Does NOT require a DB row.
- **DB-backed Fantomas** (transitional): created by bootstrap with `FANTOMAS_INITIAL_PASSWORD`. Retained temporarily for backward compatibility. The break-glass path does NOT use this DB row.

| Environment | How | Who | When |
|---|---|---|---|
| TEST | Local E2E: `pnpm db:bootstrap` (idempotent) | E2E runner | Before Playwright |
| DEV/Preview | Manual: `pnpm db:bootstrap` | Operator | When needed |
| PRODUCTION | Manual: `pnpm db:bootstrap` | Operator | After migrations are applied |

**Bootstrap is idempotent.** It does NOT overwrite existing users. It creates admin1 (SUPER_ADMIN) and DB-backed fantomas (FANTOMAS) if missing, and promotes admin1 from ADMIN to SUPER_ADMIN if needed.

**Vercel build does NOT execute bootstrap.** Build = `pnpm build` only.

**Production bootstrap requirement:** UNKNOWN from this environment. OWNER must inspect the actual Neon main database to determine whether admin1 and DB-backed fantomas already exist before running bootstrap.

## Quota-Safety

- LOCAL first — full verification runs locally
- No Vercel E2E, no Preview E2E, no Production E2E
- No load testing, monitoring, polling, cron
- No unbounded retries
- Vercel build = `pnpm build` only (no DB mutation)
