# Deployment Guide — JOURDAIN EMPLOI V1

## Architecture Overview

One project, two deployment targets:

- **GitHub** = repository + lightweight stateless CI (lint + typecheck)
- **AISE/local** = full application verification (Vitest 149 + Playwright 101)
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
| `pnpm test` (Vitest) | 149/149 | TEST_DATABASE_URL | NO |
| `pnpm build` | — | DATABASE_URL | NO |
| `pnpm test:e2e` (Playwright) | 101/101 | TEST_DATABASE_URL + local Next.js | NO |

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
  "buildCommand": "pnpm build"
}
```

- `main` → Vercel Production deployment.
- `dev` → Vercel Preview deployment (for human review).
- `wp/*` and all other branches → NO deployment.
- Vercel build = `pnpm build` only (no migration, no bootstrap).

## Vercel Environment Variables

Configured in Vercel dashboard (NOT in vercel.json):

**Preview (dev):**
- `DATABASE_URL` = DEV_DATABASE_URL (Neon dev branch)
- `BETTER_AUTH_SECRET` = Preview-specific
- `BETTER_AUTH_URL` = Preview origin (NOT localhost)
- `NEXT_PUBLIC_SITE_URL` = Preview origin

**Production (main):**
- `DATABASE_URL` = PROD_DATABASE_URL (Neon main branch)
- `BETTER_AUTH_SECRET` = Production strong secret
- `BETTER_AUTH_URL` = Production origin
- `NEXT_PUBLIC_SITE_URL` = Production origin

Production secret values are set during Vercel project setup.

## Migration Workflow

| Environment | How | Who | When |
|---|---|---|---|
| TEST | Local: `pnpm db:migrate` with DATABASE_URL=TEST_DATABASE_URL | Developer/Agent | Before local tests |
| DEV/Preview | Manual: `pnpm db:migrate` with DATABASE_URL=DEV_DATABASE_URL | Operator | When needed |
| PRODUCTION | Manual + OWNER authorization: `pnpm db:migrate` with DATABASE_URL=PROD_DATABASE_URL | Operator | After Production deploy |

**Vercel build does NOT execute migrations.** Build = `pnpm build` only.

## Bootstrap Workflow

| Environment | How | Who | When |
|---|---|---|---|
| TEST | Local E2E: `pnpm db:bootstrap` (idempotent) | E2E runner | Before Playwright |
| DEV/Preview | Manual: `pnpm db:bootstrap` | Operator | When needed |
| PRODUCTION | Manual: `pnpm db:bootstrap` | Operator | After first Production deploy |

**Vercel build does NOT execute bootstrap.** Build = `pnpm build` only.

## Quota-Safety

- LOCAL first — full verification runs locally
- No Vercel E2E, no Preview E2E, no Production E2E
- No load testing, monitoring, polling, cron
- No unbounded retries
- Vercel build = `pnpm build` only (no DB mutation)
