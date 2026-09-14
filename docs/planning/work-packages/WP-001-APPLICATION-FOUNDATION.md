# WP-001 — Application Foundation

## 1. Contract Status

| Field | Value |
|---|---|
| WP ID | WP-001 |
| Name | Application Foundation |
| Source Milestone | MS-001 — Application Foundation (DELIVERY_ROADMAP §7) |
| Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| S8 Approved Baseline | `2796c2d0cd76673c2ab4ecfdc8357c01f0c1a88a` |
| Canonical Main SHA (at S9 start) | `36369ab983d72d490c4738b1c0d0e0e12b8e4396` |
| Source Charter (S4) | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Source Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| Source Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` at `7c85323` |
| Source Project Manifest (S7) | `docs/architecture/PROJECT_MANIFEST.md` at `0b8b436` |
| Source Delivery Roadmap (S8) | `docs/planning/DELIVERY_ROADMAP.md` at `2796c2d` |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED (requires OWNER APPROVE + AUTHORIZE) |

---

## 2. Purpose

Create the minimal technical foundation on which all subsequent Work Packages will be built: a clean Next.js App Router application that starts, compiles, passes typecheck/lint/build, uses the approved toolchain (pnpm, TypeScript strict, Tailwind CSS), respects the modular structure from S6/S7, and has minimal test infrastructure — without any business logic, database, auth, or infrastructure configuration.

---

## 3. Requirements Covered

**REQUIREMENTS COVERED NOW (this WP):**

| Requirement | Coverage | Notes |
|---|---|---|
| NFR-040 (French only) | PARTIAL — French UI strings structure (messages/fr.ts) is set up; actual UI strings will be completed in WP-AdminOffers and WP-PublicPortal | Foundation sets the structure |

**MILESTONE REQUIREMENTS NOT IN THIS WP:**

All other MS-001 requirements (tooling foundation) are covered by this WP as technical prerequisites, not as S5 requirement IDs. MS-001 does not have specific S5 FR/BR/PERM/INT requirements — it is a foundation milestone. The S5 requirements (FR-001 through FR-061, BR-020 through BR-080, PERM-001 through PERM-004, INT-001, NFR-001 through NFR-060) are assigned to MS-002 through MS-007 per the DELIVERY_ROADMAP requirement coverage matrix.

**ORPHAN SCOPE: 0** — everything in this WP is justified by MS-001 (Application Foundation) from the approved Delivery Roadmap.

---

## 4. Entry Conditions

- S8 DELIVERY_ROADMAP: APPROVED ✅ (at `2796c2d`)
- MS-001 selected as first milestone ✅ (S8 §14 handoff)
- MS-001 entry conditions: "S7 APPROVED" ✅
- BLOCKING PRODUCT AMBIGUITIES: 0 ✅
- BLOCKING TECHNICAL AMBIGUITIES: 0 ✅ (all 31 TDs DECIDED or MANDATED in S6)
- Technical baseline (S6/S7): APPROVED ✅

---

## 5. In Scope

### Next.js Application Initialization
- Next.js App Router project initialized with `pnpm create next-app` (or equivalent manual setup) using TypeScript, App Router, Tailwind CSS, ESLint
- `pnpm` as package manager with `pnpm-lock.yaml` committed
- TypeScript strict mode in `tsconfig.json`

### Module Structure (per S6 §6 / S7 §4)
Minimal directory structure — only directories that will contain actual files in this WP:
```
app/
  layout.tsx          — root layout (html, body, global styles)
  page.tsx            — root page (minimal JOURDAIN EMPLOI placeholder)
  globals.css         — Tailwind CSS global imports
components/           — empty for now (shadcn/ui components added in later WPs as needed)
lib/
  server/             — empty for now (DB, auth, services added in WP-DatabaseAuth)
messages/
  fr.ts               — French UI strings structure (minimal placeholder object)
```

**NOT created (premature — belong to future WPs):**
- `app/admin/` — WP-DatabaseAuth / WP-AdminOffers
- `app/(public)/` — WP-PublicPortal
- `lib/server/auth/` — WP-DatabaseAuth
- `lib/server/db.ts` — WP-DatabaseAuth
- `lib/server/services/` — WP-DatabaseAuth / WP-AdminOffers
- `lib/server/validation/` — WP-DatabaseAuth / WP-AdminOffers
- `db/` — WP-DatabaseAuth
- `tests/` — WP-E2EHardening (test infrastructure minimal here; full tests in later WPs)

### Configuration Files
- `package.json` — project metadata, scripts (dev, build, lint, typecheck, test), dependencies
- `pnpm-lock.yaml` — lockfile
- `tsconfig.json` — TypeScript strict configuration
- `next.config.ts` (or `.mjs`) — Next.js configuration (minimal)
- `eslint.config.mjs` (or `.json`) — ESLint configuration with Next.js + TypeScript rules
- `.prettierrc` — Prettier configuration (per TD-027)
- Tailwind CSS configuration (per the installed Tailwind version — `tailwind.config.ts` for v3 or CSS-based config for v4)

### Root Page
- `app/page.tsx` — minimal page rendering "JOURDAIN EMPLOI" heading and a brief description. French only (NFR-040). No business logic, no DB, no offers.
- This page serves solely to verify the application starts and renders. It does NOT anticipate WP-PublicPortal.

### Test Infrastructure (Minimal — per MS-001 / ADR-0008)
- Vitest configuration (`vitest.config.ts`) — minimal, ready to run
- One smoke test verifying the root page renders "JOURDAIN EMPLOI" (component test using RTL)
- Playwright configuration (`playwright.config.ts`) — minimal, ready to run; NO E2E tests in this WP (full E2E belongs to WP-E2EHardening / MS-005)
- Empty test suites run successfully (0 failures)

### Environment Example
- `.env.example` — placeholder values only (no real secrets per S0 §13):
  ```
  DATABASE_URL=postgresql://user:password@host/db?sslmode=require
  BETTER_AUTH_SECRET=generate-a-32+-char-random-string
  BETTER_AUTH_URL=http://localhost:3000
  FANTOMAS_INITIAL_PASSWORD=set-at-first-deploy-then-rotate
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```
- `.gitignore` — includes `.env.local`, `node_modules`, `.next`, `dist`, etc.

### Package Scripts
The following scripts must be defined in `package.json`:
- `dev` — `next dev`
- `build` — `next build`
- `start` — `next start`
- `lint` — `next lint` (or `eslint .`)
- `typecheck` — `tsc --noEmit`
- `test` — `vitest run`
- `test:watch` — `vitest`

---

## 6. Out of Scope

### Database (WP-DatabaseAuth / MS-002)
- Neon, Drizzle ORM, Drizzle Kit, schema, migrations, DATABASE_URL usage — all EXCLUDED

### Authentication (WP-DatabaseAuth / MS-002)
- Better Auth, Username plugin, Admin plugin, sessions, rate limiting, scrypt, auth.api.createUser, login/logout actions — all EXCLUDED

### Authorization (WP-DatabaseAuth / MS-002)
- principalType, can(), requireCapability(), getPrincipal(), middleware — all EXCLUDED

### Admin Business (WP-AdminOffers / MS-003)
- Login page (functional), offer list, offer form, Tiptap editor, create/edit/publish/suspend/republish/archive actions, admin layout — all EXCLUDED

### Public Business (WP-PublicPortal / MS-004)
- Offer list, offer detail, /offres/{id}, search, OfferCard, OfferDetail, SEO metadata, sitemap.ts, robots.ts — all EXCLUDED

### Delivery (WP-EnvironmentsCICD / MS-006)
- Vercel configuration, GitHub Actions CI, Neon Preview/Production, environment setup — all EXCLUDED

### E2E (WP-E2EHardening / MS-005)
- Playwright E2E test suite, 15-step critical journey, integration tests with real DB — all EXCLUDED

### shadcn/ui Components
- Mass-generating shadcn/ui components is EXCLUDED. Components are added in later WPs when actually needed (e.g., Button and Input for login form in WP-DatabaseAuth, Form + Textarea for offer form in WP-AdminOffers).

### Lucide Icons
- Installing Lucide is EXCLUDED unless an icon is actually used in the root page (unlikely in a minimal placeholder).

---

## 7. Intended Behavior

### Root Page (`/`)
- Renders an HTML page with:
  - A `<h1>` heading containing "JOURDAIN EMPLOI"
  - A brief French description paragraph (e.g., "Portail de publication et de consultation d'offres d'emploi")
  - Clean, minimal styling via Tailwind CSS
  - Responsive (mobile + desktop)
- No database access, no auth, no server actions, no API routes
- Server Component (no client-side JavaScript needed)

### Root Layout
- Sets `<html lang="fr">` (NFR-040 — French only)
- Imports Tailwind global CSS
- Renders children

### French UI Strings
- `messages/fr.ts` exports a minimal object with at least:
  ```typescript
  export const fr = {
    siteName: "JOURDAIN EMPLOI",
    siteDescription: "Portail de publication et de consultation d'offres d'emploi",
  };
  ```
- Structure is extensible for future WPs to add admin and public UI strings

### Smoke Test
- One Vitest component test: renders `app/page.tsx`, asserts "JOURDAIN EMPLOI" appears in the document
- Uses React Testing Library + Vitest
- No DB mocking, no auth mocking (none needed — page has no dependencies)

---

## 8. Business Rules

No business rules from S5 are in scope for this WP. MS-001 is a foundation milestone with no S5 BR requirements.

---

## 9. Data Semantics

No data entities, no database, no schema, no migrations in this WP.

**MIGRATION REQUIRED: NO**

---

## 10. Permission / Actor Semantics

No authentication or authorization in this WP. The root page is public (no auth check needed).

---

## 11. Technical Boundaries (S6/S7 Architecture Constraints)

- **Architecture (ADR-0001):** Modular monolith Next.js full-stack. Single app. No separate backend.
- **App Router (MANDATED):** Next.js App Router (not Pages Router).
- **TypeScript strict (MANDATED):** `strict: true` in `tsconfig.json`.
- **Tailwind CSS (DECIDED, TD-010):** Tailwind CSS for styling. No styled-components, no CSS-in-JS.
- **pnpm (DECIDED, TD-017):** pnpm as package manager with lockfile committed.
- **ESLint + Prettier + tsc strict (DECIDED, TD-027):** All three configured and passing.
- **Vitest + RTL (DECIDED, TD-024 / ADR-0008):** Vitest for unit/component tests. RTL for component tests.
- **Playwright (DECIDED, TD-024 / ADR-0008):** Playwright configured but no E2E tests in this WP.
- **No dependencies outside the approved stack:** Every package added must correspond to an S6/S7 decision or a concrete WP-Foundation need (S9 §10 package policy).

---

## 12. Interfaces / Integration Boundaries

No APIs, no external integrations, no webhooks in this WP. The root page is a simple Server Component.

---

## 13. Error / Edge Semantics

- Application must start without errors on `pnpm dev`
- Build must succeed without errors on `pnpm build`
- No console errors when loading `/` in a browser
- If a dependency fails to install, CONTRACT DIVERGENCE DETECTED — report and stop

---

## 14. Acceptance Contract

| # | Condition | Observable Evidence |
|---|---|---|
| AC-001 | Next.js App Router project is initialized | `app/layout.tsx` and `app/page.tsx` exist; App Router is used (not Pages Router) |
| AC-002 | TypeScript strict is active | `tsconfig.json` has `strict: true`; `pnpm typecheck` passes (exit code 0) |
| AC-003 | pnpm is the package manager | `pnpm-lock.yaml` exists and is committed; `package.json` has pnpm scripts |
| AC-004 | Tailwind CSS is operational | `app/globals.css` imports Tailwind; `app/page.tsx` uses Tailwind classes; styles render in browser |
| AC-005 | ESLint passes | `pnpm lint` exits with code 0 |
| AC-006 | Production build passes | `pnpm build` exits with code 0; `.next/` is generated |
| AC-007 | Root page renders | `pnpm dev` starts; navigating to `http://localhost:3000` shows "JOURDAIN EMPLOI" heading |
| AC-008 | French language is set | `<html lang="fr">` in the rendered HTML |
| AC-009 | Smoke test passes | `pnpm test` exits with code 0; the smoke test verifies "JOURDAIN EMPLOI" appears in the rendered page |
| AC-010 | No DB/auth/business code exists | No files importing from `db/`, `lib/server/auth/`, `lib/server/db`, or Better Auth, Drizzle, or Tiptap packages |
| AC-011 | No secrets in repository | `grep -r` for password patterns in tracked files returns only `.env.example` placeholders |
| AC-012 | No premature shadcn/ui mass-generation | No `components/ui/` directory with unused components (empty or absent is acceptable) |
| AC-013 | Module structure conforms to S6/S7 | `app/`, `components/`, `lib/server/`, `messages/` directories exist; no premature `app/admin/`, `app/(public)/`, `db/`, `tests/` directories |
| AC-014 | Playwright config exists | `playwright.config.ts` exists; empty Playwright suite runs (0 tests, 0 failures) |
| AC-015 | .env.example exists with placeholders only | `.env.example` is committed with placeholder values; `.env.local` is gitignored |
| AC-016 | Responsive | Root page renders acceptably on mobile and desktop viewports (manual verification) |

---

## 15. Verification Expectations (S11 Evidence)

S10 must provide:
- List of all files created/modified
- Output of `pnpm install` (success)
- Output of `pnpm lint` (PASS)
- Output of `pnpm typecheck` (PASS)
- Output of `pnpm test` (PASS — smoke test)
- Output of `pnpm build` (PASS)
- Screenshot or manual confirmation of root page rendering at `http://localhost:3000`
- `git diff --stat` summary
- Git commit (focused, identifiable as WP-Foundation)
- Worktree state (CLEAN after commit)

---

## 16. Forbidden Expansion

S10 MUST NOT:
- Create database schema, migrations, or Drizzle configuration
- Install or configure Better Auth, Username plugin, or Admin plugin
- Create any authentication or authorization code
- Create admin pages, offer forms, or lifecycle actions
- Create public offer list, detail, or search pages
- Install Tiptap or any rich-text editor
- Install Prisma, Auth.js, Redux, TanStack Query, TanStack Table, Redis client, or any package not justified by this WP
- Mass-generate shadcn/ui components without immediate use
- Create GitHub Actions workflows or CI configuration
- Configure Vercel or Neon
- Create production deployment configuration
- Modify the Charter, Product Requirements, Technical Specification, ADRs, or Delivery Roadmap
- Add E2E test scenarios (Playwright configured but no E2E tests)
- Add cron jobs, scheduled tasks, or background monitoring (S0 §23)
- Create empty directories without files (no premature structure)

---

## 17. Known Risks / Blockers

| Risk | Impact | Response |
|---|---|---|
| Tailwind CSS v4 vs v3 configuration differences | Medium (styling may not work if config is wrong) | MITIGATE: follow the official Tailwind + Next.js setup guide for the installed version; verify styles render in browser |
| Next.js version compatibility with React 19 | Low (Next.js 15+ supports React 19) | MITIGATE: use the latest stable Next.js; if incompatibility arises, CONTRACT DIVERGENCE — report and stop |
| shadcn/ui requires Tailwind v3 | Low (we are not installing shadcn in this WP) | N/A — shadcn/ui is added in later WPs |

**BLOCKERS: 0**

---

## 18. Allowed Implementation Freedom

S10 MAY choose:
- The exact method of project initialization (`create-next-app` vs manual setup) — provided the result conforms to this contract
- Whether to use `app/` or `src/app/` — provided the choice is consistent and documented
- Exact Tailwind CSS version (v3 or v4) — provided it works with the installed Next.js version and styles render correctly
- Whether to use `eslint.config.mjs` (flat config) or `.eslintrc.json` — provided ESLint passes
- The exact wording of the root page placeholder text — provided it includes "JOURDAIN EMPLOI" and is in French
- Whether to add a `prettier` script to `package.json` — optional but recommended
- Internal file organization within the `lib/server/` and `messages/` directories — provided structure conforms to S6/S7

S10 MAY NOT choose:
- A different framework (must be Next.js App Router)
- A different package manager (must be pnpm)
- A different styling approach (must be Tailwind CSS)
- A different test framework for unit/component tests (must be Vitest + RTL)
- A different E2E framework (must be Playwright — config only in this WP)
- To disable TypeScript strict mode
- To disable or weaken ESLint rules to pass

---

## 19. Allowed Change Surface

Files that S10 is authorized to create or modify:

| File/Directory | Action | Notes |
|---|---|---|
| `package.json` | CREATE | Project metadata, scripts, dependencies |
| `pnpm-lock.yaml` | CREATE | Lockfile |
| `tsconfig.json` | CREATE | TypeScript strict config |
| `next.config.ts` (or `.mjs`) | CREATE | Next.js config (minimal) |
| `eslint.config.mjs` (or `.eslintrc.json`) | CREATE | ESLint config |
| `.prettierrc` | CREATE | Prettier config |
| Tailwind config (`tailwind.config.ts` or CSS-based) | CREATE | Tailwind config per version |
| `postcss.config.mjs` (if required by Tailwind) | CREATE | PostCSS config |
| `app/layout.tsx` | CREATE | Root layout |
| `app/page.tsx` | CREATE | Root page (minimal placeholder) |
| `app/globals.css` | CREATE | Tailwind global imports |
| `components/` | CREATE (directory) | Empty for now; no shadcn/ui components |
| `lib/server/` | CREATE (directory) | Empty for now |
| `messages/fr.ts` | CREATE | French UI strings structure |
| `vitest.config.ts` | CREATE | Vitest configuration |
| `playwright.config.ts` | CREATE | Playwright configuration (no E2E tests) |
| `.env.example` | CREATE | Placeholder env vars (no secrets) |
| `.gitignore` | CREATE or MODIFY | Ensure .env.local, node_modules, .next are ignored |
| `tests/` or `__tests__/` | CREATE (if needed for smoke test) | One smoke test file |
| `README.md` | MODIFY | Update to reflect Next.js app status (was minimal AISE README) |

**Files that MUST NOT be modified:**
- `docs/planning/PROJECT_CHARTER.md`
- `docs/product/PRODUCT_REQUIREMENTS.md`
- `docs/architecture/TECHNICAL_SPECIFICATION.md`
- `docs/architecture/PROJECT_MANIFEST.md`
- `docs/architecture/adr/` (all ADRs)
- `docs/planning/DELIVERY_ROADMAP.md`
- `docs/planning/PROJECT_STATE.md` (updated only at S9/S10 closure per AISE protocol)
- `docs/engineering/` (all AISE protocol files)
- Any file outside the allowed change surface

---

## 20. S10 Handoff

S9 hands off to S10 (Implementation Execution):

| Field | Value |
|---|---|
| WP ID | WP-001 |
| Authorized Purpose | Application Foundation (MS-001) |
| Requirements Covered | NFR-040 (partial — French strings structure) |
| Verified Baseline | `36369ab983d72d490c4738b1c0d0e0e12b8e4396` (main at S9 start) |
| In Scope | Next.js App Router, TypeScript strict, pnpm, Tailwind, ESLint, Prettier, Vitest config, Playwright config, root page, .env.example, module structure |
| Out of Scope | DB, auth, admin, public portal, CI/CD, Vercel, Neon, E2E tests, shadcn/ui mass-generation, Tiptap, Better Auth, Drizzle |
| Intended Behavior | Root page renders "JOURDAIN EMPLOI"; toolchain passes; no business code |
| Business Rules | None (foundation milestone) |
| Data Semantics | None (no DB) |
| Permission Semantics | None (no auth) |
| Technical Constraints | ADR-0001 (monolith), ADR-0008 (Vitest + Playwright), TD-010 (Tailwind), TD-017 (pnpm), TD-027 (ESLint + Prettier + tsc strict) |
| Acceptance Contract | 16 conditions (AC-001 through AC-016) |
| Verification Expectations | Files list, command outputs, screenshot, git diff, commit |
| Forbidden Expansion | See Section 16 (22 explicit prohibitions) |

**S10 must implement only this bounded unit. No other WP is authorized.**

---

## 21. Approval / Authorization

| Field | Value |
|---|---|
| WP Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED (requires OWNER APPROVE + AUTHORIZE) |
| Next WP | WP-002 — Database + Auth Foundation (NOT YET AUTHORIZED) |
| Next WP Milestone | MS-002 (NOT YET STARTED) |

Per AISE S9 §37: only APPROVE + AUTHORIZE permits S10. OWNER must explicitly approve and authorize this work package before S10 may begin.

### Quality Gate Self-Check (per S9 §46)

| Check | Result |
|---|---|
| Source milestone valid | YES (MS-001 from approved DELIVERY_ROADMAP) |
| Requirement traceability complete | YES (NFR-040 partial — foundation milestone) |
| Orphan scope | 0 |
| Blocking product ambiguities | 0 |
| Blocking technical ambiguities | 0 |
| In scope explicit | YES (Section 5) |
| Out of scope explicit | YES (Section 6) |
| Intended behavior unambiguous | YES (Section 7) |
| Business rule contradictions | 0 (no business rules in this WP) |
| S6/S7 architecture contradictions | 0 |
| Acceptance criteria too vague | 0 (16 observable conditions) |
| Forbidden expansion defined | YES (Section 16 — 22 prohibitions) |
| Target environment ambiguity | N/A (no writes required — no DB, no auth, no infrastructure) |
| Unauthorized automation | 0 |
| Unauthorized production action | 0 |
| OWNER approval + authorization | REQUIRED (PENDING) |

**Verdict: QUALITY GATE PASS. WP-001 is READY FOR OWNER APPROVAL + AUTHORIZATION.**
