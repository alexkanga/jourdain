# PROJECT STATE — JOURDAIN EMPLOI

This file is the canonical continuity document for the project. It is
maintained as engineering progresses and supersedes any chat history or
agent memory. New agents should read this file (together with the AISE
control plane) to understand where the project stands.

## Current phase

PROJECT:                JOURDAIN EMPLOI
AISE PHASE:             WP-005 / MS-005 CLOSED — ready for S9 WP-006 preparation (NOT YET AUTHORIZED)
STATUS:                 MS-005 / WP-005 CLOSED / PASS. E2E Test Infrastructure delivered. S0 v0.2 active. Ready for WP-006 (Environments + CI/CD, MS-006) preparation — NOT YET AUTHORIZED
CANONICAL RELEASE BRANCH: main
CANONICAL DEVELOPMENT BRANCH: dev
ACTIVE DEVELOPMENT BRANCH: dev
DIRECT DEVELOPMENT ON MAIN: DISALLOWED AFTER CUTOVER (2026-09-15)
GIT BRANCH POLICY:      main = release/future Vercel Production; dev = canonical development integration
CHARTER APPROVED:       YES
CHARTER PATH:           docs/planning/PROJECT_CHARTER.md
CHARTER APPROVAL DATE:  2026-09-13
PRODUCT REQUIREMENTS APPROVED: YES
PRODUCT REQUIREMENTS PATH: docs/product/PRODUCT_REQUIREMENTS.md
PRODUCT REQUIREMENTS APPROVAL DATE: 2026-09-14
TECHNICAL SPECIFICATION APPROVED: YES
TECHNICAL SPECIFICATION PATH: docs/architecture/TECHNICAL_SPECIFICATION.md
TECHNICAL SPECIFICATION APPROVAL DATE: 2026-09-15
PROJECT MANIFEST APPROVED: YES
PROJECT MANIFEST PATH:  docs/architecture/PROJECT_MANIFEST.md
PROJECT MANIFEST APPROVAL DATE: 2026-09-15
ADR COUNT:              10 (ADR-0001 through ADR-0010, all ACCEPTED)
ADR PATH:               docs/architecture/adr/
DELIVERY ROADMAP APPROVED: YES
DELIVERY ROADMAP PATH:  docs/planning/DELIVERY_ROADMAP.md
DELIVERY ROADMAP APPROVAL DATE: 2026-09-15
MILESTONE COUNT:        7 (MS-001 through MS-007)
MILESTONES CLOSED:      5 (MS-001, MS-002, MS-003, MS-004, MS-005)
MILESTONES REMAINING:   2 (MS-006 through MS-007)
WORK PACKAGES CLOSED:   5 (WP-001 — CLOSED / PASS WITH NON-BLOCKING FINDINGS; WP-002 — CLOSED / PASS; WP-003 — CLOSED / PASS WITH NON-BLOCKING FINDINGS; WP-004 — CLOSED / PASS; WP-005 — CLOSED / PASS)
WORK PACKAGES REMAINING: 2 (WP-006 through WP-007 — NOT YET AUTHORIZED)
WP-001 CONTRACT BASELINE: a0d6672145a14dd466d59541abc6cd41e56201f1
WP-001 IMPLEMENTATION COMMIT: 45fa8b7cadbed42db4df9f574eb726c40154cb09
WP-001 S11 VERDICT:     PASS WITH NON-BLOCKING FINDINGS
WP-001 NON-BLOCKING FINDING: pnpm build-script warning for esbuild/unrs-resolver (transitive devDeps) — no functional impact
WP-002 CONTRACT BASELINE: 0d6b1cf2be89422ec8b0a4b496fe78064599592e
WP-002 IMPLEMENTATION HEAD: 6d0027ad78aa3536f06f2ef60ca63c3efcbee3ce
WP-002 S11 VERDICT:     PASS
WP-002 IMPLEMENTATION FINDINGS: Schema mismatches discovered and corrected during S10 (text→boolean for user.email_verified and user.banned; text/timestamp→integer/bigint for rateLimit.count and rateLimit.last_request). Corrected within WP-002 contract scope. Migration 0001 is versioned; migration history prevents normal duplicate application; DEV and TEST at expected migration state; Production untouched.
WP-002 ARCHITECTURE DIVERGENCE: NONE
WP-003 CONTRACT BASELINE: 2b8e56dcb67e4282e25fd07d1a61136412800625
WP-003 IMPLEMENTATION HEAD: 35f80b38ddba9e68ef1ae417ade869f9e424c659
WP-003 S11 VERDICT:     PASS WITH NON-BLOCKING FINDINGS
WP-003 IMPLEMENTATION FINDINGS (RESOLVED DEFECTS):
  - /admin/login route-group redirect defect (layout guarded /admin/login causing infinite redirect loop) — RESOLVED via route-group restructure (app/admin/(protected)/)
  - getPrincipal() request-header/session propagation defect (passed empty Headers() to auth.api.getSession, discarding session cookie) — RESOLVED via next/headers integration (owner-authorized protected auth file change: lib/server/auth/authorization.ts)
  - Server Component event-handler defect (inline onChange on <select> in Server Component) — RESOLVED via GET form submission
  - Browser login session-cookie propagation defect (loginAction Server Action called auth.api.signInUsername directly, bypassing HTTP Set-Cookie) — RESOLVED via Better Auth client-side API (authClient.signIn.username from lib/auth-client.ts)
WP-003 AUTHORIZED PROTECTED AUTH CHANGE: lib/server/auth/authorization.ts ONLY (next/headers session propagation — owner-authorized cross-WP corrective patch)
WP-003 NON-BLOCKING FINDINGS:
  1. 10 authorized-but-unused direct dependencies remain (react-hook-form, @hookform/resolvers, class-variance-authority, clsx, tailwind-merge, @radix-ui/react-slot, @radix-ui/react-label, @radix-ui/react-select, @radix-ui/react-dialog, lucide-react) — NON-BLOCKING TECHNICAL DEBT
  2. Previous S11 verification cleared DEV rateLimit (test-isolation/governance finding) — no application impact; final verification used TEST-only
  3. Initial DRAFT DB snapshot in final browser evidence run not captured at creation time due to verification-script parameterization error — NON-BLOCKING EVIDENCE LIMITATION; UI showed Brouillon; runtime was TEST; committed integration test verifies DRAFT + published_at NULL; same offer later confirmed in TEST DB through lifecycle
WP-003 ARCHITECTURE DIVERGENCE: NONE
WP-003 EXISTING AUTH INTEGRATION GAP: RESOLVED
WP-004 CONTRACT BASELINE: 25766934006b7ea98236e3febca29856772dfa21
WP-004 IMPLEMENTATION HEAD: a7b3833d6c1af4edb90cddd07c27964d5fcbf396
WP-004 S11 VERDICT:     PASS
WP-004 FULL S11 FUNCTIONAL VERIFICATION: ACCEPTED
WP-004 TARGETED SECURITY S11 RE-VERIFICATION: PASS
WP-004 IMPLEMENTATION FINDINGS (RESOLVED DEFECTS BEFORE CLOSURE):
  - Tiptap href scheme validation (link safety): RESOLVED via safeHref() allowlist in components/public/TiptapRenderer.tsx — allowed schemes: http / https / mailto only; unsafe schemes (javascript:, data:, vbscript:, file:) preserve text but no clickable <a>
  - application_url / source_url scheme validation (public URL safety): RESOLVED via defense in depth — save-time Zod validation (lib/server/validation/schemas.ts: isSafeHttpUrl() + safeUrlField() wired into offerSchema for both application_url and source_url, http/https only) + render-time validation (components/public/OfferDetail.tsx: safeHttpUrl() http/https only before rendering <a>)
WP-004 SECURITY STATE (FINAL, RECORDED):
  - PUBLISHED-ONLY SERVER ENFORCEMENT: PASS (WHERE status='PUBLISHED' in listPublishedOffers, getPublishedOfferById, listPublishedOfferIds)
  - DRAFT public visibility: BLOCKED
  - SUSPENDED public visibility: BLOCKED
  - ARCHIVED public visibility: BLOCKED
  - Tiptap link safety: RESOLVED — allowed schemes http / https / mailto
  - application_url safety: RESOLVED — allowed http / https only (save-time + render-time)
  - source_url safety: RESOLVED — allowed http / https only (save-time + render-time)
  - application_email: SAFE — mailto: hardcoded prefix + Zod .email() validates local part
  - save-time URL validation: ACTIVE
  - public render-time URL defense: ACTIVE
  - defense in depth: CONFIRMED
  - open security findings: NONE
WP-004 NON-BLOCKING HISTORICAL FINDING:
  - S10 initial test-count reporting discrepancy: S10 reported 59 unit + 43 integration = 102; actual pre-security-remediation inventory was 58 unit/validation + 17 offers integration + 9 auth regression + 18 public integration = 102. After security tests added: 149 total. Classification: NON-BLOCKING REPORTING FINDING. Application impact: NONE. Do NOT reopen WP-004.
WP-004 ARCHITECTURE DIVERGENCE: NONE
WP-005 CONTRACT BASELINE: b18db2dd06f0c4db4917b64f0230474778fb7927
WP-005 IMPLEMENTATION HEAD: 29ce2d80a4ea7b728287040d8686958a60254697
WP-005 S11 VERDICT:     PASS
WP-005 INITIAL FULL S11: COMPLETED (BLOCKING FINDING IDENTIFIED: E2E_BASE_URL bypass)
WP-005 S10 REMEDIATION: COMPLETED (E2E_BASE_URL guard bypass closed + logout test corrected)
WP-005 TARGETED FINAL S11: PASS
WP-005 IMPLEMENTATION FINDINGS (RESOLVED DEFECTS BEFORE CLOSURE):
  - E2E_BASE_URL shell/process-env bypass: RESOLVED via canonical resolveAuthorizedE2EBaseUrl() in tests/e2e/helpers/env.ts — both playwright.config.ts AND runner.ts use the SAME resolver with deterministic env precedence (process.env > .env.local > default http://127.0.0.1:3100). Unauthorized E2E_BASE_URL fails before browser launch (fail-closed). Verified via explicit bypass proof.
  - Logout test false positive (S10): RESOLVED — root cause was BETTER_AUTH_URL mismatch (stale fallback http://127.0.0.1:3000 vs actual server http://127.0.0.1:3100). Better Auth rejected signOut requests from mismatched origin. Fixed by passing resolved baseUrl to buildChildEnv (BETTER_AUTH_URL = http://127.0.0.1:3100). Incorrect test.fail removed; replaced with regular Playwright security test that PASSES. Independently verified 3/3 from clean browser contexts.
WP-005 SECURITY STATE (FINAL, RECORDED):
  - NO STATE MUTATION BEFORE TARGET CERTIFICATION: PASS (Phase A read-only invariant enforced)
  - PHASE A READ-ONLY: PASS (env.ts contains no mutation keywords; only SELECT queries)
  - TEST FINGERPRINT: PASS (E2E_EXPECTED_TEST_DATABASE_HOST mandatory; no .env.example fallback; no inference from TEST_DATABASE_URL)
  - PARENT DATABASE_URL CONTAMINATION PROTECTION: PASS (curated child env allowlist; parent DATABASE_URL not forwarded)
  - CHILD DATABASE_URL = VERIFIED TEST: PASS
  - UNKNOWN DB: REFUSED (TEST_FINGERPRINT_MISMATCH)
  - DEV DB: REFUSED (TEST_EQUALS_DEV)
  - PRODUCTION DB: REFUSED (TEST_EQUALS_PROD)
  - SQLITE FALLBACK: REFUSED (TEST_IS_SQLITE_FALLBACK)
  - REMOTE E2E DEFAULT: REFUSED (REMOTE_BASE_URL_NOT_AUTHORIZED)
  - SHELL E2E_BASE_URL REMOTE BYPASS: RESOLVED (canonical resolver; fail-closed)
  - ENV.LOCAL REMOTE BYPASS: RESOLVED (same resolver)
  - MISMATCHED REMOTE OVERRIDE: REFUSED (E2E_BASE_URL must match E2E_REMOTE_BASE_URL)
  - DECEPTIVE LOCALHOST: REFUSED (localhost.example.com, localhost@evil.example, etc.)
  - PLAYWRIGHT / RUNNER TARGET PARITY: PASS (both use resolveAuthorizedE2EBaseUrl)
  - BETTER_AUTH_URL / E2E SERVER PARITY: PASS (http://127.0.0.1:3100)
  - LOGOUT SESSION INVALIDATION: PASS (independently verified 3/3 + full-suite regression)
  - OPEN BLOCKING SECURITY FINDINGS: NONE
WP-005 NON-BLOCKING FINDINGS:
  1. S10/S11 test-count reporting discrepancies (S10 overcounted guards by 1 due to counting test.skip as separate test). Final canonical E2E count: 101 (via `playwright test --list`). Application impact: NONE. NON-BLOCKING DOCUMENTATION FINDING.
  2. UI copy: "Republicaliser" in components/admin/LifecycleButtons.tsx (expected French: "Republier"). NON-BLOCKING PRODUCT COPY FINDING. Not fixed per §32 NO PRODUCT REDESIGN.
WP-005 ARCHITECTURE DIVERGENCE: NONE
WP-005 MAJOR DELIVERED CAPABILITIES:
  - Playwright E2E infrastructure (Chromium-only, single worker, 0 retries)
  - local Next.js runtime orchestration (build + spawn + readiness + shutdown)
  - TEST database positive fingerprint verification (E2E_EXPECTED_TEST_DATABASE_HOST)
  - fail-closed database-target guards (missing/wrong fingerprint, DEV, PROD, SQLite, unknown, unsupported scheme, unreachable)
  - parent DATABASE_URL contamination protection (curated child env allowlist)
  - no-mutation-before-target-certification invariant (Phase A read-only)
  - deterministic E2E fixtures and cleanup (E2E_ title marker, exact UUID cleanup, orphan recovery)
  - ADMIN critical 15-step journey (per S6 §18.4)
  - Fantomas verification (login + ADMIN capability inheritance)
  - public portal browser coverage (8 spec files: root, detail, search, pagination, not-found, seo, tiptap-safety, url-safety)
  - security E2E (5 spec files: admin-route-guard, hidden-offer, tiptap-href, unsafe-url, logout-invalidates)
  - axe-core accessibility verification (public + admin pages)
  - responsive/mobile verification (375x667 viewport)
  - failure screenshots/traces (on failure only; video off)
  - remote E2E refusal by default (loopback only; 3-variable override semantics)
  - canonical base-URL authorization (resolveAuthorizedE2EBaseUrl — one resolver for Playwright + runner)
  - logout session invalidation coverage (regular Playwright test, independently verified 3/3)
  - 101 E2E tests total: 18 spec files (guards=48, public=31, admin=1, security=14, fantomas=2, accessibility=3, responsive=2)
  - existing 149 Vitest tests preserved (vitest.config.ts excludes tests/e2e/)
  - Implemented at 29ce2d8, verified PASS (initial S11 + S10 remediation + targeted final S11 PASS)
CANONICAL BRANCH:       dev (development); main = release, untouched
CANONICAL HEAD:         29ce2d80a4ea7b728287040d8686958a60254697 (dev, after WP-005 merge + closure commit)
REMOTE:                 configured (origin → git@github.com-aise-alexkanga-jourdain:alexkanga/jourdain.git)
REMOTE HEAD:            29ce2d80a4ea7b728287040d8686958a60254697 (dev)
LOCAL = REMOTE:         YES (dev)
MAIN HEAD:              0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d (unchanged since branch cutover)
WP-004 WORK BRANCH RETAINED: wp/004-public-job-portal (at a7b3833d6c1af4edb90cddd07c27964d5fcbf396) — NOT deleted
WP-005 WORK BRANCH RETAINED: wp/005-e2e-test-infrastructure (at 29ce2d80a4ea7b728287040d8686958a60254697) — NOT deleted
AISE S0 VERSION:               0.2
AISE QUOTA-SAFETY PATCH:        ACCEPTED / MERGED
AISE QUOTA-SAFETY PATCH COMMIT: f3f2bdcc233fe28cca01b18090aca0ee96561f61
AISE QUOTA-SAFETY PATCH DATE:   2026-09-16
AISE QUOTA-SAFETY POLICY STATUS: ACTIVE
AISE QUOTA-SAFETY DOCTRINE:     S0 §26 FROZEN REMOTE RUNTIME COST & QUOTA SAFETY
  - Local-first automated verification
  - Dedicated TEST resources (DEV ≠ TEST when TEST exists)
  - Remote is not free by default (FREE ≠ UNMETERED)
  - Metered/quota-limited resources require control
  - Production is not a development test target
  - UNKNOWN → INVESTIGATE (never UNKNOWN → RUN ANYWAY)
  - No silent target substitution
  - Evidence must identify target
  - Automated remote E2E is opt-in (default: localhost)
  - Mutation accounting (mutation = mutation, even test-state)
  - Preview deployment policy (work branches: no auto-preview)
  - Human preview ≠ automated test target
  - Retry/loop safety

JOURDAIN INTENDED QUOTA-SAFETY EXECUTION POLICY (project-specific overlay):
  UNIT TESTS:              LOCAL
  INTEGRATION TESTS:       TEST_DATABASE_URL
  FULL E2E:                localhost application by default
  REMOTE VERCEL E2E:       NOT AUTHORIZED BY DEFAULT
  WORK-BRANCH CLOUD PREVIEW: DISABLED BY DEFAULT
  DEV/INTEGRATION PREVIEW: may later be enabled for limited human validation
  MAIN/PRODUCTION:         explicit release authorization only
  NOTE: Vercel NOT configured now. MS-006 remains the deployment milestone.
COMPLETED COMPONENTS:   S0, S1, S2, S3, S4, S5, S6, S7, S8, S9 (WP-001), S10 (WP-001), S11 (WP-001), S9 (WP-002), S10 (WP-002), S11 (WP-002), S9 (WP-003), S10 (WP-003), S11 (WP-003), S9 (WP-004), S10 (WP-004), S11 (WP-004), S9 (WP-005), S10 (WP-005), S11 (WP-005) installed and canonical
PRODUCT DISCOVERY:      CLOSED PASS — CHARTER APPROVED (S4)
PRODUCT REQUIREMENTS:   CLOSED PASS — PRODUCT REQUIREMENTS APPROVED (S5)
TECHNICAL SPECIFICATION: CLOSED PASS — TECHNICAL SPECIFICATION APPROVED (S6)
PROJECT MANIFEST/ADR:   CLOSED PASS — PROJECT MANIFEST AND ADRS APPROVED (S7)
DELIVERY ROADMAP:        CLOSED PASS — DELIVERY ROADMAP APPROVED (S8)
MS-001 APPLICATION FOUNDATION: CLOSED PASS — WP-001 CLOSED PASS WITH NON-BLOCKING FINDINGS (S9+S10+S11)
MS-002 DATABASE + AUTH FOUNDATION: CLOSED PASS — WP-002 CLOSED PASS (S9+S10+S11)
MS-003 ADMIN OFFER MANAGEMENT: CLOSED PASS WITH NON-BLOCKING FINDINGS — WP-003 CLOSED PASS WITH NON-BLOCKING FINDINGS (S9+S10+S11+remediation+re-verification)
MS-004 PUBLIC JOB PORTAL: CLOSED PASS — WP-004 CLOSED PASS (S9+S10+S11+security remediation+targeted security re-verification)
MS-005 E2E INTEGRATION + HARDENING: CLOSED PASS — WP-005 CLOSED PASS (S9+S10+S11+S10 remediation+targeted final S11)
IMPLEMENTATION:         IN PROGRESS (MS-001 closed; MS-002 closed; MS-003 closed; MS-004 closed; MS-005 closed; MS-006 not yet authorized)
DEFERRED DECISIONS:     Charter-level: D1 (GDPR details — future), D2 (migration scope — only if needed), D3 (data residency — future). S5-level: DR-030/040 (full audit log — future), DR-050 (admin UI — future), DR-051 (SUPER_ADMIN role — future), DR-160 (GDPR — future), DR-170 (data residency — future). All explicitly non-blocking for V1.
NEXT AUTHORIZED:        NONE until OWNER GO
NEXT RECOMMENDED:       S9 — prepare WP-006 (Environments + CI/CD, MS-006) — Vercel + Neon configuration, GitHub Actions CI, Preview deployment. MS-006 must preserve AISE v0.2 quota-safety and Vercel Hobby constraints.
MS-006 BOUNDARY: Do NOT configure Vercel, production domain, Preview deployment, production environment variables, or CI/CD deployment until OWNER authorizes MS-006. MS-006 remains separate.
S12 BOUNDARY: Do NOT start S12 (global release-readiness). S12 remains separate.

## What exists

- AISE governance control plane: S0–S14 + R1–R7, vendored canonical
  snapshot from source commit 2991df51c1fa692f892452c361081c626f028cd0.
- AISE manifest: `docs/engineering/AISE_MANIFEST.md`.
- This project state file: `docs/planning/PROJECT_STATE.md`.
- Minimal README: `README.md`.

## What exists now (after MS-005 / WP-005 closure)

- **WP-005 E2E Test Infrastructure**:
  - Playwright E2E infrastructure with Chromium-only browser matrix,
    single worker, 0 retries, screenshot on failure, trace on first
    retry, video off (per ADR-0008, TD-024, AISE S0 v0.2 §26
    quota-safety).
  - Local Next.js runtime orchestration via tests/e2e/helpers/runner.ts:
    build → spawn `next start --port 3100` with curated child env →
    readiness probe → run Playwright specs → shutdown.
  - Canonical base-URL resolver: `resolveAuthorizedE2EBaseUrl()` in
    tests/e2e/helpers/env.ts — used by BOTH playwright.config.ts AND
    runner.ts. Deterministic env precedence: process.env > .env.local
    > default (http://127.0.0.1:3100). Fail-closed: unauthorized URL
    fails before browser launch.
  - Phase A read-only target certification (NO STATE MUTATION BEFORE
    TARGET CERTIFICATION): parseEnvLocal → URL type/scheme validation
    → positive TEST fingerprint comparison (E2E_EXPECTED_TEST_DATABASE_HOST)
    → refuse-non-TEST guards (DEV, PROD, SQLite, unknown) → read-only
    connectivity probe → read-only identity probe → construct curated
    child env (no inherited parent DATABASE_URL).
  - Parent DATABASE_URL contamination protection: buildChildEnv()
    constructs a curated allowlist (DATABASE_URL, BETTER_AUTH_SECRET,
    BETTER_AUTH_URL, INITIAL_ADMIN_*, FANTOMAS_*, NEXT_PUBLIC_SITE_URL,
    NODE_ENV, PATH, HOME). Parent DATABASE_URL (file: or postgresql://)
    is NOT forwarded. Child receives DATABASE_URL = positively verified
    TEST_DATABASE_URL.
  - BETTER_AUTH_URL = http://127.0.0.1:3100 (matches actual E2E server
    URL; no stale localhost:3000).
  - Deterministic E2E fixtures: tests/e2e/helpers/fixtures.ts — direct
    Neon SQL helpers with E2E_<run-id>_<scenario> title marker (in the
    `title` business field, NOT replacing canonical UUID `id`). Normal
    cleanup: delete by exact UUID. Orphan recovery: find by title prefix
    → collect UUIDs → delete exact UUIDs. No broad unrestricted DELETE.
  - TEST-only rateLimit cleanup (AFTER Phase A certification). No DEV
    rateLimit touched. No global rate limiter disabling.
  - 101 E2E tests across 18 spec files:
    - guards.spec.ts (48): 12 guard self-tests (AC-030 through AC-037d)
      + 5 §19 bypass regression + 17 §13 A-L additional base URL guard
      + 14 DB target certification + parent contamination + mutation
      ordering + real TEST DB probe.
    - public-*.spec.ts (31): root, detail, search, pagination,
      not-found, seo, tiptap-safety, url-safety.
    - admin-critical-journey.spec.ts (1): 15-step journey per S6 §18.4.
    - security-*.spec.ts (14): admin-route-guard, hidden-offer,
      tiptap-href, unsafe-url, logout-invalidates (regular test, PASS).
    - fantomas-journey.spec.ts (2): login + ADMIN capability inheritance.
    - accessibility.spec.ts (3): axe-core scan (public root, detail,
      admin login).
    - responsive.spec.ts (2): mobile viewport 375x667.
  - Existing 149 Vitest tests preserved (vitest.config.ts excludes
    tests/e2e/). Test command separation: `pnpm test` (Vitest) ≠
    `pnpm test:e2e` (Playwright).
  - 0 test.fail. 1 conditional test.skip (guards.spec.ts AC-032 — does
    NOT trigger during authorized TEST run). 0 test.fixme.
  - Failure artifacts: screenshot on failure, trace on first retry,
    video off. .gitignore covers tests/e2e/.artifacts/.
  - Remote E2E refused by default (loopback only). 3-variable override
    semantics: E2E_ALLOW_REMOTE=1 + E2E_REMOTE_BASE_URL +
    E2E_REMOTE_AUTHORIZATION_REF (all three required, AND
    E2E_BASE_URL must match E2E_REMOTE_BASE_URL).
  - No CI workflow (MS-006 scope). No Vercel (MS-006 scope).
  - Implemented at 29ce2d8, verified PASS (initial S11 BLOCKING finding
    E2E_BASE_URL bypass → S10 remediation → targeted final S11 PASS).

## What does NOT exist (intentional, per current scope)

- No Vercel project or environment configured (future — MS-006).
- No GitHub Actions CI (future — MS-006).
- No WP-006 work or contract preparation (NOT YET AUTHORIZED).
- No S12 (global release-readiness — future).
- No changes to Neon Production / `main` branch.

## What exists now (after MS-004 / WP-004 closure)

- **WP-004 Public Job Portal**:
  - Anonymous public job portal at root URL `/` (no authentication required).
  - Public offer list route: `app/(public)/page.tsx` — PUBLISHED-only,
    search via `?q=` (title/company/location), server-side pagination
    via `?page=`, deterministic `published_at DESC, created_at DESC`
    ordering, empty state ("Aucune offre disponible actuellement").
  - Public offer detail route: `app/(public)/offres/[id]/page.tsx` —
    UUID validation, `WHERE id=? AND status='PUBLISHED'`, notFound()
    for hidden or nonexistent (no status/existence leak).
  - Server-side PUBLISHED-only enforcement at query boundary:
    `lib/server/services/public-offers.ts` (listPublishedOffers,
    getPublishedOfferById, listPublishedOfferIds) — read-only, no
    mutation methods, no admin capabilities.
  - Deterministic Tiptap JSON-to-React renderer:
    `components/public/TiptapRenderer.tsx` — no
    `dangerouslySetInnerHTML`; `safeHref()` allowlist (http, https,
    mailto only; rejects javascript:, data:, vbscript:, file:).
  - Render-time URL defense in depth:
    `components/public/OfferDetail.tsx` — `safeHttpUrl()` validates
    `application_url` and `source_url` before rendering `<a>`
    (http/https only; unsafe values silently omit link).
  - Save-time URL validation (defense in depth):
    `lib/server/validation/schemas.ts` — `isSafeHttpUrl()` +
    `safeUrlField()` wired into `offerSchema` for both
    `application_url` and `source_url` (http/https only).
  - `application_email`: `mailto:` prefix hardcoded in render,
    Zod `.email()` validates the local email part.
  - SEO: `app/sitemap.ts`, `app/robots.ts`, per-page `metadata`.
  - Old placeholder `app/page.tsx` REMOVED (replaced by
    `app/(public)/page.tsx`).
  - 149 tests total: 11 test files (validation, offer-validation,
    lifecycle, authorization, tiptap-link-safety, url-scheme-safety,
    url-render-safety, public-offers-integration, offers-integration,
    auth-regression, home).
  - Implemented at `a7b3833`, verified PASS (full S11 functional
    verification ACCEPTED + targeted security S11 re-verification PASS).

## What does NOT exist (intentional, per current scope)

- No Vercel project or environment configured (future — MS-006).
- No GitHub Actions CI (future — MS-006).
- No WP-006 work or contract preparation (NOT YET AUTHORIZED).
- No S12 (global release-readiness — future).
- No changes to Neon Production / `main` branch.

## What does NOT exist (intentional, per S3 / S4 / S5 / S6 / S7 boundaries)

- No application code.
- No Next.js application scaffolded.
- No database (Neon or otherwise) created.
- No Vercel project or environment configured.
- No authentication provider configured.
- No CI/CD pipeline.
- No scheduled work, cron, or background automation (S0 §23 default).
- No delivery roadmap (S8 — next recommended stage).
- No implementation (S10).

## What exists now (after S7 closure)

- AISE governance control plane: S0–S14 + R1–R7, vendored canonical
  snapshot from source commit 2991df51c1fa692f892452c361081c626f028cd0.
- AISE manifest: `docs/engineering/AISE_MANIFEST.md`.
- This project state file: `docs/planning/PROJECT_STATE.md`.
- Minimal README: `README.md`.
- **OWNER-APPROVED PROJECT CHARTER**: `docs/planning/PROJECT_CHARTER.md`
  (frozen at `fa377c1`, approved 2026-09-13).
- **OWNER-APPROVED PRODUCT REQUIREMENTS**: `docs/product/PRODUCT_REQUIREMENTS.md`
  (frozen at `9ec4a08`, approved 2026-09-14).
  65 CONFIRMED requirements, 0 ASSUMPTION, 0 OPEN, 30 OUT OF SCOPE V1.
- **OWNER-APPROVED TECHNICAL SPECIFICATION**: `docs/architecture/TECHNICAL_SPECIFICATION.md`
  (frozen at `7c85323`, approved 2026-09-15).
  31 TDs (30 DECIDED + 1 MANDATED), 0 OPEN, 0 PROVISIONAL.
- **OWNER-APPROVED PROJECT MANIFEST**: `docs/architecture/PROJECT_MANIFEST.md`
  (frozen at `0b8b436`, approved 2026-09-15).
  Concise canonical technical reference, 16 sections.
- **10 ACCEPTED ADRs**: `docs/architecture/adr/ADR-0001` through `ADR-0010`.
  Covering: architecture, persistence, auth, authorization, rich text,
  environment isolation, migrations, testing, offer URL, search.

## What exists now (after MS-001 / WP-001 closure)

- **WP-001 Application Foundation**: Next.js 15 App Router + TypeScript
  strict + Tailwind CSS + Vitest + minimal home route. Implemented at
  `45fa8b7`, verified PASS WITH NON-BLOCKING FINDINGS.

## What exists now (after MS-002 / WP-002 closure)

- **WP-002 Database + Auth Foundation**:
  - PostgreSQL via Neon serverless driver
    (`drizzle-orm/neon-http` + `@neondatabase/serverless`).
  - DEV and TEST isolated Neon targets; Production untouched.
  - Drizzle ORM + Drizzle Kit; versioned migrations
    (`0000_medical_gunslinger` and `0001_happy_skullbuster`).
    Migration history prevents normal duplicate application.
  - Approved Offer schema: JSONB `description`, lifecycle enum
    (`DRAFT` / `PUBLISHED` / `SUSPENDED` / `ARCHIVED`),
    no `expiration_date`, no excessive Company/Sector/Category
    normalization.
  - Better Auth with Username plugin, Admin plugin,
    `emailAndPassword.enabled=true`, `disableSignUp=true`,
    database sessions, database-backed rate limiting, Better Auth
    password hashing (scrypt).
  - Authorization via `principalType` (`ADMIN` | `FANTOMAS`):
    `input:false`, `returned:true`, client mutation denied, Better Auth
    `role` separate from `principalType`,
    `can()` / `requireCapability()` based on `principalType`.
  - Fantomas: input login `"Fantomas"` → normalized stored username
    `"fantomas"` (Username plugin normalization), login PASS,
    `principalType=FANTOMAS`, inherits ADMIN capabilities, Fantomas-only
    capabilities preserved.
  - ADMIN: login PASS, `principalType=ADMIN`, Fantomas-only capability
    denied.
  - Bootstrap: Better Auth handles credentials; post-create server-side
    `principalType` assignment (Drizzle `UPDATE` restricted to
    `principalType`); no manual password hash; no direct Better Auth
    credential writes; idempotence verified.
  - Rate limiting: explicitly enabled; `storage=database`; `rateLimit`
    table verified; database writes verified; no memory store as
    authority.
  - Quality gates: lint PASS, typecheck PASS, test PASS (23 unit tests),
    build PASS. Real `TEST_DATABASE_URL` integration verification PASS.
  - Implemented at `6d0027a`, verified PASS.

## Implementation findings (resolved within WP-002 scope)

The following schema mismatches were discovered during S10 and
corrected within the authorized WP-002 contract scope. They are
recorded as implementation findings, NOT architecture divergence:

- `user.email_verified`: text → boolean (Better Auth core user schema
  expects boolean; text caused the boolean `false` to be stored as the
  string `"false"`, which is truthy in JS and triggered the Admin
  plugin's `if (user.banned)` check on every login).
- `user.banned`: text → boolean (Better Auth Admin plugin schema
  expects boolean; same truthy-string problem as above).
- `rateLimit.count`: text → integer (Better Auth rate limiter writes
  `count: <number>`).
- `rateLimit.last_request`: timestamp → bigint (Better Auth rate
  limiter writes `lastRequest: Date.now()` as epoch-millis number;
  Drizzle's `PgTimestamp.mapToDriverValue` calls `value.toISOString()`
  which fails on a number).

No approved architecture or contract decision was changed.

## Architecture divergence

NONE.

## What does NOT exist (intentional, per current scope)

- No `middleware.ts` (AC-033 satisfied — belongs to WP-003).
- No Admin UI, no login UI, no Offer CRUD UI, no Tiptap UI, no Public
  Portal (all future work packages).
- No Playwright (future).
- No Vercel project or environment configured (future).
- No GitHub Actions CI (future).
- No WP-003 work or contract preparation.
- No S12 — this closure only.
- No changes to Neon Production / `main` branch.

## OWNER-provided inputs (recorded as-is, evidence for S4/S5/S6)

These inputs were supplied by OWNER during the NEW PROJECT START and
S3 authorization. They are recorded here factually as inputs for later
AISE stages. They are NOT specifications. They will be reviewed,
refined, expanded, and possibly revised during S4 (charter), S5
(product requirements), and S6 (technical specification). Recording
them here is factual; expanding them into requirements, architecture,
or code would be premature execution forbidden by S3.

### Project identity

- Project name: JOURDAIN EMPLOI
- One-sentence purpose: V1 d'un portail simple de publication et de
  consultation d'offres d'emploi.
- Scope framing: ce n'est PAS encore une plateforme complète de
  recrutement.

### Functional framing (V1)

Administration:
- Authentification de l'administration.
- Création d'une offre.
- Enregistrement d'une offre.
- Modification d'une offre.
- Publication d'une offre.
- Suspension ou archivage.
- Consultation de la liste des offres administratives.

Public:
- Consulter la liste des offres publiées.
- Ouvrir une offre.
- Consulter le détail complet de l'offre.
- Consulter les modalités de candidature lorsqu'elles sont disponibles.

### Business rules (V1)

- Titre: obligatoire.
- Description: obligatoire.
- Entreprise: facultatif.
- Secteur: facultatif.
- Catégorie: facultatif.
- Type de contrat: facultatif.
- Niveau d'étude: facultatif.
- Expérience: facultatif.
- Localisation: facultative lorsqu'elle n'est pas connue.
- Ne jamais inventer une information absente de l'offre source.
- Aucune donnée facultative absente ne doit empêcher inutilement la
  publication.

### Public interface (V1)

Carte d'offre:
- Titre.
- Entreprise si disponible.
- Lieu si disponible.
- Type de contrat si disponible.
- Date de publication.
- Date limite / expiration si disponible.
- Bouton « Voir l'offre ».

Détail d'une offre:
- Titre.
- Entreprise si disponible.
- Informations principales disponibles.
- Dates.
- Description complète.
- Modalités de candidature.
- Éventuellement la source.

### Exclusions V1 (explicitly excluded from this version)

- Pas de logo d'entreprise.
- Pas de bouton Postuler.
- Pas de partage.
- Pas de Facebook.
- Pas de WhatsApp.
- Pas de LinkedIn.
- Pas de compte candidat.
- Pas de CV.
- Pas de favoris.
- Pas de messagerie.
- Pas de candidature interne.
- Pas d'espace recruteur.
- Pas de paiement.
- Pas de matching IA.
- Pas d'application mobile.

### Technology preferences (OWNER-stated, NOT yet decided)

These are OWNER preferences recorded as input for S6. They are NOT
canonical technical decisions yet. Final selection happens in S6 /
S7, as architecte senior, au plus simple et au plus proportionné.

Preferred stack (OWNER-stated):
- React.
- Next.js.
- TypeScript.
- Next.js App Router.
- Vercel.
- PostgreSQL Neon.
- Environnement Production séparé des environnements Preview.

Envisaged tools around Next.js (OWNER-stated, non figés):
- Zod.
- Drizzle ou Prisma.
- TanStack Query lorsque réellement utile.
- React Hook Form lorsque pertinent.
- Tailwind CSS.
- shadcn/ui.
- Outils de tests adaptés.

Architectural constraint (OWNER-stated):
- Pas de microservices, Kubernetes, Kafka, Elasticsearch ou autre
  architecture lourde sans nécessité démontrée.

### Priorities (OWNER-stated, ordered)

1. Simplicité d'utilisation.
2. Fonctionnement correct.
3. Sécurité.
4. Maintenabilité.
5. Performance.
6. Faible complexité.
7. Faible coût d'exploitation.

## Constraints carried forward

- AISE FROZEN rule §24 (Contract Preservation) applies to all future
  work: never adapt valid evidence to defective implementation.
- AISE FROZEN rule §25 (External Parameter Gate) applies: do not
  request external parameters preemptively. Secrets (DATABASE_URL,
  Vercel tokens, etc.) will be requested only at the exact S10/S13
  boundary where they are genuinely required.
- AISE §23 (Zero Scheduled Work): no cron, no scheduled tasks, no
  background monitoring unless explicitly OWNER-authorized.

## Stop contract

MS-001 / WP-001 is CLOSED / PASS WITH NON-BLOCKING FINDINGS.
MS-002 / WP-002 is CLOSED / PASS (owner-accepted S11 verdict).
MS-003 / WP-003 is CLOSED / PASS WITH NON-BLOCKING FINDINGS.
MS-004 / WP-004 is CLOSED / PASS (owner-accepted full S11 verdict + targeted security S11).
MS-005 / WP-005 is CLOSED / PASS (owner-accepted initial S11 + S10 remediation + targeted final S11).

WP-006 / MS-006 has NOT started. S9 for WP-006 begins only after
explicit OWNER GO. No WP-006 contract preparation is authorized at
this time. MS-006 (Environments + CI/CD) must preserve AISE v0.2
quota-safety and Vercel Hobby constraints.

S12 has NOT started.

Branch policy preserved: `main` = release / future Production branch
(untouched); `dev` = canonical development integration branch. Direct
development on `main` remains DISALLOWED. `dev` was NOT merged into
`main` during this closure. Work branch `wp/005-e2e-test-infrastructure`
retained (NOT deleted) at 29ce2d80a4ea7b728287040d8686958a60254697.

NEXT RECOMMENDED COMPONENT: S9 — prepare WP-006 (Environments + CI/CD,
next work package per DELIVERY_ROADMAP, MS-006)
NEXT ACTION: OWNER GO REQUIRED
