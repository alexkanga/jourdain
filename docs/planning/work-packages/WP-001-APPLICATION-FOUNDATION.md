# WP-001 — Application Foundation

## 1. Contract Status

| Field | Value |
|---|---|
| WP ID | WP-001 |
| Name | Application Foundation |
| Source Milestone | MS-001 — Application Foundation (DELIVERY_ROADMAP §7) |
| Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| S8 Approved Baseline | `2796c2d0cd76673c2ab4ecfdc8357c01f0c1a88a` |
| Canonical Main SHA (at S9 start) | `3681671425985d3bbf903624b669d8967c5439bb` |
| Source Charter (S4) | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Source Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| Source Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` at `7c85323` |
| Source Project Manifest (S7) | `docs/architecture/PROJECT_MANIFEST.md` at `0b8b436` |
| Source Delivery Roadmap (S8) | `docs/planning/DELIVERY_ROADMAP.md` at `2796c2d` |
| OWNER Approval | APPROVED + AUTHORIZED (2026-09-15) |
| S10 Authorization | CONSUMED — implementation complete, verified, closed |
| S11 Verdict | PASS WITH NON-BLOCKING FINDINGS (2026-09-15) |
| S11 Finding | pnpm build-script warning for esbuild/unrs-resolver (transitive devDeps) — non-blocking, no functional impact |
| OWNER Acceptance | ACCEPTED (2026-09-15) — finding accepted as non-blocking, no correction requested |
| Implementation Commit | `45fa8b7cadbed42db4df9f574eb726c40154cb09` |
| WP Status | CLOSED / PASS WITH NON-BLOCKING FINDINGS |

---

## 2. Purpose

Create the minimal technical foundation: a clean Next.js App Router application that starts, compiles, passes typecheck/lint/build, uses pnpm, TypeScript strict, Tailwind CSS, and ESLint — with one Vitest smoke test proving the root page renders. No business logic, no database, no auth, no infrastructure, no empty architectural placeholders.

---

## 3. Requirements Covered

**REQUIREMENTS COVERED NOW (this WP):**

No S5 FR/BR/PERM/INT/NFR requirements are directly assigned to this WP. MS-001 is a foundation milestone (per DELIVERY_ROADMAP requirement coverage matrix — all S5 requirements are assigned to MS-002 through MS-007).

**MILESTONE REQUIREMENTS NOT IN THIS WP:**

All 65 CONFIRMED requirements (FR-001–FR-061, BR-020–BR-080, PERM-001–004, INT-001, NFR-001–060) belong to MS-002 through MS-007.

**ORPHAN SCOPE: 0** — everything in this WP is justified by MS-001 (Application Foundation) from the approved Delivery Roadmap.

---

## 4. Entry Conditions

- S8 DELIVERY_ROADMAP: APPROVED ✅
- MS-001 selected as first milestone ✅
- MS-001 entry conditions: "S7 APPROVED" ✅
- BLOCKING PRODUCT AMBIGUITIES: 0 ✅
- BLOCKING TECHNICAL AMBIGUITIES: 0 ✅
- Technical baseline (S6/S7): APPROVED ✅

---

## 5. In Scope

### Next.js Application Initialization
- Next.js App Router project initialized with `pnpm create next-app` (or equivalent manual setup) using TypeScript, App Router, Tailwind CSS, ESLint
- `pnpm` as package manager with `pnpm-lock.yaml` committed
- TypeScript strict mode in `tsconfig.json`

### Configuration Files
- `package.json` — project metadata, scripts (dev, build, lint, typecheck, test), dependencies
- `pnpm-lock.yaml` — lockfile
- `tsconfig.json` — TypeScript strict configuration
- `next.config.ts` (or `.mjs`) — Next.js configuration (minimal)
- ESLint configuration (`eslint.config.mjs` or `.eslintrc.json`) — Next.js + TypeScript rules
- `.prettierrc` — Prettier configuration (per TD-027 DECIDED in S6)
- Tailwind CSS configuration (per the installed version — `tailwind.config.ts` for v3 or CSS-based config for v4)
- `postcss.config.mjs` (if required by Tailwind version)

### Root Page (minimal)
- `app/layout.tsx` — root layout (`<html lang="fr">`, body, global styles)
- `app/page.tsx` — minimal page rendering "JOURDAIN EMPLOI" heading and an indication that the platform is under construction. French text directly in the component (no i18n abstraction). No DB, no auth, no server actions.
- `app/globals.css` — Tailwind CSS global imports

### Test Infrastructure (Minimal)
- `vitest.config.ts` — Vitest configuration
- One smoke test: renders `app/page.tsx`, asserts "JOURDAIN EMPLOI" appears in the document (RTL component test)
- No Playwright. No E2E configuration. No Playwright dependency.

### Package Scripts
- `dev` — `next dev`
- `build` — `next build`
- `start` — `next start`
- `lint` — `next lint` (or `eslint .`)
- `typecheck` — `tsc --noEmit`
- `test` — `vitest run`

### .gitignore
- Ensure `.env.local`, `node_modules`, `.next` are ignored

---

## 6. Out of Scope

### Playwright / E2E (WP-E2EHardening / MS-005)
- Playwright config, Playwright dependencies, any E2E tests — EXCLUDED

### Empty Architecture Directories
- `components/` — NOT created (no components in this WP)
- `lib/server/` — NOT created (no server code in this WP)
- `db/` — NOT created (no DB code in this WP)
- `tests/` (Playwright) — NOT created
- Any directory without real files — NOT created

### i18n / Translation Infrastructure
- `messages/fr.ts` or any translation abstraction — NOT created. V1 is French only; text lives directly in the component.

### .env.example
- NOT created. WP-001 uses no environment variables (no DB, no auth, no API, no external service). `.env.example` will appear naturally in WP-002 when DB/Auth introduces real env vars.

### Database (WP-DatabaseAuth / MS-002)
- Neon, Drizzle ORM, Drizzle Kit, schema, migrations, DATABASE_URL — EXCLUDED

### Authentication (WP-DatabaseAuth / MS-002)
- Better Auth, Username plugin, Admin plugin, sessions, rate limiting, scrypt, auth.api.createUser, login/logout — EXCLUDED

### Authorization (WP-DatabaseAuth / MS-002)
- principalType, can(), requireCapability(), getPrincipal(), middleware — EXCLUDED

### Admin Business (WP-AdminOffers / MS-003)
- Login page, offer list, offer form, Tiptap editor, create/edit/publish/suspend/republish/archive — EXCLUDED

### Public Business (WP-PublicPortal / MS-004)
- Offer list, offer detail, /offres/{id}, search, OfferCard, OfferDetail, SEO, sitemap.ts, robots.ts — EXCLUDED

### Delivery (WP-EnvironmentsCICD / MS-006)
- Vercel, GitHub Actions, Neon Preview/Production — EXCLUDED

### shadcn/ui
- Mass-generating shadcn/ui components — EXCLUDED. Components added in later WPs when needed.

### Lucide
- NOT installed unless an icon is actually used (unlikely in a minimal placeholder page).

---

## 7. Intended Behavior

### Root Page (`/`)
- Renders an HTML page with:
  - A `<h1>` heading containing "JOURDAIN EMPLOI"
  - A brief French text indicating the platform is under construction (e.g., "Plateforme en construction")
  - Clean, minimal styling via Tailwind CSS
  - Responsive (mobile + desktop)
- No database access, no auth, no server actions, no API routes
- Server Component (no client-side JavaScript needed)
- French text written directly in the component (no i18n abstraction)

### Root Layout
- Sets `<html lang="fr">`
- Imports Tailwind global CSS
- Renders children

### Smoke Test
- One Vitest component test: renders `app/page.tsx`, asserts "JOURDAIN EMPLOI" appears in the document
- Uses React Testing Library + Vitest
- No DB, no auth, no mocking needed (page has no dependencies)

---

## 8. Business Rules

None. MS-001 is a foundation milestone with no S5 BR requirements.

---

## 9. Data Semantics

None. No data entities, no database, no schema, no migrations.

**MIGRATION REQUIRED: NO**

---

## 10. Permission / Actor Semantics

None. No authentication or authorization. The root page is public.

---

## 11. Technical Boundaries (S6/S7 Architecture Constraints)

- **Architecture (ADR-0001):** Modular monolith Next.js full-stack. Single app. No separate backend.
- **App Router (MANDATED):** Next.js App Router (not Pages Router).
- **TypeScript strict (MANDATED):** `strict: true` in `tsconfig.json`.
- **Tailwind CSS (DECIDED, TD-010):** Tailwind CSS. No styled-components, no CSS-in-JS.
- **pnpm (DECIDED, TD-017):** pnpm with lockfile committed.
- **ESLint + Prettier + tsc strict (DECIDED, TD-027):** All three configured and passing. Prettier is explicitly DECIDED in S6 TD-027 — retained per approved decision.
- **Vitest + RTL (DECIDED, TD-024 / ADR-0008):** Vitest for unit/component tests. RTL for component tests.
- **No Playwright in this WP:** Playwright belongs to WP-E2EHardening (MS-005). NOT installed or configured here.
- **No dependencies outside the approved stack:** Every package must correspond to an S6/S7 decision or a concrete WP-Foundation need.

---

## 12. Interfaces / Integration Boundaries

No APIs, no external integrations. The root page is a simple Server Component.

---

## 13. Error / Edge Semantics

- Application starts without errors on `pnpm dev`
- Build succeeds without errors on `pnpm build`
- No console errors when loading `/` in a browser
- If a dependency fails to install: CONTRACT DIVERGENCE DETECTED — report and stop

---

## 14. Acceptance Contract

| # | Condition | Observable Evidence |
|---|---|---|
| AC-001 | Next.js App Router project is initialized | `app/layout.tsx` and `app/page.tsx` exist; App Router used (not Pages Router) |
| AC-002 | TypeScript strict is active | `tsconfig.json` has `strict: true`; `pnpm typecheck` passes (exit code 0) |
| AC-003 | pnpm is the package manager | `pnpm-lock.yaml` exists and committed; `package.json` has pnpm scripts |
| AC-004 | Tailwind CSS is operational | `app/globals.css` imports Tailwind; `app/page.tsx` uses Tailwind classes; styles render in browser |
| AC-005 | ESLint passes | `pnpm lint` exits with code 0 |
| AC-006 | Production build passes | `pnpm build` exits with code 0; `.next/` generated |
| AC-007 | Root page renders | `pnpm dev` starts; `http://localhost:3000` shows "JOURDAIN EMPLOI" heading |
| AC-008 | French language is set | `<html lang="fr">` in rendered HTML |
| AC-009 | Smoke test passes | `pnpm test` exits with code 0; smoke test verifies "JOURDAIN EMPLOI" appears |
| AC-010 | No DB/auth/business code exists | No files importing Drizzle, Better Auth, Tiptap, or any package outside the approved foundation stack |
| AC-011 | No secrets in repository | `grep -r` for password patterns in tracked files returns nothing (no .env.example in this WP) |
| AC-012 | No empty architecture directories | No `components/`, `lib/server/`, `db/`, `tests/` directories created without files |
| AC-013 | No Playwright installed | `package.json` has no `@playwright/test` dependency; no `playwright.config.ts` |
| AC-014 | No i18n abstraction | No `messages/fr.ts` or translation module; French text is directly in `app/page.tsx` |
| AC-015 | No .env.example | `.env.example` does NOT exist (no env vars needed in this WP) |
| AC-016 | No premature dependencies | No Tiptap, Better Auth, Drizzle, TanStack, Prisma, Redis, or shadcn/ui packages installed |

---

## 15. Verification Expectations (S11 Evidence)

S10 must provide:
- List of all files created/modified
- Output of `pnpm install` (success)
- Output of `pnpm lint` (PASS)
- Output of `pnpm typecheck` (PASS)
- Output of `pnpm test` (PASS — smoke test)
- Output of `pnpm build` (PASS)
- Manual confirmation: `pnpm dev` starts, `http://localhost:3000` renders "JOURDAIN EMPLOI", no console errors
- `git diff --stat` summary
- Git commit (focused, identifiable as WP-Foundation)
- Worktree state (CLEAN after commit)

---

## 16. Forbidden Expansion

S10 MUST NOT:
- Install or configure Playwright
- Create empty architecture directories (`components/`, `lib/server/`, `db/`)
- Create `messages/fr.ts` or any i18n/translation abstraction
- Create `.env.example` (no env vars needed in this WP)
- Create database schema, migrations, or Drizzle configuration
- Install or configure Better Auth, Username plugin, or Admin plugin
- Create any authentication or authorization code
- Create admin pages, offer forms, or lifecycle actions
- Create public offer list, detail, or search pages
- Install Tiptap or any rich-text editor
- Install Prisma, Auth.js, Redux, TanStack Query, TanStack Table, Redis client, or any package not justified by this WP
- Mass-generate shadcn/ui components
- Create GitHub Actions workflows or CI configuration
- Configure Vercel or Neon
- Create production deployment configuration
- Modify the Charter, Product Requirements, Technical Specification, ADRs, or Delivery Roadmap
- Add cron jobs, scheduled tasks, or background monitoring (S0 §23)

---

## 17. Known Risks / Blockers

| Risk | Impact | Response |
|---|---|---|
| Tailwind CSS v4 vs v3 configuration differences | Medium | MITIGATE: follow official Tailwind + Next.js setup guide for installed version; verify styles render |
| Next.js version compatibility with React 19 | Low | MITIGATE: use latest stable Next.js; if incompatibility, CONTRACT DIVERGENCE — report and stop |

**BLOCKERS: 0**

---

## 18. Allowed Implementation Freedom

S10 MAY choose:
- Exact project initialization method (`create-next-app` vs manual) — provided result conforms to this contract
- `app/` or `src/app/` — provided consistent and documented
- Exact Tailwind CSS version (v3 or v4) — provided it works with installed Next.js
- `eslint.config.mjs` (flat config) or `.eslintrc.json` — provided ESLint passes
- Exact wording of root page placeholder — provided it includes "JOURDAIN EMPLOI" and is in French
- Internal test file location and naming — provided Vitest runs successfully

S10 MAY NOT choose:
- A different framework (must be Next.js App Router)
- A different package manager (must be pnpm)
- A different styling approach (must be Tailwind CSS)
- A different test framework (must be Vitest + RTL)
- To disable TypeScript strict mode
- To disable or weaken ESLint rules to pass
- To add Playwright or any E2E tooling

---

## 19. Allowed Change Surface

Files that S10 is authorized to create or modify:

| File | Action | Notes |
|---|---|---|
| `package.json` | CREATE | Project metadata, scripts, dependencies |
| `pnpm-lock.yaml` | CREATE | Lockfile |
| `tsconfig.json` | CREATE | TypeScript strict config |
| `next.config.ts` (or `.mjs`) | CREATE | Next.js config (minimal) |
| ESLint config (`eslint.config.mjs` or `.eslintrc.json`) | CREATE | ESLint config |
| `.prettierrc` | CREATE | Prettier config (per TD-027 DECIDED) |
| Tailwind config | CREATE | Per installed Tailwind version |
| `postcss.config.mjs` | CREATE | If required by Tailwind version |
| `app/layout.tsx` | CREATE | Root layout |
| `app/page.tsx` | CREATE | Root page (minimal placeholder) |
| `app/globals.css` | CREATE | Tailwind global imports |
| `vitest.config.ts` | CREATE | Vitest configuration |
| Smoke test file | CREATE | One RTL component test |
| `.gitignore` | CREATE or MODIFY | Ensure .env.local, node_modules, .next ignored |
| `README.md` | MODIFY | Update to reflect Next.js app status |
| Scaffold-generated files | CREATE | Only files strictly generated/required by the chosen scaffold |

**Files that MUST NOT be created:**
- `playwright.config.ts` (Playwright belongs to WP-E2EHardening)
- `messages/fr.ts` (no i18n abstraction in V1)
- `.env.example` (no env vars needed in this WP)
- `components/` directory (no components in this WP)
- `lib/server/` directory (no server code in this WP)
- `db/` directory (no DB code in this WP)

**Files that MUST NOT be modified:**
- `docs/planning/PROJECT_CHARTER.md`
- `docs/product/PRODUCT_REQUIREMENTS.md`
- `docs/architecture/TECHNICAL_SPECIFICATION.md`
- `docs/architecture/PROJECT_MANIFEST.md`
- `docs/architecture/adr/` (all ADRs)
- `docs/planning/DELIVERY_ROADMAP.md`
- `docs/planning/PROJECT_STATE.md`
- `docs/engineering/` (all AISE protocol files)

---

## 20. S10 Handoff

| Field | Value |
|---|---|
| WP ID | WP-001 |
| Authorized Purpose | Application Foundation (MS-001) |
| Requirements Covered | None (foundation milestone — no S5 requirements) |
| Verified Baseline | `3681671425985d3bbf903624b669d8967c5439bb` |
| In Scope | Next.js App Router, TypeScript strict, pnpm, Tailwind, ESLint, Prettier, Vitest config + 1 smoke test, root page, module structure (app/ only) |
| Out of Scope | Playwright, DB, auth, admin, public portal, CI/CD, Vercel, Neon, shadcn/ui, i18n, .env.example, empty directories |
| Intended Behavior | Root page renders "JOURDAIN EMPLOI"; toolchain passes; no business code |
| Technical Constraints | ADR-0001 (monolith), TD-010 (Tailwind), TD-017 (pnpm), TD-027 (ESLint + Prettier + tsc strict), ADR-0008 (Vitest only — no Playwright) |
| Acceptance Contract | 16 conditions (AC-001 through AC-016) |
| Forbidden Expansion | See Section 16 |
| Next WP | WP-002 — Database + Auth Foundation (NOT YET AUTHORIZED) |

**S10 must implement only this bounded unit. No other WP is authorized.**

---

## 21. Approval / Authorization

| Field | Value |
|---|---|
| WP Status | CLOSED / PASS WITH NON-BLOCKING FINDINGS |
| OWNER Approval | APPROVED + AUTHORIZED (2026-09-15) |
| S10 Authorization | CONSUMED — implementation complete, verified, closed |
| Next WP | WP-002 — Database + Auth Foundation (NOT YET AUTHORIZED) |

### Quality Gate Self-Check (per S9 §46)

| Check | Result |
|---|---|
| Source milestone valid | YES (MS-001) |
| Orphan scope | 0 |
| Blocking ambiguities | 0 |
| In scope explicit | YES (Section 5) |
| Out of scope explicit | YES (Section 6) |
| Intended behavior unambiguous | YES (Section 7) |
| S6/S7 contradictions | 0 |
| Acceptance criteria too vague | 0 (16 observable conditions) |
| Forbidden expansion defined | YES (Section 16) |
| Playwright excluded | YES (AC-013) |
| Empty directories excluded | YES (AC-012) |
| i18n excluded | YES (AC-014) |
| .env.example excluded | YES (AC-015) |
| Premature dependencies excluded | YES (AC-016) |
| OWNER approval + authorization | REQUIRED (PENDING) |

**Verdict: QUALITY GATE PASS. WP-001 is READY FOR OWNER APPROVAL + AUTHORIZATION.**
