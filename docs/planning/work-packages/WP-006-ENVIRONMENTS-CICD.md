# WP-006 — Environments + CI/CD + Deployment Preparation

## 1. Contract Status

| Field | Value |
|---|---|
| WP ID | WP-006 |
| Name | Environments + CI/CD + Deployment Preparation |
| Source Milestone | MS-006 — Environments + CI/CD (DELIVERY_ROADMAP §7) |
| Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| Canonical dev SHA (at S9 start) | `5128a451b738d231aacae6ad00effc55d25a8bed` |
| Canonical main SHA (at S9 start) | `0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d` |
| FINAL S10 BRANCH BASE (semantic rule) | S10 MUST branch from the OWNER-approved current dev HEAD containing this final contract. The concrete SHA is recorded in the S9 closure report (NOT hardcoded in the contract itself — per the recursive SHA-update loop avoidance rule established in WP-005). |
| Source Charter (S4) | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Source Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| Source Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` at `7c85323` |
| Source Project Manifest (S7) | `docs/architecture/PROJECT_MANIFEST.md` at `0b8b436` |
| Source Delivery Roadmap (S8) | `docs/planning/DELIVERY_ROADMAP.md` at `2796c2d` |
| Previous WP | WP-005 — CLOSED / PASS (impl head `29ce2d8`, closure commit `5128a45`) |
| AISE S0 Version | 0.2 (§26 REMOTE RUNTIME COST & QUOTA SAFETY active) |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED (requires OWNER APPROVE + AUTHORIZE) |
| S10 Started | NO |
| WP-007 Started | NO |

---

## 2. Purpose

Define the MINIMUM safe and maintainable architecture for:
- environment separation (LOCAL / TEST / DEV-INTEGRATION / PREVIEW / PRODUCTION)
- GitHub Actions CI (quality gates on PR + push)
- Vercel deployment preparation (project link, environment variables, branch mappings — NOT deployment execution)
- Neon environment mapping (Production / Preview / dev / test branches)
- environment variable governance (names, classification, secret boundaries)
- branch-to-deployment mapping (wp/* = no auto-Preview; dev = controlled Preview; main = Production candidate)
- Preview policy (quota-safe: minimize auto-Preview, no wp/* auto-Preview)
- Production boundary (OWNER PROD GO mandatory)
- migration governance (TEST/DEV auto-apply; Production manual + OWNER-authorized)
- bootstrap governance (per-environment, idempotent, OWNER-authorized)
- secret governance (.env.local / GitHub Actions secrets / Vercel env vars; never committed)
- quota-safety (AISE S0 v0.2 §26: LOCAL first, remote is not free, no unbounded retries/loops)
- remote testing policy (remote E2E FORBIDDEN by default; no Vercel E2E, no Preview E2E)
- OWNER manual actions (every future manual step enumerated with WHEN/WHERE/WHAT/SECRET classification)

This WP does NOT deploy anything. It does NOT create `.github/workflows/`, does NOT create `vercel.json` implementation, does NOT change Neon, does NOT run migrations, does NOT start MS-007, does NOT start S12, does NOT run remote Playwright, does NOT run remote smoke.

---

## 3. Requirements Covered

**REQUIREMENTS COVERED NOW (this WP):**

| Requirement | Priority | Coverage | Notes |
|---|---|---|---|
| NFR-011 (no password in repo) | MUST | PRIMARY | CI verifies no secrets in repo; GitHub Actions secrets + Vercel env vars used; .env.local gitignored |
| TD-019 (environment model — Production / Preview / Local isolation) | MUST | PRIMARY | Contract defines 3 Vercel environments (Production, Preview, local) + 3 Neon branches (main, preview, dev/test); strict isolation via distinct DATABASE_URL per environment |
| TD-025 (CI pipeline — GitHub Actions) | MUST | PRIMARY | Contract defines minimum CI: lint + typecheck + Vitest + build on PR; E2E on main + opt-in via label on PR |
| TD-018 (migration execution — controlled, never push to Production) | MUST | PRIMARY | Contract defines: TEST/DEV migrations auto-applied by CI; Production migrations manual + OWNER-authorized; never `drizzle-kit push` against Production |
| TD-029 (SEO — already delivered in WP-004) | MUST | SECONDARY | NEXT_PUBLIC_SITE_URL per environment (production domain for Production; preview URL for Preview; localhost for local) |
| AISE S0 §25 (target verification before any Production write) | MUST | PRIMARY | Contract requires bootstrap script + production-only code paths check VERCEL_ENV + DATABASE_URL host before any write |
| AISE S0 §26 (quota-safety) | MUST | PRIMARY | CI cost matrix, no Vercel E2E, no Preview E2E by default, no unbounded retries, no loops, no polling |
| Charter §10 (Production separated from Preview — MANDATED) | MUST | PRIMARY | Strict DATABASE_URL isolation; Preview never uses Production DB |

**REQUIREMENTS NOT IN THIS WP:**

| Requirement | Reason |
|---|---|
| Production deployment execution | S13 — OWNER PROD GO required |
| Production migration execution | S13 — operator runs manually |
| Production bootstrap execution | S13 — operator runs after production deploy |
| S12 Release Readiness assessment | MS-007 scope |
| Critical E2E on Vercel Preview | MS-007 scope (release-readiness verification) |
| Domain/DNS configuration | Future (post-deploy, if applicable) |

**ORPHAN SCOPE: 0**

---

## 4. Entry Conditions

| Condition | Status |
|---|---|
| MS-001 / WP-001 CLOSED / PASS WITH NON-BLOCKING FINDINGS | YES (impl commit `45fa8b7`) |
| MS-002 / WP-002 CLOSED / PASS | YES (impl commit `6d0027a`) |
| MS-003 / WP-003 CLOSED / PASS WITH NON-BLOCKING FINDINGS | YES (impl head `35f80b3`) |
| MS-004 / WP-004 CLOSED / PASS | YES (impl head `a7b3833`, closure commit `484898e`) |
| MS-005 / WP-005 CLOSED / PASS | YES (impl head `29ce2d8`, closure commit `5128a45`) |
| MS-006 selected as next milestone | YES (DELIVERY_ROADMAP §7) |
| MS-006 entry conditions: "MS-005 CLOSED / PASS" | YES |
| AISE S0 v0.2 §26 QUOTA-SAFETY active | YES |
| BLOCKING PRODUCT AMBIGUITIES | 0 |
| BLOCKING TECHNICAL AMBIGUITIES | 0 |
| Technical baseline (S6/S7) | APPROVED |
| Application code (Next.js + Better Auth + Tiptap + admin + public) | EXISTS from WP-001 to WP-004; no modification needed |
| E2E infrastructure (Playwright + 101 tests) | EXISTS from WP-005; preserved |
| Existing 149 Vitest tests | EXISTS; preserved |
| Database schema (offers + user + session + account + verification + rateLimit) | EXISTS from WP-002; no new migration needed |

---

## 5. In Scope

### 5.1 Environment Separation Model

Five execution targets per AISE S0 v0.2 §26:

| Target | Cost Class | Database | Purpose |
|---|---|---|---|
| LOCAL | LOCAL_UNMETERED | TEST_DATABASE_URL (or developer's local Neon branch) | Developer workstation; `pnpm dev`, `pnpm test`, `pnpm test:e2e` |
| TEST | CONTROLLED_TEST | TEST_DATABASE_URL (Neon test branch, positively verified via fingerprint) | Automated Vitest integration tests + Playwright E2E (local app + TEST DB) |
| DEV-INTEGRATION | REMOTE_METERED | DEV_DATABASE_URL (Neon dev branch) | Optional: manual developer browsing against a shared dev DB; NOT an automated test target |
| PREVIEW-STAGING | REMOTE_METERED | Neon preview branch (auto-provisioned per PR by Neon-Vercel integration) | Vercel Preview deployment per PR; manual human review only; NOT an automated E2E target |
| PRODUCTION | REMOTE_QUOTA_LIMITED | Neon main branch (PROD_DATABASE_URL) | Vercel Production deployment; OWNER PROD GO required |

**Isolation rules:**
- LOCAL never uses PRODUCTION database (E2E runner fail-closed: TEST_FINGERPRINT_MISMATCH, TEST_EQUALS_PROD).
- TEST never uses DEV or PRODUCTION (E2E runner fail-closed: TEST_EQUALS_DEV, TEST_EQUALS_PROD).
- PREVIEW-STAGING never uses PRODUCTION database (Vercel env var isolation: Preview DATABASE_URL = Neon preview branch, NOT Neon main).
- PRODUCTION is never an automated test target (no CI E2E against Production; no remote smoke against Production by default).

### 5.2 GitHub Actions CI Architecture

**Minimum useful CI** — evaluate each gate independently:

| Gate | Execution Target | Cost Class | DB Required | DB Mutation | Secrets Required | Vercel Invocation | Frequency | Retry | Timeout | Blocking |
|---|---|---|---|---|---|---|---|---|---|---|
| lint | LOCAL (GitHub Actions runner) | LOCAL_UNMETERED | NO | NO | NO | NO | Every PR + push to dev/main | 0 | 5 min | BLOCKING |
| typecheck | LOCAL (GitHub Actions runner) | LOCAL_UNMETERED | NO | NO | NO | NO | Every PR + push to dev/main | 0 | 5 min | BLOCKING |
| Vitest (149 tests) | LOCAL (GitHub Actions runner) | LOCAL_UNMETERED | NO (unit/component) / YES (integration — TEST_DATABASE_URL) | YES (integration tests create/clean fixtures on TEST) | TEST_DATABASE_URL, E2E_EXPECTED_TEST_DATABASE_HOST, BETTER_AUTH_SECRET, INITIAL_ADMIN_*, FANTOMAS_* | NO | Every PR + push to dev/main | 0 | 10 min | BLOCKING |
| build | LOCAL (GitHub Actions runner) | LOCAL_UNMETERED | NO | NO | NO | NO | Every PR + push to dev/main | 0 | 10 min | BLOCKING |
| Playwright E2E (101 tests) | LOCAL (GitHub Actions runner spawns local Next.js) | LOCAL_UNMETERED (app runtime) + CONTROLLED_TEST (TEST DB) | YES (TEST_DATABASE_URL) | YES (fixtures on TEST) | TEST_DATABASE_URL, E2E_EXPECTED_TEST_DATABASE_HOST, BETTER_AUTH_SECRET, BETTER_AUTH_URL, INITIAL_ADMIN_*, FANTOMAS_* | NO | Push to main + opt-in via `run-e2e` label on PR | 0 | 15 min | BLOCKING (main) / NON-BLOCKING (PR opt-in) |

**CI Playwright policy: OPTION A — run 101 Playwright tests in GitHub Actions against a LOCAL Next.js process and positively verified TEST database.**

Rationale:
- The existing E2E infrastructure (WP-005) is designed for LOCAL app + TEST DB. It spawns `next start --port 3100` with a curated child env (no inherited parent DATABASE_URL). This works identically inside a GitHub Actions runner.
- No Vercel E2E, no Preview E2E (per quota-safety).
- The runner uses the existing `resolveAuthorizedE2EBaseUrl()` + `certifyTestTarget()` — the same fail-closed guards that work locally.
- Chromium-only (per WP-005); Playwright installs only Chromium in CI.
- TEST_DATABASE_URL + E2E_EXPECTED_TEST_DATABASE_HOST supplied as GitHub Actions secrets (NOT committed).
- Single worker, 0 retries (per WP-005 config).
- Fixture cleanup: E2E_ title marker, exact UUID deletion, orphan recovery (per WP-005).
- Bootstrap: CI runs `pnpm db:bootstrap` with DATABASE_URL=TEST_DATABASE_URL (idempotent — creates admin1/fantomas only if missing).
- Mutation accounting: TEST_MUTATED=YES (fixtures + rateLimit cleanup + idempotent bootstrap); DEV_MUTATED=NO; PRODUCTION_TOUCHED=NO.

**CI Database target: existing Neon TEST branch (NOT a generic PostgreSQL service container).**

Rationale:
- The application uses `drizzle-orm/neon-http` (ADR-0002, TD-030). A generic PostgreSQL service container may NOT be driver-compatible (the `neon-http` driver uses HTTP API, not a TCP connection pool). A Neon-compatible TEST/CI resource is the current natural option.
- Any alternate PostgreSQL runtime requires explicit technical compatibility validation during S10.
- S9 does NOT prescribe a generic PostgreSQL service container.
- The existing TEST_DATABASE_URL (Neon test branch `ep-gentle-rice-b1vxvfsf`) is the canonical CI test database target. It is already used by local Vitest integration tests and Playwright E2E.

### 5.3 GitHub Actions Workflow Design

**Minimum number of workflows: ONE** — `.github/workflows/ci.yml`.

Rationale: avoid workflow proliferation. A single workflow with conditional jobs based on event type (PR vs push to main) is simpler and more maintainable.

**Triggers:**
- `on: pull_request` (targets: dev) — runs lint + typecheck + Vitest + build
- `on: push: branches: [main]` — runs lint + typecheck + Vitest + build + Playwright E2E
- `on: workflow_dispatch` — manual trigger (for debugging; same gates as push to main)

**Branches:**
- PRs target `dev` (the canonical development integration branch)
- Pushes to `main` trigger the full gate including E2E
- wp/* branches do NOT trigger CI directly (PRs from wp/* to dev trigger CI)

**PR E2E opt-in:**
- E2E job conditional on `github.event.pull_request.label.name == 'run-e2e'` (per S6 TD-025)
- Default: E2E NOT run on PRs (cost control)
- E2E always run on push to `main`

**Permissions:**
- `permissions: contents: read` (minimal — only read the repository)
- No `write` permissions (no auto-deployment, no auto-merge)
- No `pull-requests: write` (no auto-comment)

**Concurrency:**
- `concurrency: group: ci-${{ github.ref }}, cancel-in-progress: true` — cancel superseded runs on the same branch

**Timeouts:**
- Job-level: lint 5 min, typecheck 5 min, Vitest 10 min, build 10 min, E2E 15 min
- Workflow-level: 30 min total (prevent runaway)

**Retry policy:**
- 0 retries (no flake masking; consistent with WP-005 Playwright config)
- If a gate fails, the developer fixes the root cause

**Secret boundaries:**
- GitHub Actions secrets: TEST_DATABASE_URL, E2E_EXPECTED_TEST_DATABASE_HOST, BETTER_AUTH_SECRET, BETTER_AUTH_URL (TEST-specific), INITIAL_ADMIN_PASSWORD, FANTOMAS_INITIAL_PASSWORD, INITIAL_ADMIN_EMAIL, FANTOMAS_EMAIL
- NO PRODUCTION secrets in GitHub Actions (PROD_DATABASE_URL, production BETTER_AUTH_SECRET, production passwords — NEVER in CI)
- Secrets are NOT printed, NOT logged, NOT committed

### 5.4 Vercel Architecture

**Vercel project required: YES** (per S8 MS-006 + TD-019 + Charter §10).

**Vercel-GitHub integration:**
- Vercel project linked to the GitHub repository `alexkanga/jourdain`
- Framework preset: Next.js (auto-detected)
- Build command: `pnpm build`
- Output directory: `.next` (auto-detected)
- Install command: `pnpm install --frozen-lockfile`

**Neon-Vercel integration:**
- Neon project connected to Vercel via Neon-Vercel integration
- Neon main branch = Production
- Neon preview branches auto-provisioned per PR (one per Vercel Preview deployment, ephemeral, deleted when Preview is deleted)

**Branch-to-deployment mapping:**

| Git Branch | Vercel Environment | Neon Branch | Auto-Deploy? |
|---|---|---|---|
| `wp/*` (work branches) | NO Vercel deployment | NO Neon branch | NO — wp/* do NOT get Vercel Preview by default |
| `dev` | Preview (controlled) | Neon preview branch (or DEV Neon branch) | LIMITED — Preview enabled if justified; NOT an automated test target |
| `main` | Production candidate | Neon main branch | Production deployment ONLY under explicit OWNER PROD GO (S13) |

**Preview policy (quota-safe, frozen):**
- `wp/*` branches: NO automatic Vercel Preview. This prevents unbounded Preview deployments for every work branch. Work branches are verified via LOCAL CI (lint + typecheck + Vitest + build + optional E2E), NOT via Vercel Preview.
- `dev` branch: LIMITED Preview — a Preview deployment is created when a PR merges to `dev`, but it is NOT an automated test target. It is for manual human review only.
- `main` branch: Production mapping — Vercel Production environment is configured (env vars set) but NOT deployed until OWNER PROD GO.

**Vercel Hobby quota protections (frozen):**
- NO full Playwright against Vercel (Preview or Production)
- NO automated E2E loops against Preview
- NO automated E2E against Production
- NO load testing against Vercel
- NO synthetic monitoring loops
- NO polling loops
- NO cron loops
- NO recursive deployments
- NO unbounded retries
- NO unnecessary wp/* Preview deployments
- NO duplicate Preview deployments
- NO duplicate CI executions (concurrency group with cancel-in-progress)

### 5.5 Remote Smoke Policy

**Remote smoke verification: NOT implemented in WP-006.**

If remote smoke is proposed in the future, it must be:
- small (1-5 read-only requests)
- read-only where possible (GET /, GET /admin/login, GET /sitemap.xml, GET /robots.txt)
- bounded (max 10 requests total)
- non-looping (single execution, not periodic)
- quota-conscious (clearly under Vercel Hobby limits)
- explicitly separated from the 101-test Playwright suite
- explicitly authorized by OWNER per-run

**No remote smoke execution during S9 or S10.**

### 5.6 Remote E2E Policy

**Remote E2E: FORBIDDEN by default.**

Per AISE S0 v0.2 §26 + WP-005 §5.6:
- No Vercel Preview E2E
- No Vercel Production E2E
- No remote automated E2E of any kind by default
- Remote override requires: E2E_ALLOW_REMOTE=1 + E2E_REMOTE_BASE_URL + E2E_REMOTE_AUTHORIZATION_REF (all three, non-secret reference to OWNER authorization)
- Remote override is NOT exercised during WP-006 S10

### 5.7 Environment Variable Inventory

| Variable Name | LOCAL | TEST | DEV-INTEGRATION | PREVIEW | PRODUCTION | Classification |
|---|---|---|---|---|---|---|
| `DATABASE_URL` | = TEST_DATABASE_URL (or local) | = TEST_DATABASE_URL | = DEV_DATABASE_URL | Neon preview branch URL | Neon main branch URL (PROD_DATABASE_URL) | SECRET (server-only) |
| `DEV_DATABASE_URL` | YES (local dev) | NO | YES (the target) | NO | NO | SECRET (server-only) |
| `TEST_DATABASE_URL` | YES (E2E + integration) | YES (the target) | NO | NO | NO | SECRET (server-only) |
| `PROD_DATABASE_URL` | NO (never in local .env) | NO | NO | NO | YES (the target, aliased as DATABASE_URL) | SECRET (server-only) |
| `BETTER_AUTH_SECRET` | YES | YES (TEST-specific) | YES (DEV-specific) | YES (Preview-specific) | YES (Production-specific) | SECRET (server-only) |
| `BETTER_AUTH_URL` | `http://127.0.0.1:3100` (E2E) or `http://localhost:3000` (dev) | `http://127.0.0.1:3100` (CI) | DEV origin URL | Preview origin URL (e.g., `https://jourdain-*.vercel.app`) | Production origin URL (e.g., `https://jourdain.example.com`) | NON-SECRET (server-only, but not sensitive) |
| `INITIAL_ADMIN_LOGIN` | `admin1` | `admin1` | `admin1` | `admin1` | `admin1` | NON-SECRET (bootstrap-only) |
| `INITIAL_ADMIN_PASSWORD` | YES (local) | YES (TEST-specific, can be a known test value) | YES (DEV-specific) | YES (Preview-specific, can be a known test value) | YES (Production-specific, strong secret, rotated after first deploy) | SECRET (bootstrap-only) |
| `INITIAL_ADMIN_EMAIL` | `admin1@jourdain.local` | `admin1@jourdain.local` | `admin1@jourdain.local` | `admin1@jourdain.local` | `admin1@jourdain.local` (or production email) | NON-SECRET (bootstrap-only) |
| `FANTOMAS_INITIAL_PASSWORD` | YES (local) | YES (TEST-specific) | YES (DEV-specific) | YES (Preview-specific) | YES (Production-specific, strong secret, rotated after first deploy) | SECRET (bootstrap-only) |
| `FANTOMAS_EMAIL` | `fantomas@jourdain.local` | `fantomas@jourdain.local` | `fantomas@jourdain.local` | `fantomas@jourdain.local` | `fantomas@jourdain.local` (or production email) | NON-SECRET (bootstrap-only) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `http://127.0.0.1:3100` (CI) | DEV origin URL | Preview origin URL | Production origin URL | PUBLIC |
| `E2E_EXPECTED_TEST_DATABASE_HOST` | YES (local .env.local) | YES (CI secret) | NO | NO | NO | NON-SECRET (E2E-only, identifies DB host not credentials) |
| `E2E_BASE_URL` | optional (defaults to `http://127.0.0.1:3100`) | optional (CI defaults to `http://127.0.0.1:3100`) | NO | NO | NO | NON-SECRET (E2E-only, must be loopback) |
| `E2E_ALLOW_REMOTE` | NO (default absent) | NO (default absent) | NO | NO | NO | NON-SECRET (E2E-only, override flag) |
| `E2E_REMOTE_BASE_URL` | NO (default absent) | NO (default absent) | NO | NO | NO | NON-SECRET (E2E-only, override target) |
| `E2E_REMOTE_AUTHORIZATION_REF` | NO (default absent) | NO (default absent) | NO | NO | NO | NON-SECRET (E2E-only, authorization reference) |

**Rules:**
- Only variable NAMES belong in the S9 contract. No values are committed.
- `.env.example` documents variable names and their purpose (NON-AUTHORITATIVE — per WP-005 §4, it documents, it does not authorize).
- `.env.local` holds developer's local values (gitignored, NOT committed).
- GitHub Actions secrets hold TEST_DATABASE_URL, E2E_EXPECTED_TEST_DATABASE_HOST, BETTER_AUTH_SECRET, BETTER_AUTH_URL, INITIAL_ADMIN_PASSWORD, FANTOMAS_INITIAL_PASSWORD.
- Vercel environment variables hold Production + Preview values (per Vercel environment).
- Neon connection configuration holds the actual database URLs in the Neon dashboard.

### 5.8 Better Auth Environment Policy

**`BETTER_AUTH_URL` must always match the actual runtime origin.**

| Environment | BETTER_AUTH_URL |
|---|---|
| LOCAL (dev) | `http://localhost:3000` |
| LOCAL (E2E) | `http://127.0.0.1:3100` (E2E runner passes resolved baseUrl to buildChildEnv) |
| TEST (CI) | `http://127.0.0.1:3100` (CI spawns local Next.js on port 3100) |
| DEV-INTEGRATION | DEV origin URL (e.g., `https://dev.jourdain.example.com` or Neon dev branch Vercel URL) |
| PREVIEW | Preview origin URL (e.g., `https://jourdain-pr-*.vercel.app`) |
| PRODUCTION | Production origin URL (e.g., `https://jourdain.example.com`) |

**Never use `localhost` URL in remote deployment.** Better Auth rejects requests from mismatched origins (verified during WP-005 S10 remediation — the "Invalid origin" error when BETTER_AUTH_URL was `http://127.0.0.1:3000` but the server ran on `http://127.0.0.1:3100`).

**No authentication redesign.** Better Auth config (`lib/server/auth/auth.ts`) remains unchanged. The `baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000"` line is preserved; the environment variable is set per deployment environment.

**Bootstrap credentials must not be exposed unnecessarily after bootstrap.** The bootstrap variables (INITIAL_ADMIN_PASSWORD, FANTOMAS_INITIAL_PASSWORD) are used only during the first deploy per environment. After bootstrap, they can be removed from the environment (the users already exist in the DB). The contract documents this but does NOT enforce automatic removal.

### 5.9 Database Environment Policy

| Environment | Neon Branch | Variable | Purpose |
|---|---|---|---|
| PRODUCTION | Neon main branch | PROD_DATABASE_URL (aliased as DATABASE_URL in Vercel Production env) | Production data — NEVER touched by Preview, local, or CI |
| PREVIEW | Neon preview branch (auto-provisioned per PR) | DATABASE_URL in Vercel Preview env | Preview data — isolated per PR, ephemeral |
| DEV-INTEGRATION | Neon dev branch | DEV_DATABASE_URL | Shared development DB for manual browsing (optional) |
| TEST | Neon test branch (`ep-gentle-rice-b1vxvfsf`) | TEST_DATABASE_URL | Automated test target (Vitest integration + Playwright E2E) |
| LOCAL | Developer's local Neon branch OR TEST_DATABASE_URL | DATABASE_URL (runtime alias) | Developer workstation |

**No Neon changes during S9.** The existing Neon branches (main, dev, test) are sufficient. The Neon-Vercel integration auto-provisions preview branches per PR during S10 (when Vercel is configured).

**Preview database safety:** Preview must NEVER use Production database. Vercel env var isolation enforces this: Preview `DATABASE_URL` = Neon preview branch URL, NOT Neon main branch URL. The Neon-Vercel integration auto-provisions isolated preview branches.

**No one Neon branch per WP.** Work branches (`wp/*`) do NOT get Vercel Preview deployments (per §5.4). No Neon preview branch is created for wp/* branches.

### 5.10 Migration Policy

**Migration governance:**

| Environment | Migration Execution | Who | How |
|---|---|---|---|
| TEST | Automatic (CI runs `pnpm db:migrate` with DATABASE_URL=TEST_DATABASE_URL before Vitest integration tests) | CI (GitHub Actions) | `drizzle-kit migrate` (forward migrations only; versioned) |
| DEV | Manual (operator runs `pnpm db:migrate` with DATABASE_URL=DEV_DATABASE_URL) | Operator | `drizzle-kit migrate` (forward migrations only; versioned) |
| PREVIEW | Automatic (Vercel Preview build runs migrations against the Neon preview branch) OR manual | Vercel build OR operator | `drizzle-kit migrate` (forward migrations only; versioned) |
| PRODUCTION | Manual + OWNER-authorized ONLY | Operator (after OWNER PROD GO) | `drizzle-kit migrate` (forward migrations only; versioned; NEVER `drizzle-kit push`) |

**Rules:**
- Migrations are generated (`pnpm db:generate`), versioned (committed to `db/migrations/`), and reviewed (PR review).
- CI validates migrations: `pnpm db:migrate` against TEST_DATABASE_URL (dry-run or actual apply; the integration tests depend on the schema being current).
- CI does NOT apply migrations to DEV or PRODUCTION.
- Vercel Preview build MAY apply migrations to the Neon preview branch (per Vercel build command configuration — S10 decides).
- Production migrations: applied manually by the operator after OWNER PROD GO. NEVER automatic. NEVER `drizzle-kit push` against Production (per TD-018).
- No silent Production migration.

### 5.11 Bootstrap Policy

**Bootstrap governance:**

| Environment | Bootstrap Execution | Who | When | Frequency |
|---|---|---|---|---|
| TEST | Automatic (CI runs `pnpm db:bootstrap` with DATABASE_URL=TEST_DATABASE_URL before E2E) | CI (GitHub Actions) | Every CI run (E2E job) | Idempotent — creates admin1/fantomas only if missing; does NOT overwrite existing credentials |
| DEV | Manual (operator runs `pnpm db:bootstrap` with DATABASE_URL=DEV_DATABASE_URL) | Operator | Once after first DEV migration | Idempotent |
| PREVIEW | Automatic (Vercel Preview build runs `pnpm db:bootstrap`) OR manual | Vercel build OR operator | Once after first Preview migration | Idempotent |
| PRODUCTION | Manual + OWNER-authorized ONLY | Operator (after OWNER PROD GO + first production deploy) | Once after first production deploy | Idempotent — creates admin1/fantomas only if missing |

**Rules:**
- Bootstrap is idempotent (verified at WP-002 closure). Running it multiple times does NOT overwrite existing credentials or principalType.
- Bootstrap credentials (INITIAL_ADMIN_PASSWORD, FANTOMAS_INITIAL_PASSWORD) are SECRET and environment-specific.
- After bootstrap, the bootstrap password variables can be removed from the environment (the users already exist).
- No bootstrap execution during S9.
- No second authentication implementation (Better Auth remains the authority; `auth.api.createUser()` handles password hashing).
- ADMIN principalType = ADMIN; FANTOMAS principalType = FANTOMAS; capability inheritance unchanged (per AISE §21).
- If remote DEV/Preview bootstrap is proposed during S10, the contract specifies: environment (DEV or Preview), frequency (once per environment), idempotence (yes), secret storage (Vercel env vars, NOT committed), authorization (OWNER must authorize each environment's bootstrap).

### 5.12 Production Boundary

**Production deployment requires: OWNER PROD GO.**

No S10/MS-006 action may silently deploy Production:
- No automatic Production deployment from any branch
- No Production DB mutation without OWNER PROD GO
- No Production migration without OWNER PROD GO
- No Production bootstrap without OWNER PROD GO

**Target verification (S0 §25):** The bootstrap script and any production-only code path MUST check `VERCEL_ENV === 'production'` AND `DATABASE_URL` host matches the production Neon hostname before any write. If target not verified → STOP, no write.

This is an implementation requirement for S10 (the bootstrap script and production-only code paths must include this check). S9 defines the contract; S10 implements it.

### 5.13 Secret Governance

**Where secrets may live:**

| Secret Type | LOCAL | CI (GitHub Actions) | Vercel Preview | Vercel Production |
|---|---|---|---|---|
| DATABASE_URL / *_DATABASE_URL | `.env.local` (gitignored) | GitHub Actions secrets | Vercel env vars (Preview) | Vercel env vars (Production) |
| BETTER_AUTH_SECRET | `.env.local` (gitignored) | GitHub Actions secrets | Vercel env vars (Preview) | Vercel env vars (Production) |
| INITIAL_ADMIN_PASSWORD | `.env.local` (gitignored) | GitHub Actions secrets | Vercel env vars (Preview) | Vercel env vars (Production) |
| FANTOMAS_INITIAL_PASSWORD | `.env.local` (gitignored) | GitHub Actions secrets | Vercel env vars (Preview) | Vercel env vars (Production) |
| E2E_EXPECTED_TEST_DATABASE_HOST | `.env.local` (gitignored) | GitHub Actions secrets | NO (not needed on Vercel) | NO (not needed on Vercel) |

**Never:**
- Commit secrets to the repository
- Print secrets to logs (CI logs, server logs, browser console)
- Store credentials in documentation (only variable NAMES)
- Use Production secrets in non-Production environments

**Only secret NAMES belong in the S9 contract.** No values are exposed.

### 5.14 Quota-Safety Matrix

| Activity | Execution Target | Cost Class | Remote Requests | DB Mutation | Vercel Invocations | Expected Frequency | Retry | Timeout |
|---|---|---|---|---|---|---|---|---|
| lint | GitHub Actions runner | LOCAL_UNMETERED | 0 | NO | 0 | Every PR + push to dev/main | 0 | 5 min |
| typecheck | GitHub Actions runner | LOCAL_UNMETERED | 0 | NO | 0 | Every PR + push to dev/main | 0 | 5 min |
| Vitest (149) | GitHub Actions runner | LOCAL_UNMETERED + CONTROLLED_TEST (integration) | 0 (local runner) | YES (TEST fixtures) | 0 | Every PR + push to dev/main | 0 | 10 min |
| build | GitHub Actions runner | LOCAL_UNMETERED | 0 | NO | 0 | Every PR + push to dev/main | 0 | 10 min |
| Playwright (101) | GitHub Actions runner (spawns local Next.js) | LOCAL_UNMETERED (app) + CONTROLLED_TEST (DB) | 0 (local runner) | YES (TEST fixtures + rateLimit + idempotent bootstrap) | 0 | Push to main + opt-in via label on PR | 0 | 15 min |
| Preview deployment | Vercel | REMOTE_METERED | 0 (Vercel-internal) | YES (Neon preview branch — migrations + bootstrap) | 1 (Vercel build + deploy) | PR merge to dev | 0 (no retry on deploy failure) | Vercel build timeout (default) |
| Production deployment | Vercel | REMOTE_QUOTA_LIMITED | 0 (Vercel-internal) | YES (Neon main — migrations + bootstrap — OWNER-authorized) | 1 (Vercel build + deploy) | OWNER PROD GO only | 0 | Vercel build timeout (default) |
| Remote smoke | NOT IMPLEMENTED in WP-006 | N/A | 0 | NO | 0 | N/A | N/A | N/A |
| Migration validation | GitHub Actions runner | LOCAL_UNMETERED | 0 | YES (TEST DB migrations) | 0 | Every CI run (Vitest integration tests require current schema) | 0 | Part of Vitest timeout |

### 5.15 Concurrency / Loop Safety

**Concurrency groups:**
- CI: `concurrency: group: ci-${{ github.ref }}, cancel-in-progress: true` — cancel superseded runs on the same branch
- No Vercel concurrency configuration needed (Vercel handles deployment concurrency internally)

**Cancel-in-progress:** YES for CI (avoid duplicate CI executions on rapid pushes to the same branch)

**Timeouts:**
- CI workflow: 30 min total
- CI jobs: 5-15 min per job (see §5.2)
- Vercel build: Vercel default (no override needed for V1)

**Maximum retry:** 0 (no retries; no flake masking; consistent with WP-005)

**Workflow recursion prevention:** GitHub Actions does not allow workflow recursion by default. No `repository_dispatch` or `workflow_run` triggers that could cause recursion.

**Duplicate deployment prevention:**
- wp/* branches: NO Vercel Preview (no deployment at all)
- dev branch: Vercel Preview per merge (one deployment per merge; Vercel handles deduplication)
- main branch: Production deployment per push (OWNER PROD GO required; no automatic deploy)

**Duplicate E2E prevention:**
- CI E2E job runs only on push to main or PR with `run-e2e` label
- Concurrency group ensures only one E2E run per branch at a time
- No separate E2E workflow (single `ci.yml` with conditional E2E job)

---

## 6. Out of Scope

### MS-007 / WP-007
- Release Readiness assessment (requirement-by-requirement verification)
- Critical E2E on Vercel Preview (15-step journey on Preview)
- SHOULD requirements verification
- S12 gate

### Production Deployment (S13)
- Production deployment execution (OWNER PROD GO required)
- Production migration execution (operator runs manually)
- Production bootstrap execution (operator runs after production deploy)

### Remote E2E
- No Vercel Preview E2E
- No Vercel Production E2E
- No remote automated E2E by default
- Remote override requires explicit OWNER authorization per-run (NOT exercised during WP-006)

### Remote Smoke
- NOT implemented in WP-006 (future, if justified and OWNER-authorized)

### Application Code Changes
- No product code modifications (app/, components/, lib/, db/, middleware.ts, next.config.ts)
- No auth changes (lib/server/auth/*)
- No DB schema changes / new migrations
- No new business features

### Domain/DNS
- No domain/DNS configuration (future, post-deploy)

### Neon Changes
- No new Neon branches during S9 (existing main/dev/test branches sufficient)
- No Neon branch per WP (wp/* branches do NOT get Vercel Preview → no Neon preview branch)

### Other
- No load testing, stress testing, synthetic monitoring, polling, cron (per S0 §23)
- No S12 (global release-readiness)
- No WP-007 implementation

---

## 7. OWNER Manual Actions

Every future manual OWNER step, with WHEN/WHERE/WHAT/SECRET classification and whether Agent Z needs the value:

| # | WHEN | WHERE | WHAT | SECRET? | Agent Z needs value? |
|---|---|---|---|---|---|
| 1 | S10 start | Vercel dashboard | Create/select Vercel project linked to `alexkanga/jourdain` GitHub repo | NO (project name is non-secret) | YES (project URL for verification) |
| 2 | S10 start | Vercel dashboard | Set framework preset to Next.js | NO | NO (auto-detected) |
| 3 | S10 start | Vercel dashboard | Configure build command: `pnpm build` | NO | NO (standard) |
| 4 | S10 start | Vercel dashboard | Configure install command: `pnpm install --frozen-lockfile` | NO | NO (standard) |
| 5 | S10 start | Vercel dashboard → Settings → Git | Disable auto-Preview for wp/* branches (or confirm wp/* do NOT trigger Preview) | NO | YES (confirm wp/* Preview is OFF) |
| 6 | S10 start | Vercel dashboard → Settings → Git | Configure dev branch → Preview deployment | NO | YES (confirm dev Preview is LIMITED) |
| 7 | S10 start | Vercel dashboard → Settings → Git | Configure main branch → Production deployment (but NOT auto-deploy — OWNER PROD GO required) | NO | YES (confirm main is Production candidate) |
| 8 | S10 start | Vercel dashboard → Environment Variables (Preview) | Add Preview env vars: DATABASE_URL (Neon preview branch URL), BETTER_AUTH_SECRET (Preview-specific), BETTER_AUTH_URL (Preview origin), INITIAL_ADMIN_PASSWORD (Preview-specific test value), FANTOMAS_INITIAL_PASSWORD (Preview-specific test value), NEXT_PUBLIC_SITE_URL (Preview origin) | YES (secrets) | NO (Agent Z does NOT need secret values; only confirms they are set) |
| 9 | S10 start | Vercel dashboard → Environment Variables (Production) | Add Production env vars: DATABASE_URL (Neon main branch URL = PROD_DATABASE_URL), BETTER_AUTH_SECRET (Production-specific strong secret), BETTER_AUTH_URL (Production origin), INITIAL_ADMIN_PASSWORD (Production strong secret, rotated after first deploy), FANTOMAS_INITIAL_PASSWORD (Production strong secret, rotated after first deploy), NEXT_PUBLIC_SITE_URL (Production origin) | YES (secrets) | NO (Agent Z does NOT need secret values; only confirms they are set) |
| 10 | S10 start | Neon dashboard | Confirm Neon project exists with main branch (Production), dev branch (development), test branch (TEST — `ep-gentle-rice-b1vxvfsf`) | NO (branch names are non-secret) | YES (confirm branch URLs/names) |
| 11 | S10 start | Neon dashboard → Integrations | Connect Neon to Vercel (Neon-Vercel integration auto-provisions preview branches per PR) | NO (integration config is non-secret) | YES (confirm integration is active) |
| 12 | S10 start | GitHub repo → Settings → Secrets and variables → Actions | Add GitHub Actions secrets: TEST_DATABASE_URL, E2E_EXPECTED_TEST_DATABASE_HOST, BETTER_AUTH_SECRET (TEST-specific), BETTER_AUTH_URL (TEST-specific = `http://127.0.0.1:3100`), INITIAL_ADMIN_PASSWORD (TEST-specific), INITIAL_ADMIN_LOGIN (`admin1`), INITIAL_ADMIN_EMAIL (`admin1@jourdain.local`), FANTOMAS_INITIAL_PASSWORD (TEST-specific), FANTOMAS_EMAIL (`fantomas@jourdain.local`) | YES (secrets) | NO (Agent Z does NOT need secret values; only confirms they are set) |
| 13 | S10 start | GitHub repo → Settings → Branches | Confirm branch protection: `main` = release (PR + review required); `dev` = development integration (PR + review required) | NO | YES (confirm branch protection rules) |
| 14 | Post-S10 (S11) | Vercel dashboard → Deployments | Verify a PR merge to dev creates a working Vercel Preview deployment | NO | YES (confirm Preview works) |
| 15 | Post-S10 (S11) | GitHub Actions | Verify CI runs on PR: lint + typecheck + Vitest + build PASS; E2E on push to main or `run-e2e` label PASS | NO | YES (confirm CI works) |
| 16 | Future (S13) | Vercel dashboard → Deployments | OWNER PROD GO: trigger Production deployment from `main` branch | NO (authorization is non-secret) | YES (confirm Production deployment) |
| 17 | Future (S13) | Operator terminal | Run `pnpm db:migrate` with DATABASE_URL=PROD_DATABASE_URL (Production migration — manual, OWNER-authorized) | YES (PROD_DATABASE_URL) | NO (operator runs manually; Agent Z does NOT need Production secret values) |
| 18 | Future (S13) | Operator terminal | Run `pnpm db:bootstrap` with DATABASE_URL=PROD_DATABASE_URL + Production credential env vars (Production bootstrap — manual, OWNER-authorized, idempotent) | YES (Production secrets) | NO (operator runs manually; Agent Z does NOT need Production secret values) |
| 19 | Future (S13, optional) | DNS provider + Vercel dashboard | Configure custom domain (if applicable) + DNS records | NO (domain name is non-secret) | YES (confirm domain resolves) |

**Do NOT perform these steps during S9.** S9 is contract design only.

---

## 8. Intended Behavior

### 8.1 CI Workflow (ci.yml) — Conceptual

```yaml
name: CI
on:
  pull_request:
    branches: [dev]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - checkout
      - setup pnpm
      - pnpm install --frozen-lockfile
      - pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - checkout
      - setup pnpm
      - pnpm install --frozen-lockfile
      - pnpm typecheck

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
      DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      E2E_EXPECTED_TEST_DATABASE_HOST: ${{ secrets.E2E_EXPECTED_TEST_DATABASE_HOST }}
      BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
      INITIAL_ADMIN_LOGIN: admin1
      INITIAL_ADMIN_PASSWORD: ${{ secrets.INITIAL_ADMIN_PASSWORD }}
      INITIAL_ADMIN_EMAIL: admin1@jourdain.local
      FANTOMAS_INITIAL_PASSWORD: ${{ secrets.FANTOMAS_INITIAL_PASSWORD }}
      FANTOMAS_EMAIL: fantomas@jourdain.local
    steps:
      - checkout
      - setup pnpm
      - pnpm install --frozen-lockfile
      - pnpm db:migrate  # apply migrations to TEST
      - pnpm test  # Vitest (149 tests)

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - checkout
      - setup pnpm
      - pnpm install --frozen-lockfile
      - pnpm build

  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    if: github.event_name == 'push' || contains(github.event.pull_request.labels.*.name, 'run-e2e')
    env:
      DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      E2E_EXPECTED_TEST_DATABASE_HOST: ${{ secrets.E2E_EXPECTED_TEST_DATABASE_HOST }}
      BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
      BETTER_AUTH_URL: http://127.0.0.1:3100
      INITIAL_ADMIN_LOGIN: admin1
      INITIAL_ADMIN_PASSWORD: ${{ secrets.INITIAL_ADMIN_PASSWORD }}
      INITIAL_ADMIN_EMAIL: admin1@jourdain.local
      FANTOMAS_INITIAL_PASSWORD: ${{ secrets.FANTOMAS_INITIAL_PASSWORD }}
      FANTOMAS_EMAIL: fantomas@jourdain.local
    steps:
      - checkout
      - setup pnpm
      - pnpm install --frozen-lockfile
      - pnpm exec playwright install --with-deps chromium
      - pnpm build
      - pnpm test:e2e
```

**This is CONCEPTUAL — S10 implements the actual workflow.** The contract defines the structure; S10 may adjust details (e.g., caching, pnpm setup action version, exact step ordering) but MUST preserve the gates, triggers, permissions, concurrency, timeouts, and secrets defined here.

### 8.2 Vercel Configuration — Conceptual

**No `vercel.json` implementation during S9.** S10 may create a minimal `vercel.json` if needed (e.g., for framework preset, build command, or SPA routing). The contract does NOT prescribe a specific `vercel.json` content — S10 decides based on Vercel's auto-detection and the project's needs.

**Vercel environment variables are configured in the Vercel dashboard** (not in `vercel.json`). Per-environment (Production, Preview) variable sets are defined in §5.7.

### 8.3 Target Verification — Conceptual

The bootstrap script (`db/bootstrap/bootstrap.ts`) and any production-only code path MUST check:
1. `process.env.VERCEL_ENV === 'production'` (Vercel sets this automatically)
2. `DATABASE_URL` host matches the production Neon hostname
3. If target not verified → STOP, no write

This is an implementation requirement for S10. S9 defines the contract; S10 implements the check.

---

## 9. Acceptance Criteria

The following numbered acceptance criteria MUST all be met for S11 to PASS:

### Environment Separation & Secrets

| AC ID | Criterion |
|---|---|
| AC-001 | Environment separation is explicit: LOCAL / TEST / DEV-INTEGRATION / PREVIEW / PRODUCTION defined with distinct DATABASE_URL per environment |
| AC-002 | Secrets are NOT committed to the repository (verified via CI lint or grep check) |
| AC-003 | `.env.local` is gitignored (verified) |
| AC-004 | `.env.example` documents variable names only (no values) |
| AC-005 | GitHub Actions secrets are used for CI (TEST_DATABASE_URL, E2E_EXPECTED_TEST_DATABASE_HOST, BETTER_AUTH_SECRET, etc.) |
| AC-006 | Vercel environment variables are configured per environment (Production + Preview) |
| AC-007 | No Production secrets in GitHub Actions (PROD_DATABASE_URL, production BETTER_AUTH_SECRET — NEVER in CI) |

### CI

| AC ID | Criterion |
|---|---|
| AC-010 | `.github/workflows/ci.yml` exists with triggers: pull_request to dev + push to main + workflow_dispatch |
| AC-011 | CI runs lint on every PR + push to dev/main |
| AC-012 | CI runs typecheck on every PR + push to dev/main |
| AC-013 | CI runs Vitest (149 tests) on every PR + push to dev/main, using TEST_DATABASE_URL |
| AC-014 | CI runs build on every PR + push to dev/main |
| AC-015 | CI runs Playwright E2E (101 tests) on push to main + opt-in via `run-e2e` label on PR |
| AC-016 | CI permissions are minimal: `contents: read` only |
| AC-017 | CI concurrency group with cancel-in-progress prevents duplicate executions |
| AC-018 | CI timeouts are set per job (5-15 min) and per workflow (30 min) |
| AC-019 | CI retry policy: 0 retries (no flake masking) |
| AC-020 | CI E2E uses LOCAL Next.js process (spawns `next start` inside the runner) + TEST database — NOT Vercel |
| AC-021 | CI E2E uses the canonical `resolveAuthorizedE2EBaseUrl()` + `certifyTestTarget()` from WP-005 (fail-closed guards) |
| AC-022 | CI applies migrations to TEST (`pnpm db:migrate` with TEST_DATABASE_URL) before Vitest integration tests |
| AC-023 | CI runs idempotent bootstrap (`pnpm db:bootstrap` with TEST_DATABASE_URL) before E2E |
| AC-024 | CI does NOT deploy to Vercel (no `vercel deploy` command in CI) |
| AC-025 | CI does NOT touch Production (no PROD_DATABASE_URL in CI secrets) |

### Vercel & Deployment

| AC ID | Criterion |
|---|---|
| AC-030 | Vercel project is linked to the GitHub repository |
| AC-031 | Vercel framework preset is Next.js |
| AC-032 | Vercel build command is `pnpm build` |
| AC-033 | Vercel install command is `pnpm install --frozen-lockfile` |
| AC-034 | wp/* branches do NOT get Vercel Preview deployments (quota-safe: no auto-Preview for work branches) |
| AC-035 | dev branch gets Vercel Preview deployment (LIMITED — for manual human review only; NOT an automated test target) |
| AC-036 | main branch is Production candidate (Production environment configured but NOT deployed until OWNER PROD GO) |
| AC-037 | Neon-Vercel integration is active (auto-provisions preview branches per PR) |
| AC-038 | Preview DATABASE_URL = Neon preview branch (NOT Neon main / Production) |
| AC-039 | Production DATABASE_URL = Neon main branch (PROD_DATABASE_URL) |
| AC-040 | Production deployment requires OWNER PROD GO (no automatic Production deployment from any branch) |
| AC-041 | No Vercel E2E (no Playwright against Vercel Preview or Production) |
| AC-042 | No automated E2E loops against Preview or Production |
| AC-043 | No load testing, synthetic monitoring, polling, or cron loops against Vercel |

### Better Auth & Environment

| AC ID | Criterion |
|---|---|
| AC-050 | BETTER_AUTH_URL matches the actual runtime origin per environment (LOCAL/TEST/DEV/PREVIEW/PRODUCTION) |
| AC-051 | BETTER_AUTH_URL never uses `localhost` in remote deployment (Preview or Production) |
| AC-052 | No authentication redesign (lib/server/auth/auth.ts unchanged — only env var values change per environment) |
| AC-053 | ADMIN principalType = ADMIN; FANTOMAS principalType = FANTOMAS (unchanged) |
| AC-054 | Bootstrap is idempotent (verified at WP-002; confirmed in CI) |
| AC-055 | Bootstrap credentials are environment-specific (different values for TEST/DEV/Preview/Production) |

### Migrations & Production Safety

| AC ID | Criterion |
|---|---|
| AC-060 | CI applies migrations to TEST (`pnpm db:migrate` with TEST_DATABASE_URL) |
| AC-061 | CI does NOT apply migrations to DEV or PRODUCTION |
| AC-062 | Vercel Preview build MAY apply migrations to the Neon preview branch (S10 decision) |
| AC-063 | Production migrations: manual + OWNER-authorized ONLY (never automatic, never `drizzle-kit push`) |
| AC-064 | No silent Production migration |
| AC-065 | Target verification: bootstrap script + production-only code paths check VERCEL_ENV + DATABASE_URL host before any write |

### Test Suite Preservation

| AC ID | Criterion |
|---|---|
| AC-070 | Existing 149 Vitest tests remain valid (CI passes them) |
| AC-071 | Existing 101 Playwright tests remain valid (CI E2E passes them) |
| AC-072 | Vitest and Playwright remain separate commands (`pnpm test` ≠ `pnpm test:e2e`) |
| AC-073 | Vitest config excludes tests/e2e/ (per WP-005 — preserved) |
| AC-074 | Playwright config uses the canonical resolver (per WP-005 — preserved) |
| AC-075 | Playwright uses Chromium only, single worker, 0 retries (per WP-005 — preserved) |

### Branch Governance

| AC ID | Criterion |
|---|---|
| AC-080 | main = release / future Production (untouched by CI deploy; OWNER PROD GO required) |
| AC-081 | dev = canonical development integration (PRs target dev; dev gets Vercel Preview) |
| AC-082 | wp/* = isolated implementation branches (NO Vercel Preview; CI via PRs to dev) |
| AC-083 | Direct development on main remains DISALLOWED |
| AC-084 | dev was NOT merged into main during WP-006 |

### Quota-Safety

| AC ID | Criterion |
|---|---|
| AC-090 | No remote E2E by default (per WP-005 §5.6 — preserved) |
| AC-091 | No remote smoke (not implemented in WP-006) |
| AC-092 | No unbounded retries (0 retries in CI + Playwright) |
| AC-093 | No loops, no polling, no cron (per S0 §23) |
| AC-094 | No duplicate CI executions (concurrency group with cancel-in-progress) |
| AC-095 | No duplicate Preview deployments (wp/* do NOT get Preview) |
| AC-096 | No unnecessary wp/* Preview deployments (quota-safe) |

### Production Boundary

| AC ID | Criterion |
|---|---|
| AC-100 | OWNER PROD GO remains mandatory for Production deployment |
| AC-101 | No S10/MS-006 action silently deploys Production |
| AC-102 | No Production DB mutation without OWNER PROD GO |
| AC-103 | No Production migration without OWNER PROD GO |
| AC-104 | No Production bootstrap without OWNER PROD GO |

---

## 10. S11 Verification Plan

S11 for WP-006 must independently verify the INFRASTRUCTURE itself:

| Category | Verification |
|---|---|
| CI runs on PR | Open a PR to dev → CI runs lint + typecheck + Vitest + build → all PASS |
| CI runs E2E on main | Push to main (or label PR with `run-e2e`) → CI runs 101 Playwright tests → all PASS |
| CI permissions minimal | Verify `.github/workflows/ci.yml` has `permissions: contents: read` only |
| CI concurrency | Verify concurrency group with cancel-in-progress |
| CI timeouts | Verify per-job + per-workflow timeouts |
| CI secrets | Verify GitHub Actions secrets are set (TEST_DATABASE_URL, E2E_EXPECTED_TEST_DATABASE_HOST, etc.) — values NOT inspected |
| Vercel Preview | PR merge to dev creates a working Vercel Preview deployment (app renders) |
| Vercel wp/* no-Preview | Verify wp/* branches do NOT create Vercel Preview deployments |
| Vercel Production | Verify Production env vars are set but NOT deployed (OWNER PROD GO not yet given) |
| Neon isolation | Verify Preview DATABASE_URL != Production DATABASE_URL (host comparison) |
| Better Auth URL | Verify BETTER_AUTH_URL matches the Preview origin (not localhost) |
| Migrations on TEST | Verify CI applies migrations to TEST (migrations succeed) |
| No Production mutation | Verify no CI step touches Production DB (no PROD_DATABASE_URL in CI secrets) |
| Existing tests preserved | 149 Vitest + 101 Playwright still PASS in CI |
| Target verification | Verify bootstrap script checks VERCEL_ENV + DATABASE_URL host before any write (if implemented) |
| No remote E2E | Verify no Playwright against Vercel Preview or Production |
| No loops | Verify no cron, no polling, no retry loops in CI |

---

## 11. MS-006 / MS-007 Boundary

**What belongs to MS-006 (this WP):**
- Vercel project configuration + GitHub link
- Neon-Vercel integration (auto-provisioned preview branches)
- GitHub Actions CI workflow (lint, typecheck, Vitest, build, E2E)
- Environment variables (Production + Preview + CI secrets)
- Migration governance (TEST auto; Preview optional; Production manual + OWNER-authorized)
- Bootstrap governance (TEST auto; Preview optional; Production manual + OWNER-authorized)
- Target verification (VERCEL_ENV + DATABASE_URL host check before Production writes)
- .env.local safeguard (developer's local DATABASE_URL must not point to production — CI check or documentation)
- Preview deployment: a PR merge creates a working Vercel Preview deployment
- Production environment configured (env vars set) but NOT deployed

**What remains for MS-007 (Release Readiness):**
- Requirement-by-requirement verification (all MUST requirements verified PASS)
- SHOULD requirements (included or explicitly deferred with OWNER approval)
- Critical E2E on Vercel Preview (15-step journey on Preview with real Neon preview branch)
- Auth verification on Preview (ADMIN login, Fantomas login, principalType, capabilities, no public signup)
- Production/Preview isolation verified (no Preview writes to Production DB)
- Build PASS
- No critical blockers identified
- Release readiness summary → handoff to S12

**WP-006 does NOT absorb MS-007.** MS-007 remains the next separate milestone.

---

## 12. S12 Boundary

S12 is global Release Readiness. Do NOT execute or claim S12 in WP-006.

---

## 13. Expected S10 Implementation Surface

Files that future S10 MAY create/modify (only if contract justifies them):

| File | Action | Justification |
|---|---|---|
| `.github/workflows/ci.yml` | CREATED | CI workflow (lint + typecheck + Vitest + build + E2E) |
| `vercel.json` | CREATED (optional) | Vercel project configuration (framework preset, build command, install command — if not auto-detected) |
| `docs/deployment/DEPLOYMENT.md` | CREATED | Deployment documentation (migration workflow, bootstrap workflow, target verification) |
| `docs/deployment/ENVIRONMENTS.md` | CREATED | Environment variable documentation (per environment) |
| `package.json` | MODIFIED (optional) | Add `db:migrate:test` script if needed (CI-specific migration to TEST) |
| `db/bootstrap/bootstrap.ts` | MODIFIED (optional) | Add target verification check (VERCEL_ENV + DATABASE_URL host before any write) — ONLY if not already present |

**Forbidden S10 surface:**
- Product application code (app/, components/, lib/) — UNCHANGED
- DB schema (db/schema.ts) — UNCHANGED
- DB migrations (db/migrations/) — UNCHANGED (no new migration)
- Better Auth config (lib/server/auth/auth.ts) — UNCHANGED
- Existing tests (__tests__/, tests/e2e/) — UNCHANGED
- Playwright config (playwright.config.ts) — UNCHANGED
- Vitest config (vitest.config.ts) — UNCHANGED

---

## 14. Stop Conditions

STOP and report before proceeding if implementation requires:
- Product application changes (outside the authorized S10 surface)
- DB schema changes or new migrations
- Better Auth architecture changes
- principalType changes
- Offer lifecycle changes
- New browser framework or engine (Playwright Chromium-only is frozen)
- Remote E2E execution (FORBIDDEN by default)
- Vercel deployment without OWNER PROD GO (for Production)
- CI workflow that touches Production DB
- AISE governance modification
- Any change to existing 149 Vitest tests or 101 Playwright tests

Use: `CONTRACT DIVERGENCE DETECTED` or specific gap classification.

---

## 15. Rollback / Failure Model

| Failure | Response |
|---|---|
| CI fails on PR | Developer fixes the root cause (lint error, type error, test failure, build failure). No retry. |
| CI E2E fails on main | Developer investigates (the E2E infrastructure is from WP-005; failures are real product or infrastructure defects). No retry. |
| Vercel Preview deployment fails | Operator checks Vercel build logs. Common causes: missing env vars, build error, Neon preview branch not provisioned. Fix and re-deploy. |
| Neon-Vercel integration latency | Preview deployment may take longer than expected. Wait. If persistent, check Neon-Vercel integration status. |
| Migration fails on TEST | Operator investigates the migration SQL. Fix the migration, re-generate, re-apply. |
| Migration fails on Production | STOP. Operator investigates. Do NOT force. OWNER PROD GO was given but the migration itself failed — escalate to OWNER. |
| Bootstrap fails | Operator checks env vars (DATABASE_URL, credential variables). Bootstrap is idempotent — re-run after fixing env vars. |
| Production deployment accidentally triggered | STOP immediately. Vercel Production deployment without OWNER PROD GO is a CRITICAL governance violation. Rollback via Vercel dashboard ("Redeploy" previous Production deployment). Investigate root cause. Report to OWNER. |

---

## 16. Future S10 Branch

**Planned branch:** `wp/006-environments-cicd`

**Branch rule (semantic — per recursive SHA-update loop avoidance rule):**
S10 MUST branch from the OWNER-approved current dev HEAD containing this final contract. The concrete SHA is recorded in the S9 closure report (NOT hardcoded in the contract itself).

After S11 PASS + OWNER ACCEPT + closure, S10 work is fast-forward merged to `dev` (per established convention: `git merge --ff-only wp/006-environments-cicd`). The work branch is RETAINED (not deleted), matching the convention established for WP-001 through WP-005.

---

## 17. S11 Expectations

S11 for WP-006 independently verifies:
- CI runs on PR (lint + typecheck + Vitest + build PASS)
- CI runs E2E on main (101 Playwright tests PASS)
- Vercel Preview works (PR merge to dev creates working Preview)
- wp/* do NOT get Vercel Preview
- Production env vars configured but NOT deployed
- Neon isolation (Preview ≠ Production)
- Better Auth URL matches Preview origin
- Migrations applied to TEST
- No Production mutation
- Existing 149 + 101 tests preserved
- No remote E2E, no loops, no unbounded retries

---

## 18. AISE Next Boundary

After WP-006 / MS-006 closure:
- NEXT ELIGIBLE UNIT: S9 WP-007 / MS-007 (Release Readiness)
- BUT: Do NOT start WP-007 in this operation. Wait for explicit OWNER authorization.
- MS-007 is the gate to S12 (Release Readiness / Preproduction).

---

## 19. S9 Final State

After this S9 operation:

| Surface | State |
|---|---|
| Application code | UNCHANGED |
| DB schema | UNCHANGED |
| DB migrations | UNCHANGED |
| Packages (package.json, pnpm-lock.yaml) | UNCHANGED |
| CI (`.github/`) | UNCHANGED (no CI workflow created — S10 will create) |
| Vercel | UNCHANGED (no Vercel config created — S10 will configure) |
| `main` branch | UNCHANGED (still `0bc77a7`) |
| `dev` branch | UNCHANGED (will receive the S9 contract commit) |
| Worktree | CLEAN (after commit) |
| WP-006 implementation | NOT STARTED |
| `.github/workflows/` | NOT created (S10 will create) |
| `vercel.json` | NOT created (S10 may create) |

**Only canonical contract documentation changes:** `docs/planning/work-packages/WP-006-ENVIRONMENTS-CICD.md` (this file).

---

## 20. Files Modified by S9

| File | Action | Notes |
|---|---|---|
| `docs/planning/work-packages/WP-006-ENVIRONMENTS-CICD.md` | CREATED | This contract (documentation-only) |

No other files are modified, created, or deleted by S9.

---

## 21. Risk Register (Material Risks for S10)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Vercel Hobby quota exceeded by wp/* Preview deployments | Medium | High | Contract: wp/* do NOT get Vercel Preview (quota-safe default). S10 verifies wp/* Preview is OFF. |
| Neon-Vercel integration auto-provisioning latency | Medium | Medium | Preview deployment may take longer; documented in risk register. S10 tests the Preview flow on a PR. |
| Vercel build fails due to env var misconfiguration | Medium | Medium | S10 verifies all env vars are set before first Preview deployment. |
| CI E2E fails due to TEST DB unavailability | Low | Medium | CI uses the existing TEST_DATABASE_URL (Neon test branch). If unavailable, CI fails (fail-closed). |
| Neon preview branch quota exceeded | Low | Medium | wp/* do NOT get Preview → no Neon preview branch per WP. Only dev gets Preview. |
| GitHub Actions secret misconfiguration | Low | High | S10 verifies all secrets are set (names checked; values NOT inspected). CI fails if secrets missing. |
| Production deployment accidentally triggered | Low | Critical | Contract: OWNER PROD GO required. S10 verifies no auto-deploy to Production. Vercel dashboard confirmation. |
| BETTER_AUTH_URL mismatch on Preview | Low | Medium | Contract: BETTER_AUTH_URL must match Preview origin. S10 verifies. |

---

## 22. Owner Authorization Required

| Authorization | Required For |
|---|---|
| OWNER APPROVE WP-006 CONTRACT | Approving this S9 contract before S10 starts |
| OWNER AUTHORIZE S10 | Authorizing S10 implementation (after contract approval) |
| OWNER PROD GO (future S13) | Production deployment + Production migration + Production bootstrap |
| OWNER REMOTE E2E (if ever needed) | Any future remote E2E run (NOT granted by this S9) |

No further authorization is requested by this S9 operation.

---

## 23. References

- AISE S0 v0.2 §26 (REMOTE RUNTIME COST & QUOTA SAFETY)
- AISE S0 §23 (Zero Scheduled Work)
- AISE S0 §25 (External Parameter Gate + Target Verification)
- ADR-0002 (Persistence Stack — Drizzle + neon-http)
- ADR-0006 (Database Environment Isolation: Production / Preview / Local)
- ADR-0007 (Migration Strategy — Drizzle Kit forward migrations)
- ADR-0008 (Testing Strategy — Vitest + RTL + Playwright, Real DB)
- TD-018 (Migration strategy — forward corrective, never push to Production)
- TD-019 (Environment Model — Production + Preview + Local)
- TD-020 (Bootstrap — idempotent, Better Auth createUser)
- TD-025 (CI Pipeline — GitHub Actions)
- TD-029 (SEO — sitemap + robots + metadata)
- TD-030 (Drizzle neon-http driver)
- S6 §13 (environment configuration)
- S6 §18.5 (CI integration)
- S6 §20 (configuration / environments)
- S6 §20.4 (target verification)
- S8 §7 MS-006 (Environments + CI/CD)
- S8 §7 MS-007 (Release Readiness — NOT this WP)
- WP-005 contract (E2E Test Infrastructure — resolveAuthorizedE2EBaseUrl, certifyTestTarget, fail-closed guards, 101 tests)
- WP-005 closure (impl head `29ce2d8`, closure commit `5128a45`)
- Existing env model: .env.example (documentation), .env.local (local secrets, gitignored)
- Existing CI state: NONE (no .github/workflows/)
- Existing Vercel state: NONE (no vercel.json, no Vercel project linked)

---

**END OF WP-006 CONTRACT — DRAFT, PENDING OWNER APPROVAL + AUTHORIZATION**
