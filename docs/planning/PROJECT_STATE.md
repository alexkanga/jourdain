# PROJECT STATE — JOURDAIN EMPLOI

This file is the canonical continuity document for the project. It is
maintained as engineering progresses and supersedes any chat history or
agent memory. New agents should read this file (together with the AISE
control plane) to understand where the project stands.

## Current phase

PROJECT:                JOURDAIN EMPLOI
AISE PHASE:             WP-004 / MS-004 CLOSED — ready for S9 WP-005 preparation (NOT YET AUTHORIZED)
STATUS:                 MS-004 / WP-004 CLOSED / PASS. Public Job Portal delivered. S0 v0.2 active. Ready for WP-005 (E2E Test Infrastructure, MS-005) preparation — NOT YET AUTHORIZED
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
MILESTONES CLOSED:      4 (MS-001, MS-002, MS-003, MS-004)
MILESTONES REMAINING:   3 (MS-005 through MS-007)
WORK PACKAGES CLOSED:   4 (WP-001 — CLOSED / PASS WITH NON-BLOCKING FINDINGS; WP-002 — CLOSED / PASS; WP-003 — CLOSED / PASS WITH NON-BLOCKING FINDINGS; WP-004 — CLOSED / PASS)
WORK PACKAGES REMAINING: 3 (WP-005 through WP-007 — NOT YET AUTHORIZED)
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
WP-004 MAJOR DELIVERED CAPABILITIES:
  - anonymous public job portal (no authentication required)
  - root PUBLISHED offers list at /
  - UUID detail route at /offres/[id]
  - server-side PUBLISHED-only enforcement (read-only public service: lib/server/services/public-offers.ts)
  - title/company/location search (?q=)
  - server-side pagination (?page=)
  - deterministic published_at DESC, created_at DESC ordering
  - safe Tiptap rendering (deterministic JSON-to-React, no dangerouslySetInnerHTML)
  - safe application_url/source_url scheme enforcement (http/https only, save + render)
  - application_email mailto handling
  - sitemap.ts
  - robots.ts
  - per-page metadata
  - no candidate workflow
  - no public authentication requirement
  - old placeholder app/page.tsx REMOVED (replaced by app/(public)/page.tsx)
CANONICAL BRANCH:       dev (development); main = release, untouched
CANONICAL HEAD:         a7b3833d6c1af4edb90cddd07c27964d5fcbf396 (dev, after WP-004 merge + closure commit)
REMOTE:                 configured (origin → git@github.com-aise-alexkanga-jourdain:alexkanga/jourdain.git)
REMOTE HEAD:            a7b3833d6c1af4edb90cddd07c27964d5fcbf396 (dev)
LOCAL = REMOTE:         YES (dev)
MAIN HEAD:              0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d (unchanged since branch cutover)
WP-004 WORK BRANCH RETAINED: wp/004-public-job-portal (at a7b3833d6c1af4edb90cddd07c27964d5fcbf396) — NOT deleted
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
COMPLETED COMPONENTS:   S0, S1, S2, S3, S4, S5, S6, S7, S8, S9 (WP-001), S10 (WP-001), S11 (WP-001), S9 (WP-002), S10 (WP-002), S11 (WP-002), S9 (WP-003), S10 (WP-003), S11 (WP-003), S9 (WP-004), S10 (WP-004), S11 (WP-004) installed and canonical
PRODUCT DISCOVERY:      CLOSED PASS — CHARTER APPROVED (S4)
PRODUCT REQUIREMENTS:   CLOSED PASS — PRODUCT REQUIREMENTS APPROVED (S5)
TECHNICAL SPECIFICATION: CLOSED PASS — TECHNICAL SPECIFICATION APPROVED (S6)
PROJECT MANIFEST/ADR:   CLOSED PASS — PROJECT MANIFEST AND ADRS APPROVED (S7)
DELIVERY ROADMAP:        CLOSED PASS — DELIVERY ROADMAP APPROVED (S8)
MS-001 APPLICATION FOUNDATION: CLOSED PASS — WP-001 CLOSED PASS WITH NON-BLOCKING FINDINGS (S9+S10+S11)
MS-002 DATABASE + AUTH FOUNDATION: CLOSED PASS — WP-002 CLOSED PASS (S9+S10+S11)
MS-003 ADMIN OFFER MANAGEMENT: CLOSED PASS WITH NON-BLOCKING FINDINGS — WP-003 CLOSED PASS WITH NON-BLOCKING FINDINGS (S9+S10+S11+remediation+re-verification)
MS-004 PUBLIC JOB PORTAL: CLOSED PASS — WP-004 CLOSED PASS (S9+S10+S11+security remediation+targeted security re-verification)
IMPLEMENTATION:         IN PROGRESS (MS-001 closed; MS-002 closed; MS-003 closed; MS-004 closed; MS-005 not yet authorized)
DEFERRED DECISIONS:     Charter-level: D1 (GDPR details — future), D2 (migration scope — only if needed), D3 (data residency — future). S5-level: DR-030/040 (full audit log — future), DR-050 (admin UI — future), DR-051 (SUPER_ADMIN role — future), DR-160 (GDPR — future), DR-170 (data residency — future). All explicitly non-blocking for V1.
NEXT AUTHORIZED:        NONE until OWNER GO
NEXT RECOMMENDED:       S9 — prepare WP-005 (E2E Test Infrastructure, MS-005) — Playwright infrastructure, NOT remote E2E, NOT CI E2E pipeline (per quota-safety doctrine)
WP-005 / MS-005 BOUNDARY: Do NOT install Playwright project infrastructure now. Do NOT create CI E2E pipeline now. Do NOT configure remote E2E. MS-005 remains the next separate milestone.
MS-006 BOUNDARY: Do NOT configure Vercel, production domain, Preview deployment, production environment variables, or CI/CD deployment. MS-006 remains separate.

## What exists

- AISE governance control plane: S0–S14 + R1–R7, vendored canonical
  snapshot from source commit 2991df51c1fa692f892452c361081c626f028cd0.
- AISE manifest: `docs/engineering/AISE_MANIFEST.md`.
- This project state file: `docs/planning/PROJECT_STATE.md`.
- Minimal README: `README.md`.

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

- No Playwright (future — MS-005).
- No Vercel project or environment configured (future — MS-006).
- No GitHub Actions CI (future).
- No WP-005 work or contract preparation (NOT YET AUTHORIZED).
- No S12 — this closure only.
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

WP-005 / MS-005 has NOT started. S9 for WP-005 begins only after
explicit OWNER GO. No WP-005 contract preparation is authorized at
this time. Per quota-safety doctrine: do NOT install Playwright project
infrastructure, do NOT create CI E2E pipeline, do NOT configure remote
E2E in this operation — all deferred to MS-005 boundary.

MS-006 (Vercel deployment) has NOT started. Do NOT configure Vercel,
production domain, Preview deployment, production environment
variables, or CI/CD deployment in this operation.

S12 has NOT started.

Branch policy preserved: `main` = release / future Production branch
(untouched); `dev` = canonical development integration branch. Direct
development on `main` remains DISALLOWED. `dev` was NOT merged into
`main` during this closure. Work branch `wp/004-public-job-portal`
retained (NOT deleted) at a7b3833d6c1af4edb90cddd07c27964d5fcbf396.

NEXT RECOMMENDED COMPONENT: S9 — prepare WP-005 (E2E Test Infrastructure,
next work package per DELIVERY_ROADMAP, MS-005)
NEXT ACTION: OWNER GO REQUIRED
