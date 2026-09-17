# Deployment Guide — JOURDAIN EMPLOI V1

## Architecture Overview

Per AISE S0 v0.3 §27 (PRODUCT DELIVERY FIRST & COMPLEXITY BUDGET):

- **GitHub** = repository + lightweight stateless CI (lint + typecheck + build)
- **AISE/local** = full application verification (Vitest 149 + Playwright 101)
- **Vercel** = hosting (Preview for dev; Production deferred to S13)
- **Neon** = database (Production main branch; dev branch for Preview; test branch for local/CI)

## Branch-to-Deployment Mapping

| Git Branch | Vercel `git.deploymentEnabled` | Deploys? | Purpose |
|---|---|---|---|
| `wp/*` | `false` | NO | Work branches — verified locally, not deployed |
| `dev` | `true` | YES (Preview only) | Canonical integration — human review via Vercel Preview |
| `main` (pre-S13) | `false` | NO | Release branch — Production deferred to OWNER PROD GO |
| `main` (post-S13) | `true` (after S13) | YES (Production) | Production — OWNER PROD GO only |

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
| `pnpm build` | — | NO | NO |
| `pnpm test:e2e` (Playwright) | 101/101 | TEST_DATABASE_URL + local Next.js | NO |

## Vercel Configuration

`vercel.json` controls branch deployment eligibility via `git.deploymentEnabled`:

```json
{
  "git": {
    "deploymentEnabled": {
      "dev": true,
      "main": false,
      "wp/*": false,
      "**": false
    }
  },
  "buildCommand": "pnpm build"
}
```

- `dev` is the ONLY branch that triggers a Vercel Preview deployment.
- `main` does NOT deploy until OWNER PROD GO (S13).
- `wp/*` and all other branches do NOT deploy.
- Vercel build = `pnpm build` only (no migration, no bootstrap).

## OWNER PROD GO Boundary

Production deployment requires explicit OWNER PROD GO (S13):
- No automatic Production deployment
- No Production DB mutation
- No Production migration
- No Production bootstrap

## Migration Workflow

| Environment | How | Who | When |
|---|---|---|---|
| TEST | Local: `pnpm db:migrate` with DATABASE_URL=TEST_DATABASE_URL | Developer/Agent | Before local tests |
| DEV | Manual: `pnpm db:migrate` with DATABASE_URL=DEV_DATABASE_URL | Operator | When needed |
| PRODUCTION | Manual + OWNER PROD GO: `pnpm db:migrate` with DATABASE_URL=PROD_DATABASE_URL | Operator | S13 only |

**Vercel build does NOT execute migrations.**

## Bootstrap Workflow

| Environment | How | Who | When |
|---|---|---|---|
| TEST | Local E2E: `pnpm db:bootstrap` (idempotent) | E2E runner | Before Playwright |
| DEV | Manual: `pnpm db:bootstrap` | Operator | When needed |
| PRODUCTION | Manual + OWNER PROD GO | Operator | S13 only |

**Vercel build does NOT execute bootstrap.**

## Quota-Safety

- LOCAL first — full verification runs locally
- No Vercel E2E, no Preview E2E, no Production E2E
- No load testing, monitoring, polling, cron
- No unbounded retries
- Vercel build = `pnpm build` only (no DB mutation)
