# Deployment Guide — JOURDAIN EMPLOI V1

## Branch-to-Deployment Mapping

| Git Branch | Vercel Environment | `git.deploymentEnabled` | Auto-Deploy? | Vercel Invocations |
|---|---|---|---|---|
| `wp/*` (work branches) | NO Vercel deployment | `false` | NO | **0** |
| `dev` | Preview (LIMITED — human review only) | `true` | YES (bounded — 1 per eligible push) | Bounded |
| `main` (pre-S13) | NO Production deployment | `false` | NO | **0** |
| `main` (post-S13) | Production | `true` (after OWNER PROD GO) | YES — OWNER PROD GO only | 1 deployment event |

### Key Rules

1. **`git.deploymentEnabled` is the PRIMARY guard** — Vercel's `git.deploymentEnabled` with branch/glob matching controls whether a push triggers a deployment event. This is NOT the same as Vercel's "Ignored Build Step" (which only skips the build phase but still creates a deployment event).

2. **Deny-by-default** — The `vercel.json` configures `**": false` as the catch-all, with explicit `dev": true` as the ONLY allow rule. All other branches (including `wp/*`, `main` pre-S13, and arbitrary unapproved branches) are denied.

3. **Production Branch = placeholder** — During MS-006 (pre-S13), the Vercel Production Branch is set to a non-release placeholder (e.g., `production-disabled`). The `main` branch is NOT the Production Branch until S13 OWNER PROD GO.

4. **Ignored Build Step is NOT the security boundary** — It is an optional secondary optimization for already-eligible branches (e.g., skipping docs-only deployments on `dev`).

## CI vs Vercel Deployment

CI (GitHub Actions) and Vercel deployments are **independent**:
- A complete CI PASS is achievable with ZERO Vercel invocation.
- CI does NOT deploy to Vercel.
- Vercel Preview is an independent deployment event for bounded human review only.

## OWNER PROD GO Boundary

Production deployment requires explicit OWNER PROD GO (S13):
- No automatic Production deployment from any branch
- No Production DB mutation without OWNER PROD GO
- No Production migration without OWNER PROD GO
- No Production bootstrap without OWNER PROD GO

## Migration Workflow

| Environment | Migration Execution | Who | When |
|---|---|---|---|
| TEST | NOT in normal CI (WP-006 has no schema change). Future: dedicated explicit job with shared-TEST mutex + TEST certification | CI (future) or operator | When migration files change |
| DEV | Manual: `pnpm db:migrate` with DATABASE_URL=DEV_DATABASE_URL | Operator | After generating new migration |
| PREVIEW | NOT in Vercel build. Manual if needed | Operator | Explicit, separately authorized |
| PRODUCTION | Manual + OWNER PROD GO: `pnpm db:migrate` with DATABASE_URL=PROD_DATABASE_URL | Operator | After OWNER PROD GO (S13) |

**Vercel build does NOT execute migrations.** Build command = `pnpm build` only.

## Bootstrap Workflow

| Environment | Bootstrap Execution | Who | When |
|---|---|---|---|
| TEST | CI E2E job only, AFTER TEST target certification, idempotent | CI | Every E2E run |
| DEV | Manual: `pnpm db:bootstrap` with DATABASE_URL=DEV_DATABASE_URL | Operator | Once after first DEV migration |
| PREVIEW | NOT in Vercel build. Manual if needed | Operator | Explicit, controlled |
| PRODUCTION | Manual + OWNER PROD GO | Operator | After first production deploy (S13) |

**Vercel build does NOT execute bootstrap.** Build command = `pnpm build` only.

## First Vercel Link Preflight

Before importing/linking the Git repository to Vercel:
1. Determine whether the creation/link procedure auto-deploys Production.
2. If YES or UNKNOWN → STOP (`VERCEL_PRODUCTION_AUTO_DEPLOY_NOT_SAFELY_DISABLED`).
3. Verify that `vercel.json` with `git.deploymentEnabled` is honored early enough during first linkage.
4. Set Production Branch = placeholder BEFORE linking.
5. Only link after preflight proves safe.

## Rollback Basics

- **CI failure**: Developer fixes root cause. No retry.
- **Vercel Preview failure**: Check Vercel build logs. Fix env vars or code. Re-deploy.
- **Production deployment without OWNER PROD GO**: STOP immediately. Rollback via Vercel dashboard. Investigate. Report to OWNER.

## Quota-Safety

- LOCAL first — remote runtime is not the normal test platform
- No Vercel E2E, no Preview E2E, no Production E2E
- No load testing, no synthetic monitoring, no polling, no cron
- No unbounded retries (0 retries in CI + Playwright)
- No duplicate CI executions (concurrency with cancel-in-progress)
- No duplicate Preview deployments (only `dev` is eligible)
- No per-PR Neon branch auto-provisioning (removed)
- No Vercel build DB mutation (forbidden)
