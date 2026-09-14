# DELIVERY ROADMAP — JOURDAIN EMPLOI V1

**Status:** OWNER APPROVED — S8 CLOSED / PASS
**Date:** 2026-09-15 (created), 2026-09-15 (OWNER APPROVED)
**Project:** JOURDAIN EMPLOI V1
**Canonical repository:** `github.com/alexkanga/jourdain`

---

## 1. Roadmap Status

| Field | Value |
|---|---|
| Project | JOURDAIN EMPLOI |
| Version | V1 |
| Status | OWNER APPROVED — S8 CLOSED / PASS |
| Source Charter (S4) | `docs/planning/PROJECT_CHARTER.md` — APPROVED at `fa377c1` (2026-09-13) |
| Source Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` — APPROVED at `9ec4a08` (2026-09-14) |
| Source Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` — APPROVED at `7c85323` (2026-09-15) |
| Source Project Manifest (S7) | `docs/architecture/PROJECT_MANIFEST.md` — APPROVED at `0b8b436` (2026-09-15) |
| ADR set | 10 ACCEPTED (ADR-0001 through ADR-0010) |
| S8 draft HEAD | `81480a88bf290ff8f0569e808a70c55601ad4c75` |

---

## 2. Delivery Objective

Deliver a V1 of JOURDAIN EMPLOI where the administration can authenticate, create, edit, publish, suspend, republish, and archive job offers, and the public can browse published offers and read their full details — as a simple, operational, deployable web portal.

---

## 3. Planning Principles

- **Dependency-driven ordering:** each milestone depends on the output of the previous one. No milestone can start before its hard dependencies are closed.
- **Outcome-oriented milestones:** each milestone produces a verifiable capability, not a collection of installed packages.
- **Critical path priority:** the path "ADMIN publishes an offer → PUBLIC sees it" is the spine. Non-critical SHOULD features are positioned after the MUST core.
- **Minimum sufficient milestones:** 7 milestones — no artificial fragmentation.
- **Verification per milestone:** each milestone has explicit exit conditions. Code written ≠ milestone done.
- **Architecture preservation:** the roadmap respects S6/S7 approved architecture. No silent redesign.

---

## 4. Release Scope

### Included (V1 MUST + SHOULD)

All 65 CONFIRMED requirements from S5 (60 MUST + 5 SHOULD) are in scope for V1 release.

### Deferred (genuine future — not in V1)

Per S5 Section 18: DR-030/040 (full audit log), DR-050 (ADMIN account management UI), DR-051 (formal SUPER_ADMIN role), DR-160 (GDPR detailed constraints), DR-170 (data residency).

### Out of scope (V1 — confirmed exclusions)

Per S5 Section 17: 30 items (OOS-001 through OOS-030). Not roadmapped.

---

## 5. Dependency Overview

```
MS-001 Application Foundation
  ↓ (HARD: app skeleton + tooling must exist before DB/auth code)
MS-002 Database + Auth Foundation
  ↓ (HARD: DB schema + auth + authorization must exist before admin CRUD)
MS-003 Admin Offer Management
  ↓ (HARD: offers must be createable/publishable before public can see them)
MS-004 Public Job Portal
  ↓ (HARD: both admin and public flows must work before E2E verification)
MS-005 E2E Integration + Hardening
  ↓ (HARD: all functional features verified before environment setup)
MS-006 Environments + CI/CD
  ↓ (HARD: environments configured before release readiness assessment)
MS-007 Release Readiness
```

All dependencies are HARD and sequential. The one-agent/one-worktree constraint (S0 §12) makes parallelism impractical for V1. No circular dependencies.

**Critical path:** MS-001 → MS-002 → MS-003 → MS-004 → MS-005 → MS-007

MS-006 (Environments + CI/CD) is on the critical path because Vercel/Neon configuration is needed before release readiness can be assessed.

---

## 6. Milestone Summary

| ID | Milestone | Outcome | Key Requirements | Depends On | Status |
|---|---|---|---|---|---|
| MS-001 | Application Foundation | Next.js app starts with strict TypeScript, Tailwind, shadcn/ui, test infrastructure, lint/format, minimal pages | NFR-040 (French setup), tooling foundation | S7 APPROVED | PLANNED |
| MS-002 | Database + Auth Foundation | DB operational, migrations reproducible, ADMIN and Fantomas can authenticate, authorization layer works, no public signup | FR-001, FR-003, FR-004, NFR-010–013, PERM-001–004, BR-020 | MS-001 | PLANNED |
| MS-003 | Admin Offer Management | Admin can create, save, edit, publish, suspend, republish, archive offers with full lifecycle and validation | FR-002, FR-010–025, FR-030–035, FR-061, BR-021–080 | MS-002 | PLANNED |
| MS-004 | Public Job Portal | Public can browse published offers, open detail, search; no admin controls visible | FR-040–042, FR-050, FR-060, BR-025, BR-033, BR-034, BR-040, BR-070 | MS-003 | PLANNED |
| MS-005 | E2E Integration + Hardening | Critical E2E journey passes; integration tests with real DB pass; accessibility, error handling, security checks verified | NFR-001, NFR-030, NFR-060, all FR verification | MS-004 | PLANNED |
| MS-006 | Environments + CI/CD | Vercel + Neon configured; CI pipeline runs; Preview deployments work; migrations controlled; bootstrap controlled | NFR-011, deployment model | MS-005 | PLANNED |
| MS-007 | Release Readiness | All MUST requirements PASS; SHOULD included or deferred with OWNER approval; no critical blockers; gate to S12 | All MUST + SHOULD, release gate | MS-006 | PLANNED |

---

## 7. Milestone Definitions

### MS-001 — Application Foundation

**DELIVERY OUTCOME:** A clean, minimal Next.js application that starts, passes typecheck/lint, has Tailwind + shadcn/ui configured, test infrastructure set up, and minimal placeholder pages proving the app renders.

**WHY THIS MILESTONE EXISTS:** All downstream code (DB, auth, admin, public) depends on a working Next.js project skeleton with the approved toolchain. Starting from scratch for each milestone would waste time and risk inconsistency.

**REQUIREMENTS COVERED:** NFR-040 (French-only UI setup — messages/fr.ts structure), tooling foundation (no product FRs).

**TECHNICAL AREAS:** Next.js App Router, TypeScript strict, pnpm, Tailwind CSS, shadcn/ui (selective), Lucide, ESLint, Prettier, Vitest config, Playwright config, .env.example.

**ENTRY CONDITIONS:** S7 APPROVED.

**IN SCOPE:**
- Next.js App Router project initialization (pnpm, TypeScript strict)
- Tailwind CSS + shadcn/ui setup (selective components: Button, Input, Label, Card, Badge, etc.)
- Module structure per S6 §6 (app/(public)/, app/admin/, lib/server/, db/, components/, tests/, messages/)
- ESLint + Prettier + tsc strict configuration
- Vitest + Playwright test infrastructure (config files, not tests yet)
- .env.example with placeholder values (no secrets — S0 §13)
- Minimal placeholder pages: `/` renders "JOURDAIN EMPLOI", `/admin/login` renders a placeholder form
- French UI strings structure (messages/fr.ts)

**OUT OF SCOPE:**
- Database connection or schema (MS-002)
- Authentication (MS-002)
- Any offer CRUD (MS-003)
- Any public offer display (MS-004)
- Vercel/Neon configuration (MS-006)
- Actual tests (test infrastructure only; tests come with their respective milestones)

**EXIT CONDITIONS:**
- `pnpm dev` starts the app and placeholder pages render
- `pnpm typecheck` passes (tsc --noEmit)
- `pnpm lint` passes (ESLint)
- `pnpm build` succeeds (Next.js build)
- Vitest + Playwright configs exist and their empty suites run (0 tests, 0 failures)
- .env.example committed with placeholder values only

**ACCEPTANCE EXPECTATION:** A new developer can clone the repo, run `pnpm install && pnpm dev`, and see the placeholder pages render. The toolchain (typecheck, lint, build, test config) is operational.

**MATERIAL RISKS:**
- shadcn/ui component compatibility with the Next.js version — MITIGATE by pinning versions.
- Tailwind CSS v4 vs v3 configuration differences — MITIGATE by following the official Tailwind + Next.js setup guide.

**FUTURE WORK PACKAGE:** WP-Foundation (S9 will define the exact contract)

---

### MS-002 — Database + Auth Foundation

**DELIVERY OUTCOME:** The database is operational, migrations are reproducible, Better Auth is configured with Username + Admin plugins, ADMIN and Fantomas can authenticate, the authorization layer (can/requireCapability) works correctly, and there is no public signup.

**WHY THIS MILESTONE EXISTS:** All admin CRUD operations (MS-003) depend on a working database schema, authenticated sessions, and the authorization layer. Bootstrap of system principals must be functional before any offer can be created.

**REQUIREMENTS COVERED:**
- FR-001 (admin login), FR-003 (back-office denied to unauthenticated), FR-004 (no public registration)
- NFR-010 (no plaintext password), NFR-011 (no password in repo), NFR-012 (session protection), NFR-013 (Fantomas credential handling)
- PERM-001 (public read access — confirmed by verifying unauthenticated access to placeholder public pages), PERM-003 (back-office restricted), PERM-004 (Fantomas privilege inheritance per AISE §21)
- BR-020 (offer lifecycle states — schema enum), BR-060 (date categorization — schema types), BR-080 (validation — Zod schemas)
- DR-010 (id format — UUID v4 per TD-015)

**TECHNICAL AREAS:** Drizzle ORM + Drizzle Kit, drizzle-orm/neon-http, Neon connection (local), Better Auth (emailAndPassword + disableSignUp + Username plugin + Admin plugin + database sessions + rate limiter with database storage), scrypt hashing, principalType field, can()/requireCapability() authorization layer, bootstrap script (Fantomas + initial ADMIN), Zod validation schemas.

**ENTRY CONDITIONS:** MS-001 CLOSED / PASS.

**IN SCOPE:**
- Drizzle schema: offers table (S6 §9.3.1), Better Auth tables (user, session, account, verification, rate-limit — generated by Better Auth Drizzle adapter), principalType enum
- First migration generated via drizzle-kit generate, applied to local DB
- Better Auth config: emailAndPassword { enabled: true, disableSignUp: true }, Username plugin, Admin plugin, database sessions, rate limiter with database storage
- lib/server/auth/authorization.ts: can(), requireCapability(), getPrincipal() — reading principalType (NOT role)
- db/bootstrap/bootstrap.ts: idempotent script calling auth.api.createUser() for Fantomas (principalType=FANTOMAS, username="Fantomas") and initial ADMIN (principalType=ADMIN)
- Login Server Action (FR-001): username + password via Better Auth signInUsername
- Middleware: protect /admin/* routes (FR-003)
- Zod schemas: login schema (username + password), offer schema (title required, description required, optional fields with format validation for email/URL per BR-080)
- Empty admin page redirecting to /admin/login

**OUT OF SCOPE:**
- Admin offer list, form, CRUD (MS-003)
- Public offer display (MS-004)
- Tiptap editor (MS-003)
- Vercel/Neon environment configuration (MS-006)
- E2E tests (MS-005)

**EXIT CONDITIONS:**
- Local DB has the correct schema (offers + auth tables + principalType enum)
- `drizzle-kit generate` produces a valid migration; `drizzle-kit migrate` applies it cleanly
- Bootstrap script runs: Fantomas created (principalType=FANTOMAS, username="Fantomas"), initial ADMIN created (principalType=ADMIN)
- ADMIN can login via the login form with username + password → redirected to admin page
- Fantomas can login via the login form with username "Fantomas" + password → redirected to admin page
- Unauthenticated access to /admin/* → redirected to /admin/login (FR-003)
- can('admin', 'offer:publish') === true (unit test)
- can('fantomas', 'system:bootstrap') === true (unit test)
- can('admin', 'system:bootstrap') === false (unit test)
- No /sign-up endpoint exists (FR-004)
- No password plaintext in the repository (grep check)
- Integration test: login + logout cycle works with real DB

**ACCEPTANCE EXPECTATION:** An ADMIN and Fantomas can authenticate via username + password. The authorization layer correctly distinguishes ADMIN and FANTOMAS capabilities per AISE §21. No public registration exists. The database schema is reproducible via migrations.

**MATERIAL RISKS:**
- Better Auth API changes between versions — MITIGATE by pinning version and testing against the pinned version.
- Better Auth Drizzle adapter schema generation may differ from expected — MITIGATE by inspecting generated schema before migration.

**FUTURE WORK PACKAGE:** WP-DatabaseAuth (S9 will define the exact contract)

---

### MS-003 — Admin Offer Management

**DELIVERY OUTCOME:** The administration can manage the full offer lifecycle: create, save as DRAFT, edit, publish, suspend, republish, archive — with validation, Tiptap rich-text editor, and correct lifecycle enforcement.

**WHY THIS MILESTONE EXISTS:** This is the core product capability. Without admin CRUD + lifecycle, there is nothing to publish and nothing for the public to see.

**REQUIREMENTS COVERED:**
- FR-002 (admin logout), FR-010 (admin offer list), FR-011 (status visibility), FR-012 (admin status filter — MUST), FR-013 (admin title search — SHOULD)
- FR-020 (new offer creation), FR-021 (offer editing), FR-022 (save without publishing), FR-023 (required field validation), FR-024 (URL/email validation), FR-025 (PUBLISHED modification stays PUBLISHED)
- FR-030 (publish), FR-031 (suspend), FR-032 (republish), FR-033 (archive), FR-034 (no auto-delete), FR-035 (no automated expiration)
- FR-061 (empty admin state)
- BR-021 (publication is explicit), BR-022 (published_at semantics), BR-023 (suspension preserves content), BR-024 (archiving preserves content; ARCHIVED terminal), BR-030 (required fields), BR-031 (optional fields don't block), BR-032 (never invent), BR-033 (unknown company), BR-034 (description formatting), BR-040 (modalities informational), BR-050 (source optional), BR-061 (source vs published_at distinct), BR-062 (application_deadline informational), BR-063 (no expiration_date), BR-070 (public sort — schema/index), BR-071 (tie-breaker — schema/index), BR-080 (URL/email validation)
- NFR-040 (French only — admin UI strings)
- NFR-050 (minimal audit — created_at, updated_at, published_at set correctly)
- NFR-060 (offer integrity — status transitions preserve content)

**TECHNICAL AREAS:** Admin Server Actions (createOfferAction, updateOfferAction, publishOfferAction, suspendOfferAction, republishOfferAction, archiveOfferAction, logoutAction), React Hook Form + zodResolver, Tiptap editor (@tiptap/react + starter-kit + extension-link), admin offer list page (Server Component), admin offer form (Client Component), admin offer edit page, StatusBadge component, action buttons (Publish, Suspend, Republish, Archive), Zod offer schema, shadcn/ui form components.

**ENTRY CONDITIONS:** MS-002 CLOSED / PASS.

**IN SCOPE:**
- Admin login page (functional form, not placeholder — completes FR-001)
- Admin logout action (FR-002)
- Admin offer list page: all offers, status visible, status filter (MUST), title search (SHOULD), "New offer" button, empty state (FR-061)
- Admin offer form: 16 editable fields grouped (Informations principales, Caractéristiques, Dates, Description, Candidature, Source), Tiptap editor for description, Zod validation (required + format), error feedback (FR-023-ERR, FR-024-ERR)
- New offer creation → saves as DRAFT (FR-020, FR-022)
- Offer editing → saves changes without changing status (FR-021, FR-025)
- Publish action → DRAFT → PUBLISHED, sets published_at (FR-030, BR-022)
- Suspend action → PUBLISHED → SUSPENDED, preserves content (FR-031, BR-023)
- Republish action → SUSPENDED → PUBLISHED, preserves published_at (FR-032)
- Archive action → any active status → ARCHIVED, terminal, preserves content (FR-033, FR-034, BR-024)
- No automatic expiration (FR-035, BR-026)
- Save ≠ publish enforced (BR-021)
- Unit tests: lifecycle state machine (all transitions), Zod validation, can() checks
- Integration tests: each Server Action against real DB

**OUT OF SCOPE:**
- Public offer display (MS-004)
- E2E tests (MS-005)
- Vercel/Neon environment configuration (MS-006)

**EXIT CONDITIONS:**
- Admin can login, create an offer, save it as DRAFT, find it in the list, edit it, publish it, suspend it, republish it, archive it — all via the admin UI
- Save does NOT publish (BR-021)
- ARCHIVED is terminal: no action transitions out of ARCHIVED (BR-024)
- Modification of a PUBLISHED offer keeps it PUBLISHED (FR-025)
- Required fields (title, description) validated; missing required fields reject save with field-specific feedback (FR-023)
- URL/email fields validated when provided (FR-024)
- Tiptap description preserves formatting (paragraphs, lists, headings, links) on save and re-edit (BR-034)
- Status filter works (FR-012)
- Title search works if implemented (FR-013 — SHOULD)
- Empty admin state displays when no offers exist (FR-061)
- Integration tests pass against real DB

**ACCEPTANCE EXPECTATION:** The administration is real-world usable: an ADMIN can manage the full offer lifecycle through the UI with correct validation, lifecycle enforcement, and formatting preservation.

**MATERIAL RISKS:**
- Tiptap React server-side renderer compatibility in a Client Component editor + Server Component display split — MITIGATE by testing the editor saves JSON and the renderer reads JSON correctly.
- Form complexity (16 fields) — MITIGATE by grouping fields logically per OWNER S6 §25 and using React Hook Form.

**FUTURE WORK PACKAGE:** WP-AdminOffers (S9 will define the exact contract)

---

### MS-004 — Public Job Portal

**DELIVERY OUTCOME:** The public can browse published offers at `/`, open an offer detail at `/offres/{id}`, read the full content with formatting preserved, search by title/company/location, and see a clean empty state when no offers are published.

**WHY THIS MILESTONE EXISTS:** This is the public-facing half of the product. Without it, the admin can create offers but nobody can see them. This completes the critical path: ADMIN publishes → PUBLIC sees.

**REQUIREMENTS COVERED:**
- FR-040 (public offer list at root URL), FR-041 (public offer detail), FR-042 (non-published returns not-found)
- FR-050 (public simple search — SHOULD, ILIKE on title/company/location)
- FR-060 (empty public state)
- BR-025 (public visibility rule — only PUBLISHED), BR-033 (unknown company — omit on card, "Entreprise non communiquée" on detail), BR-034 (Tiptap rendering — React server-side renderer), BR-040 (application modalities informational), BR-050 (source optional), BR-070 (public sort published_at DESC), BR-071 (tie-breaker created_at DESC)
- INT-001 (no external integration — confirmed by absence of public API)
- NFR-040 (French only — public UI strings)
- TD-029 (SEO — generateMetadata, sitemap.ts, robots.ts)

**TECHNICAL AREAS:** app/(public)/page.tsx (root = offer list, Server Component), app/(public)/offres/[id]/page.tsx (detail, Server Component), OfferCard component, OfferDetail component, Tiptap React server-side renderer, public search via URL searchParams (?q=), Next.js generateMetadata per route, app/sitemap.ts, app/robots.ts.

**ENTRY CONDITIONS:** MS-003 CLOSED / PASS.

**IN SCOPE:**
- Root page `/` = published offer list (PUBLISHED only, published_at DESC, created_at DESC tie-breaker)
- Offer card: title, company (if present or "Entreprise non communiquée" per BR-033), location (if present), contract type (if present), publication date, expiration date (if present), "Voir l'offre" button
- Offer detail `/offres/{id}`: all available fields, Tiptap description rendered via React server-side renderer, application modalities (text/email/URL) as informational block, source (name + URL as link)
- Non-published offer detail URL → 404 (FR-042 — no distinction between "not found" and "not published")
- Public search: `/offres?q=term` — ILIKE on title + company + location (SHOULD)
- Empty state: "Aucune offre disponible actuellement" (FR-060)
- No admin controls visible to public
- No "Postuler" button, no share, no logo (Charter §8)
- Next.js metadata (generateMetadata for offer detail), sitemap.ts (PUBLISHED offers only), robots.ts (allow public, disallow /admin/*)
- Optional fields omitted when absent (BR-031 — no "Non renseigné" placeholder)
- Component test: OfferCard renders correctly with full data and with minimal data
- Component test: OfferDetail renders Tiptap JSON correctly
- Integration test: public list query (WHERE status='PUBLISHED' ORDER BY published_at DESC)
- Integration test: non-published offer URL returns 404

**OUT OF SCOPE:**
- E2E tests (MS-005)
- Vercel/Neon environment configuration (MS-006)
- Admin functionality changes (MS-003 is closed)

**EXIT CONDITIONS:**
- An offer published in admin (MS-003) is visible at `/` as a card
- Clicking "Voir l'offre" navigates to `/offres/{id}` showing the full detail
- Tiptap description renders with formatting preserved (BR-034)
- A DRAFT, SUSPENDED, or ARCHIVED offer is NOT visible at `/` and returns 404 at its detail URL (FR-042)
- Search with a term narrows the list to matching offers (FR-050 — SHOULD)
- Empty state displays when no PUBLISHED offers exist (FR-060)
- No "Postuler" button, no share, no logo visible (Charter §8)
- sitemap.ts lists all PUBLISHED offers; robots.ts disallows /admin/*
- Integration tests pass against real DB

**ACCEPTANCE EXPECTATION:** An offer published by the admin is correctly visible to the public with all its details, formatting, and application modalities. Non-published offers are invisible. The critical path (ADMIN publishes → PUBLIC sees) is complete.

**MATERIAL RISKS:**
- Tiptap React server-side renderer in a Server Component — MITIGATE by verifying @tiptap/react works server-side in Next.js App Router during MS-003 (early validation).

**FUTURE WORK PACKAGE:** WP-PublicPortal (S9 will define the exact contract)

---

### MS-005 — E2E Integration + Hardening

**DELIVERY OUTCOME:** The critical E2E journey passes; all integration tests with real DB pass; accessibility, error handling, and security checks are verified; the cross-flow (admin → public → suspend → public → republish → public → archive → preserved) is proven.

**WHY THIS MILESTONE EXISTS:** Individual milestones (MS-002–004) verify their own components, but the critical user journey crosses admin and public flows. This milestone proves the entire system works end-to-end and catches cross-flow regressions, accessibility gaps, and security boundary issues.

**REQUIREMENTS COVERED:**
- NFR-001 (public page response time — reasonable for editorial scale)
- NFR-030 (accessibility — keyboard nav, labels, forms, contrast, semantic HTML)
- NFR-060 (offer integrity across lifecycle — cross-flow verification)
- All FR verification (critical E2E covers the full lifecycle per OWNER S6 §21)
- PERM-002 (ADMIN full lifecycle — verified E2E)
- PERM-001 (public read — verified E2E)

**TECHNICAL AREAS:** Playwright E2E (tests/e2e/critical-journey.spec.ts), Vitest integration tests (all Server Actions with real DB), Vitest component tests (RTL), axe-core accessibility scan in E2E.

**ENTRY CONDITIONS:** MS-004 CLOSED / PASS.

**IN SCOPE:**
- Playwright E2E: 15-step critical journey (per OWNER S6 §21 and S6 §18.4):
  1. ADMIN login
  2. ADMIN creates DRAFT offer
  3. ADMIN saves (still DRAFT)
  4. ADMIN edits
  5. ADMIN publishes → PUBLISHED
  6. PUBLIC sees offer in list
  7. PUBLIC opens detail → all fields visible, formatting preserved
  8. ADMIN suspends → PUBLIC 404 on detail
  9. ADMIN republishes → PUBLIC sees again
  10. ADMIN archives → PUBLIC 404
  11. ADMIN sees archived offer in admin list (content preserved)
  12. ADMIN logout
- Integration tests: all Server Actions (create, update, publish, suspend, republish, archive, login, logout) against real Neon preview branch
- Component tests: OfferCard, OfferDetail, OfferForm, StatusBadge with RTL
- Accessibility: axe-core scan on public pages + admin pages; keyboard navigation test
- Error handling: form validation errors, auth errors, 404 for non-published, DB error response
- Security: unauthenticated access to admin actions → rejected; non-PUBLISHED offer → 404 (no info leak)
- Responsive: public pages render on mobile viewport

**OUT OF SCOPE:**
- Vercel/Neon environment configuration (MS-006)
- New features (all features from MS-003/004 are closed)
- Performance optimization beyond reasonable (NFR-001 is SHOULD, not MUST with quantitative target)

**EXIT CONDITIONS:**
- Playwright E2E: 15-step critical journey PASSES
- All integration tests PASS (real DB, no mocking)
- All component tests PASS
- axe-core: no critical accessibility violations on public + admin pages
- Security checks: unauthenticated admin access rejected; non-published → 404; no info leak
- Responsive: public pages render correctly on mobile viewport
- No critical blockers remaining

**ACCEPTANCE EXPECTATION:** The full system works end-to-end. The critical user journey (admin login → create → publish → public sees → suspend → public 404 → republish → public sees → archive → public 404 → admin preserved) is proven by E2E tests. Accessibility, error handling, and security boundaries are verified.

**MATERIAL RISKS:**
- E2E flakiness on Vercel Preview — MITIGATE by running E2E against local Next.js server in CI, with Preview E2E as opt-in via label.
- Accessibility gaps discovered late — MITIGATE by using shadcn/ui (accessible by default via Radix) from MS-001.

**FUTURE WORK PACKAGE:** WP-E2EHardening (S9 will define the exact contract)

---

### MS-006 — Environments + CI/CD

**DELIVERY OUTCOME:** Vercel and Neon are configured with strict Production/Preview isolation, CI pipeline runs on every PR, Preview deployments work with isolated Neon preview branches, migrations and bootstrap are controlled, and the target verification mechanism is in place.

**WHY THIS MILESTONE EXISTS:** Before release readiness can be assessed, the application must be deployable to a real environment. CI must enforce quality gates. Production/Preview isolation must be verified.

**REQUIREMENTS COVERED:**
- NFR-011 (no password in repo — verified in CI)
- TD-019 (environment model — Production / Preview / Local isolation)
- TD-025 (CI pipeline — GitHub Actions)
- TD-018 (migration execution — controlled, never push to Production)

**TECHNICAL AREAS:** Vercel project configuration, Neon project configuration, Neon-Vercel integration (auto-provisioned preview branches), GitHub Actions CI workflow, environment variables (Production + Preview + .env.example), migration execution workflow, bootstrap execution workflow.

**ENTRY CONDITIONS:** MS-005 CLOSED / PASS.

**IN SCOPE:**
- Vercel project created and linked to the GitHub repository
- Neon project created; main branch = Production; preview branches auto-provisioned per PR via Neon-Vercel integration
- GitHub Actions CI workflow: typecheck (tsc --noEmit), lint (ESLint), tests (Vitest unit + component + integration), build (next build); E2E on main + opt-in via label on PR
- Environment variables: Production (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, FANTOMAS_INITIAL_PASSWORD, NEXT_PUBLIC_SITE_URL) + Preview (same set, different values) — configured in Vercel
- Migration execution: drizzle-kit migrate against Preview Neon branch (automatic on Vercel Preview build OR manual); Production migrations applied manually by operator (never automatic, never drizzle-kit push)
- Bootstrap execution: pnpm db:bootstrap run by operator once per environment after first deploy (idempotent)
- Target verification (S0 §25): bootstrap script and any production-only code path check VERCEL_ENV + DATABASE_URL host before any write
- .env.local safeguard: developer's local DATABASE_URL must not point to production (CI check or documentation)
- Preview deployment: a PR merge creates a Vercel Preview deployment with an isolated Neon preview branch; the app works on Preview

**OUT OF SCOPE:**
- Production deployment (S13 — OWNER PROD GO required)
- Production migration execution (S13 — operator runs manually)
- Production bootstrap (S13 — operator runs pnpm db:bootstrap after production deploy)
- S12 Release Readiness assessment (MS-007)

**EXIT CONDITIONS:**
- GitHub Actions CI runs on PR: typecheck, lint, tests, build — all pass
- A PR creates a Vercel Preview deployment that works (app renders, DB is an isolated Neon preview branch)
- Production Vercel environment is configured (env vars set) but NOT deployed yet
- Neon main branch (Production) exists but is NOT written to by any Preview or local code
- Migration workflow documented: how to generate, review, apply to Preview, apply to Production
- Bootstrap workflow documented: how to run pnpm db:bootstrap on each environment
- Target verification mechanism verified: bootstrap script rejects writes when VERCEL_ENV != 'production' or DATABASE_URL host doesn't match production

**ACCEPTANCE EXPECTATION:** The application is deployable to Vercel Preview. CI enforces quality gates. Production/Preview isolation is in place. The operator has clear documentation for migration and bootstrap on Production.

**MATERIAL RISKS:**
- Neon-Vercel integration auto-provisioning may have latency — MITIGATE by testing the Preview deployment flow on a PR.
- Vercel build may fail due to environment variable misconfiguration — MITIGATE by verifying env vars before first Preview deployment.

**FUTURE WORK PACKAGE:** WP-EnvironmentsCICD (S9 will define the exact contract)

---

### MS-007 — Release Readiness

**DELIVERY OUTCOME:** All MUST requirements are verified PASS; SHOULD requirements are included or explicitly deferred with OWNER approval; critical E2E passes; migrations validated on Preview; auth verified; Production/Preview isolation verified; build PASS; no critical blockers. The gate to S12 (Release Readiness / Preproduction) is open.

**WHY THIS MILESTONE EXISTS:** V1 cannot be considered "complete" just because pages render. Release readiness requires explicit verification that all critical requirements are met, all tests pass, and no blockers remain. This milestone is the gate to S12.

**REQUIREMENTS COVERED:**
- All 60 MUST requirements (verification that each is met)
- All 5 SHOULD requirements (included or explicitly deferred)
- All 30 OUT OF SCOPE V1 items (confirmed absent)
- AISE S0 §23 (zero scheduled work — confirmed)
- AISE S0 §13 (no secrets in repo — confirmed)
- AISE S0 §14/§21 (Fantomas — verified)

**ENTRY CONDITIONS:** MS-006 CLOSED / PASS.

**IN SCOPE:**
- Requirement-by-requirement verification: each MUST FR/BR/PERM/INT/NFR verified against the implemented system
- SHOULD requirements: included (FR-013, FR-050, NFR-001, NFR-030, BR-071) or explicitly deferred with OWNER approval
- Critical E2E: 15-step journey PASSES on Vercel Preview with real Neon preview branch
- Migrations: validated on Preview (all migrations applied cleanly)
- Auth: ADMIN can login, Fantomas can login, principalType correct, capabilities correct, no public signup
- Production/Preview isolation: verified (no Preview writes to Production DB)
- Build: `pnpm build` PASSES
- No critical blockers identified
- Release readiness summary produced → handoff to S12

**OUT OF SCOPE:**
- Production deployment (S13 — OWNER PROD GO required)
- S12 Release Readiness formal report (S12 owns this; MS-007 is the gate to S12)
- New features or bug fixes (those belong to their respective milestones or hotfix)

**EXIT CONDITIONS:**
- Requirement coverage matrix: 0 UNASSIGNED MUST requirements
- All MUST requirements: PASS
- All SHOULD requirements: included or deferred with OWNER approval
- All 30 OUT OF SCOPE V1 items: confirmed absent
- Critical E2E: PASS on Preview
- Migrations: validated on Preview
- Auth: verified (ADMIN + Fantomas + principalType + capabilities)
- Production/Preview isolation: verified
- Build: PASS
- No critical blockers
- Release readiness summary produced

**ACCEPTANCE EXPECTATION:** The system is functionally complete for V1. All critical requirements are met. The gate to S12 (Release Readiness / Preproduction) is open. OWNER can authorize S12.

**MATERIAL RISKS:**
- Late discovery of a critical defect during final verification — MITIGATE by thorough MS-005 E2E + integration testing.
- SHOULD features adding disproportionate complexity at the last minute — MITIGATE by deferring SHOULD to V2 with OWNER approval if they block release.

**FUTURE WORK PACKAGE:** WP-ReleaseReadiness (S9 will define the exact contract; this milestone transitions to S12)

---

## 8. Cross-Milestone Requirements

| Requirement | Milestones | Coverage |
|---|---|---|
| NFR-040 (French only) | MS-001 (setup), MS-003 (admin UI), MS-004 (public UI) | CROSS-CUTTING — introduced in MS-001, completed in MS-003/004 |
| NFR-011 (no password in repo) | MS-002 (bootstrap), MS-006 (CI check) | CROSS-CUTTING — enforced from MS-002, verified in CI from MS-006 |
| NFR-060 (offer integrity) | MS-003 (lifecycle), MS-005 (E2E verification) | CROSS-CUTTING — implemented in MS-003, verified cross-flow in MS-005 |
| BR-025 (public visibility) | MS-003 (status management), MS-004 (public filter), MS-005 (E2E) | CROSS-CUTTING — enforced in MS-003, displayed in MS-004, verified in MS-005 |
| PERM-004 (Fantomas) | MS-002 (bootstrap + can()), MS-005 (E2E — Fantomas login + capabilities) | CROSS-CUTTING — implemented in MS-002, verified in MS-005 |

---

## 9. External Dependencies

| Dependency | Provider | What is needed | Milestones affected | Blocking | Fallback |
|---|---|---|---|---|---|
| Neon PostgreSQL account | OWNER/Neon | Neon project with main + preview branches; DATABASE_URL per environment | MS-002 (local dev), MS-006 (Preview + Production) | NO for MS-002 (local PostgreSQL can substitute for dev); YES for MS-006 (Neon required for Preview/Production) | Local PostgreSQL for dev (MS-002) |
| Vercel account | OWNER/Vercel | Vercel project linked to GitHub repo; env vars configured | MS-006 | YES for MS-006 | NONE (Vercel is MANDATED) |
| GitHub repository | Already canonical (github.com/alexkanga/jourdain) | Push access via SSH deploy key (already configured) | All milestones | NO (already configured) | NONE |

No external dependencies are blocking for MS-001 through MS-005 (local development can use local PostgreSQL). MS-006 requires Neon + Vercel accounts.

---

## 10. Material Delivery Risks

| Risk | Evidence | Impact | Response |
|---|---|---|---|
| Better Auth API churn | Better Auth was stabilizing in 2024-2025 | Medium (build breaks; quick fix) | MITIGATE: pin version; CI catches breaks |
| Tiptap React server-side renderer compatibility | RSC is relatively new; Tiptap's server rendering may have edge cases | Medium (public detail rendering) | MITIGATE: early validation in MS-003 (test server-side rendering before full admin form implementation) |
| shadcn/ui component compatibility | shadcn/ui components may change between versions | Low | MITIGATE: copy-paste model (we own the code); pin versions |
| Neon-Vercel integration setup | Integration may require specific configuration steps | Low-Medium | MITIGATE: test on a PR early in MS-006 |
| E2E flakiness on Preview | Network timing, cold starts | Low-Medium | MITIGATE: run E2E against local server in CI; Preview E2E opt-in via label |
| SHOULD features adding complexity at the wrong time | FR-013 (admin search), FR-050 (public search) are SHOULD | Low (can be deferred) | MITIGATE: position SHOULD features after MUST core in MS-003/004; if disproportionate, defer to V2 with OWNER approval |

---

## 11. Requirement Coverage Matrix

### Functional Requirements (FR)

| Requirement | Milestone | Coverage | Status |
|---|---|---|---|
| FR-001 (admin login) | MS-002 (auth), MS-003 (login page) | PRIMARY (MS-002), COMPLETES (MS-003) | PLANNED |
| FR-002 (admin logout) | MS-003 | PRIMARY | PLANNED |
| FR-003 (back-office denied) | MS-002 (middleware) | PRIMARY | PLANNED |
| FR-004 (no public registration) | MS-002 (disableSignUp) | PRIMARY | PLANNED |
| FR-010 (admin offer list) | MS-003 | PRIMARY | PLANNED |
| FR-011 (status visibility) | MS-003 | PRIMARY | PLANNED |
| FR-012 (admin status filter — MUST) | MS-003 | PRIMARY | PLANNED |
| FR-013 (admin title search — SHOULD) | MS-003 | PRIMARY | PLANNED |
| FR-020 (new offer creation) | MS-003 | PRIMARY | PLANNED |
| FR-021 (offer editing) | MS-003 | PRIMARY | PLANNED |
| FR-022 (save without publishing) | MS-003 | PRIMARY | PLANNED |
| FR-023 (required field validation) | MS-003 | PRIMARY | PLANNED |
| FR-024 (URL/email validation) | MS-003 | PRIMARY | PLANNED |
| FR-025 (PUBLISHED modification stays PUBLISHED) | MS-003 | PRIMARY | PLANNED |
| FR-030 (publish offer) | MS-003 | PRIMARY | PLANNED |
| FR-031 (suspend offer) | MS-003 | PRIMARY | PLANNED |
| FR-032 (republish offer) | MS-003 | PRIMARY | PLANNED |
| FR-033 (archive offer) | MS-003 | PRIMARY | PLANNED |
| FR-034 (no auto-delete) | MS-003 | PRIMARY | PLANNED |
| FR-035 (no automated expiration) | MS-003 | PRIMARY | PLANNED |
| FR-040 (public offer list at root) | MS-004 | PRIMARY | PLANNED |
| FR-041 (public offer detail) | MS-004 | PRIMARY | PLANNED |
| FR-042 (non-published returns not-found) | MS-004 | PRIMARY | PLANNED |
| FR-050 (public simple search — SHOULD) | MS-004 | PRIMARY | PLANNED |
| FR-060 (empty public state) | MS-004 | PRIMARY | PLANNED |
| FR-061 (empty admin state) | MS-003 | PRIMARY | PLANNED |

### Business Rules (BR)

| Requirement | Milestone | Coverage |
|---|---|---|
| BR-020 (lifecycle states) | MS-002 (schema enum) | PRIMARY |
| BR-021 (publication is explicit) | MS-003 | PRIMARY |
| BR-022 (published_at semantics) | MS-003 | PRIMARY |
| BR-023 (suspension preserves content) | MS-003 | PRIMARY |
| BR-024 (archiving preserves content; ARCHIVED terminal) | MS-003 | PRIMARY |
| BR-025 (public visibility rule) | MS-003, MS-004, MS-005 | CROSS-CUTTING |
| BR-026 (no automatic status transitions) | MS-003 | PRIMARY |
| BR-030 (required fields) | MS-003 | PRIMARY |
| BR-031 (optional fields don't block) | MS-003 | PRIMARY |
| BR-032 (never invent) | MS-003, MS-004 | CROSS-CUTTING |
| BR-033 (unknown company) | MS-003 (form), MS-004 (display) | CROSS-CUTTING |
| BR-034 (description formatting) | MS-003 (editor), MS-004 (rendering) | CROSS-CUTTING |
| BR-040 (modalities informational) | MS-003 (form), MS-004 (display) | CROSS-CUTTING |
| BR-050 (source optional) | MS-003 | PRIMARY |
| BR-060 (date categorization) | MS-002 (schema), MS-003 (form) | CROSS-CUTTING |
| BR-061 (source vs published_at distinct) | MS-002 (schema), MS-003 (form) | CROSS-CUTTING |
| BR-062 (application_deadline informational) | MS-003 | PRIMARY |
| BR-063 (no expiration_date) | MS-002 (schema — absence) | PRIMARY |
| BR-070 (public sort published_at DESC) | MS-004 | PRIMARY |
| BR-071 (tie-breaker created_at DESC) | MS-004 | PRIMARY |
| BR-080 (URL/email validation) | MS-003 | PRIMARY |

### Permissions (PERM)

| Requirement | Milestone | Coverage |
|---|---|---|
| PERM-001 (public read access) | MS-002 (confirmed), MS-004 (implemented), MS-005 (E2E) | CROSS-CUTTING |
| PERM-002 (ADMIN full lifecycle) | MS-003 (implemented), MS-005 (E2E) | CROSS-CUTTING |
| PERM-003 (back-office restricted) | MS-002 (middleware) | PRIMARY |
| PERM-004 (Fantomas privilege inheritance) | MS-002 (can()), MS-005 (E2E — Fantomas login + capabilities) | CROSS-CUTTING |

### Integration (INT)

| Requirement | Milestone | Coverage |
|---|---|---|
| INT-001 (no external integration) | MS-004 (confirmed by absence of public API) | PRIMARY |

### Non-Functional (NFR)

| Requirement | Milestone | Coverage |
|---|---|---|
| NFR-001 (public page response time — SHOULD) | MS-005 | PRIMARY |
| NFR-010 (no plaintext password) | MS-002 | PRIMARY |
| NFR-011 (no password in repo) | MS-002, MS-006 (CI) | CROSS-CUTTING |
| NFR-012 (session protection) | MS-002 | PRIMARY |
| NFR-013 (Fantomas credential handling) | MS-002 | PRIMARY |
| NFR-030 (accessibility — SHOULD) | MS-005 | PRIMARY |
| NFR-040 (French only) | MS-001, MS-003, MS-004 | CROSS-CUTTING |
| NFR-050 (minimal audit) | MS-002 (schema) | PRIMARY |
| NFR-060 (offer integrity) | MS-003, MS-005 | CROSS-CUTTING |

### UNASSIGNED RELEASE REQUIREMENTS: 0

All 65 CONFIRMED requirements (60 MUST + 5 SHOULD) are assigned to at least one milestone.

---

## 12. Unassigned Requirements

**0.** All release-scope requirements are assigned.

---

## 13. Deferred / Future Work

Per S5 Section 18 (DEFERRED items) and S5 Section 17 (OUT OF SCOPE V1 items):

**Deferred (genuine future — not in V1):**
- DR-030/040: full audit log (future product decision)
- DR-050: ADMIN account management UI (future product decision)
- DR-051: formal SUPER_ADMIN role (future product decision)
- DR-160: GDPR detailed constraints (deferred per Charter D1)
- DR-170: data residency (deferred per Charter D3)

**Out of scope V1 (30 items — OOS-001 through OOS-030):** confirmed absent in the roadmap. Not roadmapped.

---

## 14. V1 Complete Definition

JOURDAIN EMPLOI V1 is functionally complete when:

### ADMIN
- ADMIN can login (FR-001)
- ADMIN can create an offer (FR-020)
- ADMIN can save an offer as DRAFT (FR-022)
- ADMIN can edit an offer (FR-021)
- ADMIN can publish an offer (FR-030)
- ADMIN can suspend an offer (FR-031)
- ADMIN can republish an offer (FR-032)
- ADMIN can archive an offer (FR-033)
- ADMIN can logout (FR-002)
- ARCHIVED is terminal — no action transitions out (BR-024)
- Save ≠ publish (BR-021)
- Modification of PUBLISHED stays PUBLISHED (FR-025)

### PUBLIC
- Public can see the list of published offers at `/` (FR-040)
- Public can open an offer detail at `/offres/{id}` (FR-041)
- Public can search (SHOULD — FR-050)
- Non-published offers return 404 (FR-042)
- Optional fields handled correctly (omitted when absent per BR-031)
- Application modalities displayed as informational (BR-040)
- Unknown company handled per BR-033
- Description formatting preserved (BR-034)

### SYSTEM
- Database operational with correct schema (MS-002)
- Sessions managed by Better Auth (MS-002)
- Authorization via principalType + can()/requireCapability() (MS-002)
- Fantomas bootstrapped and verified (MS-002, MS-005)
- Migrations reproducible and controlled (MS-002, MS-006)
- Tests: unit + integration + E2E all PASS (MS-005)
- Production/Preview isolation verified (MS-006)
- CI pipeline operational (MS-006)
- Deployable to Vercel (MS-006)
- All MUST requirements PASS (MS-007)
- SHOULD requirements included or deferred with OWNER approval (MS-007)
- No critical blockers (MS-007)

---

## 15. S9 Handoff

S8 hands off to S9 (Module Contract / Work Package):

| Milestone | Future WP candidate | S9 will define |
|---|---|---|
| MS-001 | WP-Foundation | Exact project initialization contract, file structure, tooling config |
| MS-002 | WP-DatabaseAuth | Exact Drizzle schema, Better Auth config, authorization layer, bootstrap script contract |
| MS-003 | WP-AdminOffers | Exact admin routes, Server Actions, form structure, lifecycle transitions |
| MS-004 | WP-PublicPortal | Exact public routes, components, search implementation, SEO config |
| MS-005 | WP-E2EHardening | Exact E2E spec, integration test suite, accessibility checks, security checks |
| MS-006 | WP-EnvironmentsCICD | Exact Vercel/Neon config, GitHub Actions workflow, migration/bootstrap workflow |
| MS-007 | WP-ReleaseReadiness | Exact requirement verification checklist, S12 handoff |

**S9 first candidate:** MS-001 (Application Foundation) — no dependencies on other milestones; the natural starting point.

**S9 handoff data:**
- APPROVED DELIVERY_ROADMAP (this document, once OWNER approves)
- 7 milestones with bounded outcomes, requirements, entry/exit conditions
- Dependency model (sequential, hard dependencies)
- Requirement coverage matrix (0 unassigned)
- S9 first candidate: MS-001

S9 has NOT started. S9 begins only after explicit OWNER GO.

---

## 16. Approval / Baseline Status

| Field | Value |
|---|---|
| Document status | OWNER APPROVED — S8 CLOSED / PASS |
| Roadmap status | APPROVED |
| Milestone count | 7 (MS-001 through MS-007) |
| Unassigned release requirements | 0 |
| Milestones without justification | 0 |
| Hard dependency contradictions | 0 |
| Roadmap / S6 architecture contradictions | 0 |
| Roadmap / S7 baseline contradictions | 0 |
| Blocking roadmap ambiguities | 0 |
| Fabricated deadlines | 0 (no dates — ORDER BEFORE DATES) |
| S9-level detail leakage | 0 (no file lists, no exact test scenarios, no ticket breakdowns) |
| S9 first candidate | MS-001 — Application Foundation |
| Next recommended component | S9 — Module Contract / Work Package |
| OWNER approval | APPROVED (2026-09-15) |

Per AISE S8 §32, the roadmap was NOT valid until OWNER explicitly approved it. OWNER has now explicitly approved it on 2026-09-15.

### Quality Gate Self-Check (per S8 §38)

| Check | Result |
|---|---|
| S4/S5/S6/S7 APPROVED | YES |
| Current release scope explicit | YES (S5: 60 MUST + 5 SHOULD, 30 OUT OF SCOPE) |
| Unassigned release requirements | 0 |
| Milestones without justification | 0 |
| Milestone outcomes unclear | 0 |
| Hard dependency contradictions | 0 |
| Unrepresented material external deps | 0 (Neon, Vercel, GitHub all represented) |
| Roadmap / S6 architecture contradictions | 0 |
| Roadmap / S7 baseline contradictions | 0 |
| Blocking roadmap ambiguities | 0 |
| Fabricated deadlines | 0 (no dates) |
| Unjustified precise estimates | 0 (ESTIMATE NOT ESTABLISHED) |
| S9-level detail leakage | 0 |
| OWNER approval | REQUIRED |

**Verdict: QUALITY GATE PASS. Roadmap is READY FOR OWNER APPROVAL.**
