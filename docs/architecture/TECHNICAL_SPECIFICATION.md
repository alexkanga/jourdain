# TECHNICAL SPECIFICATION — JOURDAIN EMPLOI V1

**Document type:** AISE S6 — Technical Specification
**Status:** OWNER APPROVED — S6 CLOSED / PASS
**Date:** 2026-09-14 (initial draft), 2026-09-15 (revised after OWNER revision decisions §1–§15), 2026-09-15 (final patch §1–§5), 2026-09-15 (auth consistency patch), 2026-09-15 (OWNER APPROVED)
**Project:** JOURDAIN EMPLOI V1
**Canonical repository:** `github.com/alexkanga/jourdain`
**Canonical branch:** `main`
**Charter-approved HEAD (source S4):** `fa377c1feba5a111c07e0f40d094245fdadc727d`
**Product-requirements-approved HEAD (source S5):** `9ec4a08b467a4a3909fa9bc0a72bf02e4c682418`
**Initial S6 draft HEAD:** `bb6c976b47648fc73ac2228d023994b388d3ad4f`

This document is governed by AISE protocol S6 (`docs/engineering/AISE_TECHNICAL_SPECIFICATION.md`). It defines **how the approved product requirements are technically realized** — not what (S5) and not why (S4).

Every material technical decision carries one of five states (S6 §4):

- **DECIDED** — Approved technical decision (OWNER or evidence-confirmed)
- **PROVISIONAL** — Preferred direction requiring confirmation
- **OPEN** — Material technical question unresolved; must be resolved before S6 closes
- **MANDATED** — OWNER or external constraint, not an S6 optimization choice
- **DEFERRED** — Not required for current baseline, explicitly recorded

Silent conversions are forbidden (S6 §4):
- PREFERENCE must NOT become MANDATED.
- PROVISIONAL must NOT become DECIDED without evidence.
- UNKNOWN must NOT become WORKAROUND.

---

## 1. Document Status

| Field | Value |
|---|---|
| Project | JOURDAIN EMPLOI |
| AISE Stage | S6 — Technical Specification |
| Status | OWNER APPROVED — S6 CLOSED / PASS |
| Source Charter | `docs/planning/PROJECT_CHARTER.md` — APPROVED 2026-09-13 at `fa377c1` |
| Source Product Requirements | `docs/product/PRODUCT_REQUIREMENTS.md` — APPROVED 2026-09-14 at `9ec4a08` |
| S6 initial draft date | 2026-09-14 |
| S6 revision date | 2026-09-15 (after OWNER revision decisions §1–§15 + final patch §1–§5 + auth consistency patch) |
| S6 OWNER approval date | 2026-09-15 |
| Approved baseline commit | `7c85323c557476672a1e227e8773b0fa45459ff4` |
| Next recommended component | S7 — Project Manifest + ADR |

Per AISE S6 §30, the baseline was NOT valid until OWNER explicitly approved it. OWNER has now explicitly approved it on 2026-09-15.

---

## 2. Technical Context

### 2.1 Approved inputs

- **Charter** (`fa377c1`): JOURDAIN EMPLOI V1 is a simple, mono-tenant web portal for publishing and consulting job offers. Single ADMIN role, no complex RBAC, no notifications, no API publique, no multilingual, no multi-tenant. Fantomas principal mandated by AISE §14/§21.
- **Product Requirements** (`9ec4a08`): 65 CONFIRMED requirements (30 FR + 21 BR + 4 PERM + 1 INT + 9 NFR), 60 MUST + 5 SHOULD. 4-state offer lifecycle (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED — terminal). 21 offer business fields. No public API, no notifications, no automatic expiration, no physical deletion.

### 2.2 OWNER-mandated technical constraints (MANDATED)

These constraints are explicitly stated in the APPROVED Charter §10 as hard requirements (not preferences). S6 documents them and applies them; they are NOT S6 optimization choices.

| Constraint | Source | Implication |
|---|---|---|
| React | Charter §10 (CONFIRMED) | UI library |
| Next.js | Charter §10 (CONFIRMED) | Web framework |
| TypeScript | Charter §10 (CONFIRMED) | Language |
| Next.js App Router | Charter §10 (CONFIRMED) | Routing model |
| Vercel | Charter §10 (CONFIRMED) | Hosting platform |
| PostgreSQL Neon | Charter §10 (CONFIRMED) | Database |
| Production environment separated from Preview | Charter §10 (CONFIRMED constraint) | Environment isolation |
| No microservices / K8s / Kafka / ES / Redis / event bus / distributed architecture without demonstrated need | Charter §10 (CONFIRMED) | Modular monolith full-stack |
| AISE S0 §13 (no secrets in repo) | S0 FROZEN | All secrets via §25 External Parameter Gate |
| AISE S0 §14/§21 (Fantomas) | S0 FROZEN | Break-glass principal with full SUPER_ADMIN + specific capabilities |
| AISE S0 §23 (zero scheduled work) | S0 FROZEN | No cron, no background jobs, no auto-expiration |
| AISE S0 §24 (contract preservation) | S0 FROZEN | Never adapt valid evidence to defective implementation |
| AISE S0 §25 (external parameter gate) | S0 FROZEN | Secrets requested only at exact boundary where required |

### 2.3 OWNER-stated technical preferences (PREFERENCE, evaluated and DECIDED in S6)

These items are OWNER preferences (Charter §10 "Outils envisagés autour de Next.js" + OWNER S6 §1), NOT absolute mandates. S6 has evaluated each one against the V1 requirements and made a decision. The decision status is **DECIDED** (not MANDATED) because each was a real choice with viable alternatives, and S6 retained the option that best fits V1 needs.

| Preference | Source | Viable alternatives evaluated | S6 decision | Decision ID | Status |
|---|---|---|---|---|---|
| Drizzle ou Prisma | Charter §10, OWNER S6 §1 | Prisma | Drizzle ORM | TD-004 | DECIDED |
| Zod | Charter §10, OWNER S6 §1 | Yup, Valibot, io-ts | Zod | TD-008 | DECIDED |
| TanStack Query | Charter §10, OWNER S6 §1 | React Query (synonym), SWR, none | None in V1 (Server Components + Server Actions suffice) | TD-006 | DECIDED |
| React Hook Form | Charter §10, OWNER S6 §1 | Native form + FormData, Formik | React Hook Form | TD-007 | DECIDED |
| Tailwind CSS | Charter §10, OWNER S6 §1 | CSS Modules, vanilla-extract, styled-components | Tailwind CSS | TD-010 | DECIDED |
| shadcn/ui | Charter §10, OWNER S6 §1 | Composants maison, MUI, Chakra | shadcn/ui (selective adoption) | TD-011 | DECIDED |
| pnpm | OWNER S6 §28 ("recommandé") | npm, yarn, bun | pnpm | TD-017 | DECIDED |
| Better Auth | OWNER S6 §2 (revision §2) | Auth.js v5, custom auth | Better Auth | TD-003 (revised) | DECIDED |

**Important — AISE distinction (OWNER revision §1):** S6 must NOT silently convert a PREFERENCE into a MANDATED constraint. Zod, Tailwind, pnpm, Better Auth, Drizzle, TanStack Query, React Hook Form, shadcn/ui are all DECIDED, not MANDATED. Each has a rationale in Section 5. If a future change of requirements or evidence makes another option better, S7 can revisit the decision through AISE change control (R6 if it touches a FROZEN rule). PostgreSQL/Neon, React/Next.js/TypeScript/App Router/Vercel are MANDATED because the Charter explicitly states them as hard requirements.

### 2.4 Anti-overengineering principles (OWNER S6 anti-overengineering + S6 §6, §36)

The simplest architecture satisfying approved requirements and material risks is preferred. The following are NOT introduced without evidence from approved requirements:

- microservices, message broker, Kubernetes, service mesh, CQRS, event sourcing
- multiple databases, distributed transactions, cache layers (Redis), complex async infrastructure
- separate NestJS backend, GraphQL, event bus

The target is a **modular monolith Next.js full-stack** — one application serving both public and admin, with clean module separation inside.

---

## 3. System Context and Boundaries

### 3.1 Actors

| Actor | Type | Trust boundary |
|---|---|---|
| Public visitor | Human, unauthenticated | Outside the system; only sees published offers |
| ADMIN | Human, authenticated | Inside the admin trust boundary; can manage all offers |
| FANTOMAS | System principal, break-glass authenticated | Highest privilege; bootstrap and recovery |
| SYSTEM | Automated (server-side only) | Internal; manages timestamps, status transitions |

### 3.2 External systems

V1 has NO external system integration (per S5 INT-001). The only external dependencies are infrastructure:

- **Vercel** — hosting platform (runtime, build, deployment, preview environments)
- **Neon PostgreSQL** — database (production + preview branches)
- **GitHub** — source repository (already canonical)

There is no third-party authentication provider, no payment provider, no email provider, no search engine. The application is self-contained.

### 3.3 Trust boundaries

| Boundary | Mechanism |
|---|---|
| Public → Admin pages | Authentication required (Better Auth middleware + layout guard per Section 13.4) |
| Public → Offer data (non-PUBLISHED) | Server-side status filter; non-PUBLISHED offers return 404 on public URLs |
| Admin mutations | Server Actions with `requireCapability()` check (Section 13) + Zod validation |
| Form input → DB | Server-side Zod validation (TD-008); client validation is UX-only |
| Description rich content | Tiptap JSON stored (no raw HTML in DB); rendered via Tiptap React server-side renderer (no `dangerouslySetInnerHTML` with user content) — TD-013 revised |
| Secrets → Code | S0 §13 + S0 §25; secrets via environment variables only |
| Preview env → Production DB | Strict isolation via distinct `DATABASE_URL` env vars per Vercel environment (TD-019); target verification before any write (S0 §25) |
| Authorization vs Authentication | Better Auth authenticates (verifies credentials, manages sessions); `can()` / `requireCapability()` authorizes (checks capabilities per AISE §21) — independent layers per OWNER §2 |

---

## 4. Architecture Overview

### 4.1 Architecture style — TD-001

```
TD-001: Architecture Style
DECISION AREA:  Overall application architecture
REQUIREMENTS:   FR-001–FR-061 (admin + public), NFR-001 (perf), NFR-030 (accessibility),
                OWNER S6 §2 (single Next.js full-stack, no SPA, no backend séparé)
OPTIONS:        Modular monolith Next.js full-stack | Separate Next.js + NestJS backend |
                Next.js + separate REST/GraphQL API
SELECTED:       Modular monolith Next.js full-stack
RATIONALE:      OWNER S6 §2 explicitly mandates "Une seule application Next.js full-stack"
                and forbids "backend séparé NestJS" and "GraphQL". The single-admin-role
                V1 with no external integrations (S5 INT-001) does not need a backend
                service. Next.js App Router Server Components + Server Actions cover
                all V1 needs: server-rendered public pages, protected admin pages,
                and server-side mutations. A monolith with clear internal module
                boundaries (Section 6) is the simplest architecture satisfying all
                approved requirements.
CONSEQUENCES:   Single deployment unit (Vercel). Single codebase. No network hop
                between API and UI. Public and admin share the same Next.js app
                but are separated by route groups (Section 7). Database access
                happens server-side only (no client-side DB calls).
ADR CANDIDATE:  YES
STATUS:         DECIDED
```

### 4.2 High-level architecture diagram (textual)

```
+--------------------------------------------------+
|              Vercel deployment                   |
|                                                  |
|  +--------------------------------------------+  |
|  |     Next.js App (modular monolith)         |  |
|  |                                            |  |
|  |   app/(public)/    app/admin/              |  |
|  |     |                  |                   |  |
|  |   Server Components  Server Components     |  |
|  |   + Server Actions   + Server Actions      |  |
|  |   (read)             (mutations)           |  |
|  |     |                  |                   |  |
|  |   lib/server/ (auth, validation, services)  |  |
|  |     |                  |                   |  |
|  |   db/ (Drizzle schema + queries)           |  |
|  |     |                                      |  |
|  +-----|--------------------------------------+  |
|        |                                         |
|        v                                         |
|  +--------------------------------------------+  |
|  |    Neon PostgreSQL                         |  |
|  |    (Production branch | Preview branches)  |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

### 4.3 Communication model

- **Public read**: Server Components query the DB directly via Drizzle. No client-side fetching by default (Server Components render on server). HTML sent to client.
- **Admin read**: Server Components query the DB. Protected by auth middleware/check.
- **Admin mutations**: Server Actions (Next.js App Router native mechanism) — invoked from Client Components or form submissions. Auth checked server-side. Zod validates input.
- **No REST API**: V1 has no public product API (S5 INT-001, OOS-015). Internal Next.js endpoints may exist for specific needs (e.g., dynamic search if implemented as a route handler) but are NOT a product API.
- **No GraphQL**: Excluded per OWNER S6 anti-overengineering.

---

## 5. Technical Decisions

This section lists every material technical decision with its ID, options considered, decision, rationale, and status. ADR candidates for S7 are flagged.

### TD-001 — Architecture style

See Section 4.1. **DECIDED. ADR CANDIDATE: YES.**

### TD-002 — Primary persistence mechanism

```
TD-002: Primary Persistence Mechanism
DECISION AREA:  Data persistence
REQUIREMENTS:   DR-010 (offer id), BR-020 (lifecycle states), BR-025 (public visibility),
                NFR-001 (perf), Charter §10 (PostgreSQL Neon MANDATED)
MANDATED:       PostgreSQL on Neon (per Charter §10 + OWNER S6 §1). Not an S6 optimization choice.
OPTIONS:        (none — MANDATED)
SELECTED:       PostgreSQL on Neon
RATIONALE:      OWNER MANDATED constraint. PostgreSQL satisfies all S5 data requirements
                (relational, ACID, ILIKE for simple search, status enum via CHECK or
                native enum, date types). Neon provides branch-based isolation between
                Production and Preview environments (TD-019).
CONSEQUENCES:   Connection via DATABASE_URL env var. Drizzle ORM as query layer (TD-004).
                Migrations via Drizzle Kit (TD-018).
ADR CANDIDATE:  NO (MANDATED, not a choice)
STATUS:         MANDATED
```

### TD-003 — Authentication architecture (finalized per OWNER final patch §2, §3)

```
TD-003: Authentication Architecture (finalized)
DECISION AREA:  ADMIN and Fantomas authentication — runtime auth stack + bootstrap
                mechanism for initial system principals
REQUIREMENTS:   FR-001 (login), FR-002 (logout), FR-003 (back-office denied to public),
                FR-004 (no public registration), NFR-010 (no plaintext password),
                NFR-011 (no password in repo), NFR-012 (session protection),
                NFR-013 (Fantomas credential handling), PERM-003 (back-office restricted),
                PERM-004 (Fantomas capability inheritance per AISE §14/§21), Charter §7
                (Fantomas), OWNER final patch §2 (Username plugin explicit), §3 (bootstrap
                via Better Auth supported mechanism, no manual hash INSERT)
OPTIONS:        Better Auth | Auth.js (NextAuth v5) | Lightweight custom session-based auth
SELECTED:       Better Auth, with the following explicit configuration:
                - emailAndPassword: { enabled: true, disableSignUp: true } —
                  password-based authentication with PUBLIC SIGN-UP DISABLED (Better
                  Auth documented syntax; NOT the old `emailAndPassword.signUp.disabled`
                  form which is non-standard)
                - Username plugin (better-auth/plugins/username) — username is the
                  DAILY LOGIN IDENTIFIER of JOURDAIN EMPLOI (NOT the email). The login
                  form asks for username + password. Fantomas logs in with username
                  "Fantomas". ADMIN logs in with their assigned username.
                - Admin plugin (better-auth/plugins/admin) — explicitly configured
                  server-side. Used ONLY as the technical mechanism that enables
                  `auth.api.createUser()` for the bootstrap script to create system
                  principals without a public sign-up flow. The Admin plugin is NOT
                  the business authorization system; it does NOT define JOURDAIN
                  EMPLOI capabilities. No user-management UI is added to V1 — the
                  Admin plugin is server-side only, invoked by the bootstrap script.
                - Drizzle adapter on PostgreSQL Neon (drizzle-orm/neon-http — TD-030)
                - Database session strategy (sessions in the `session` table managed
                  by Better Auth's Drizzle adapter)
                - Rate limiter enabled with database storage on Neon (TD-031 finalized)
                - User schema extended with TWO additional fields via Better Auth's
                  `user.model` config:
                  1. `principalType` (enum: 'ADMIN' | 'FANTOMAS') — THIS IS THE
                     JOURDAIN EMPLOI BUSINESS PRINCIPAL FIELD. It is the source of
                     truth for business authorization via can()/requireCapability()
                     (Section 13). It is independent of Better Auth's internal
                     permissions.
                  2. `role` (Better Auth Admin plugin internal) — reserved for
                     Better Auth Admin plugin mechanics if needed. JOURDAIN EMPLOI
                     business authorization does NOT read this field.
                - email field: PRESENT in the user table (Better Auth requires it
                  internally) but NOT used as the daily login identifier. The email
                  may be a synthetic value for system principals (e.g.,
                  "fantomas@jourdain.local" for Fantomas, "admin1@jourdain.local" for
                  the initial ADMIN) since no email verification or notification flow
                  exists in V1 (no notifications — OOS-013). The email is NOT exposed
                  in the daily admin UI as a login field.
                - No public "username availability" check endpoint (no information
                  leak about existing usernames; brute-force protection is handled
                  by the rate limiter, not by revealing existing usernames).

                BOOTSTRAP MECHANISM (OWNER final patch §3): the bootstrap script
                (db/bootstrap/bootstrap.ts, per TD-020) creates the initial system
                principals (Fantomas + initial ADMIN) via Better Auth's SUPPORTED
                server-side user creation API: `auth.api.createUser({ body: {
                username, password, email, principalType, ... } })`.
                - `auth.api.createUser()` is authorized because the Admin plugin is
                  explicitly configured (see above). The Admin plugin enables the
                  server-side createUser endpoint.
                - This is the SUPPORTED Better Auth mechanism for creating users
                  server-side without a public sign-up flow. Better Auth handles
                  password hashing (scrypt by default — TD-009), creates the user
                  record in the `user` table, AND creates the credential-account
                  record in the `account` table (providerId='credential').
                - The bootstrap script does NOT manually INSERT password hashes,
                  does NOT bypass Better Auth, does NOT write to the DB directly.
                  It calls `auth.api.createUser()` and lets Better Auth do its work.
                - The bootstrap script is idempotent: before each createUser call, it
                  checks whether a user with that username already exists (via
                  `auth.api.listUsers({ query: { username } })` or a direct read-only
                  query). If the user exists, it logs a warning and does NOT overwrite
                  (password rotations are preserved). If it does not exist, it calls
                  createUser.
                - The username is immutable for system principals created by
                  bootstrap (Fantomas's username "Fantomas" is fixed by the bootstrap
                  config; the initial ADMIN's username is fixed by db/bootstrap/config.ts).
                  Immutability is enforced at the application layer (no "change
                  username" feature in V1; the admin UI does not expose username
                  editing). A V2 admin UI may add username editing with Fantomas
                  authorization, but that is out of V1 scope (DR-050).
                - The email field for system principals is a synthetic value (e.g.,
                  "fantomas@jourdain.local"); it is not used for verification or
                  notifications in V1.

                Comparison with rejected alternatives:
                - Auth.js v5: mature but Credentials provider is explicitly discouraged
                  in its docs for database-backed auth; the database-session strategy
                  works but the integration with Drizzle requires the
                  @auth/drizzle-adapter which is less actively maintained than Better
                  Auth's adapter. Better Auth is more aligned with the V1 stack
                  (Drizzle-first, Next.js App Router-first, username plugin native).
                - Custom auth: requires implementing session management, CSRF
                  protection, password hashing, secure cookie flags, username
                  uniqueness, rate limiting — fragile and not justified when Better
                  Auth covers all needs with a smaller surface.

                Password hashing: Better Auth uses scrypt by default (Node.js built-in
                crypto.scrypt — no native binding, no Vercel build concern). This
                removes the bcrypt-vs-bcryptjs open question (Owner §7) — it
                disappears entirely. The hash is stored in the `account` table by
                Better Auth automatically (NOT in a custom column; NOT manually
                written by the bootstrap script).

                IMPORTANT — Separation of concerns (OWNER §2 and §3): Better Auth
                authenticates (verifies credentials, manages sessions, rate-limits
                auth endpoints, creates users server-side). Our `can()` /
                `requireCapability()` layer (Section 13) authorizes (checks
                capabilities per AISE §21). The authorization logic is INDEPENDENT of
                the auth library — Fantomas semantics are preserved regardless of
                which library authenticates. The Better Auth Admin plugin (if ever
                used in a future version) is NOT used as a business authorization
                system; it would be a bootstrap/administration convenience at most.
                Our `can()` / `requireCapability()` remains the authority for
                JOURDAIN EMPLOI business capabilities.
CONSEQUENCES:   - Better Auth Drizzle adapter generates the auth tables (user,
                session, account, verification) + the rate-limit table (TD-031) —
                S6 documents the expected shape (Section 9.3.2) but does NOT redefine
                these tables.
                - The `user` table is extended with `username` (Username plugin),
                `principalType` (V1 business principal field — enum: 'ADMIN' | 'FANTOMAS'),
                and `role` (Better Auth Admin plugin internal — reserved, NOT used
                for JOURDAIN EMPLOI business authorization).
                - The login form asks for username + password (NOT email).
                - Public sign-up is disabled via `emailAndPassword: { enabled: true,
                disableSignUp: true }`; users are created ONLY via the bootstrap
                script (TD-020) calling `auth.api.createUser()` (authorized by the
                Admin plugin).
                - No bcrypt dependency (Better Auth uses scrypt by default). No
                bcryptjs fallback needed.
                - `can()` / `requireCapability()` lives in
                lib/server/auth/authorization.ts and is the AUTHORITY for business
                capabilities — independent of Better Auth. It reads `principalType`
                (NOT `role`) to determine capabilities.
                - The Admin plugin is server-side only; no user-management UI is
                exposed in V1.
ADR CANDIDATE:  YES
STATUS:         DECIDED
```

### TD-004 — ORM / Query layer

```
TD-004: ORM / Query Layer
DECISION AREA:  Database access layer
REQUIREMENTS:   All FR/BR with DB access, NFR-001 (perf), Charter §10 (Drizzle ou Prisma
                envisaged), OWNER S6 §1 (decide Drizzle vs Prisma)
OPTIONS:        Drizzle ORM | Prisma
SELECTED:       Drizzle ORM
RATIONALE:      - Drizzle: SQL-first, type-safe, schema-as-code with migrations via
                  Drizzle Kit. Lightweight, no extra runtime process, no query engine
                  binary. Works natively with Neon serverless driver. Smaller bundle
                  size. Closer to SQL — fewer abstractions to learn. Better fit for
                  Edge runtime if needed.
                - Prisma: more abstract, generates a client, requires a query engine
                  binary (extra dep), has migrations but hides SQL more. Heavier.
                  Larger learning curve for SQL-aware developers. Historically had
                  Edge runtime limitations.
                For a small V1 with simple queries (list, filter, CRUD on one main
                entity), Drizzle is simpler, lighter, and gives SQL transparency. No
                justification for Prisma's additional abstraction.
CONSEQUENCES:   Schema in db/schema.ts. Migrations via Drizzle Kit (TD-018).
                Neon serverless driver (@neondatabase/serverless) for serverless
                connection. Connection via DATABASE_URL env var.
ADR CANDIDATE:  YES
STATUS:         DECIDED
```

### TD-005 — Major integration mechanism

```
TD-005: Major Integration Mechanism
DECISION AREA:  External system integration
REQUIREMENTS:   S5 INT-001 (no external integration in V1)
SELECTED:       None — no external integration in V1
RATIONALE:      S5 INT-001 explicitly states V1 has no external integration. The only
                external dependencies are infrastructure (Vercel, Neon, GitHub) which
                are not application-level integrations.
CONSEQUENCES:   No integration code. No retry/circuit-breaker patterns needed.
ADR CANDIDATE:  NO (trivial)
STATUS:         DECIDED
```

### TD-006 — Data-fetching / mutation strategy

```
TD-006: Data-Fetching / Mutation Strategy
DECISION AREA:  Client-server data exchange patterns
REQUIREMENTS:   FR-040 (public list), FR-041 (public detail), FR-010 (admin list),
                FR-020-FR-033 (admin mutations), OWNER S6 §2 (Server Components
                prioritaires, Server Actions prioritaires, TanStack Query seulement
                si besoin réel)
OPTIONS:        Server Components + Server Actions | TanStack Query + REST/Server Routes
SELECTED:       Server Components for reads + Server Actions for mutations.
                TanStack Query NOT used in V1.
RATIONALE:      OWNER S6 §2 explicitly prefers Server Components / Server Actions.
                For V1:
                - Public reads (list, detail) → Server Components query the DB directly
                  via Drizzle. No client fetching needed. HTML rendered on server.
                - Admin reads (list with filter/search) → Server Components query the
                  DB. Pagination via URL search params (server-side).
                - Admin mutations (create, edit, publish, suspend, archive) → Server
                  Actions invoked from form submissions or button actions. No client
                  fetch needed.
                TanStack Query would add complexity (client state, cache invalidation,
                query keys) without clear V1 benefit since Server Components + Server
                Actions cover all data flows with better UX (no loading spinner needed
                for initial render) and better security (no client-side data layer).
                TanStack Query becomes useful for client-side mutations with optimistic
                updates — V1 has no such need.
CONSEQUENCES:   No TanStack Query dependency. Simpler bundle. Better SEO (server-rendered
                public pages). Mutations trigger full revalidation via Next.js
                revalidatePath or revalidateTag.
ADR CANDIDATE:  YES
STATUS:         DECIDED
```

### TD-007 — Form management for ADMIN

```
TD-007: Form Management for ADMIN
DECISION AREA:  Form state, validation UX, submission handling
REQUIREMENTS:   FR-020-FR-025 (admin form), FR-023-ERR/FR-024-ERR (validation feedback),
                OWNER S6 §1 (React Hook Form ou alternative plus simple si justifiée)
OPTIONS:        React Hook Form | Native form + FormData + Server Action only |
                Formik
SELECTED:       React Hook Form + Zod resolver (server-side Zod is the source of truth)
RATIONALE:      - Native form + FormData + Server Action: simplest, but client-side
                  validation feedback is limited. For a 16-field form, inline error
                  display per field becomes tedious without a form library.
                - React Hook Form: lightweight, uncontrolled (good perf), pairs
                  natively with Zod via zodResolver, supports inline per-field errors,
                  accessible by default (uses native form semantics). Established in
                  the React ecosystem.
                - Formik: older, less aligned with Server Actions pattern. RHF is
                  now preferred in the ecosystem.
                RHF + zodResolver is the right balance: simple, accessible, integrates
                with Server Actions. Client validation mirrors server Zod schemas but
                the server Zod is authoritative (S5 §11).
CONSEQUENCES:   Use react-hook-form + @hookform/resolvers/zod. Server Action validates
                with the same Zod schema and returns field errors if invalid.
ADR CANDIDATE:  NO (implementation detail)
STATUS:         DECIDED
```

### TD-008 — Validation library

```
TD-008: Validation Library (reclassified per OWNER revision §1)
DECISION AREA:  Server-side input validation
REQUIREMENTS:   BR-030 (required fields), BR-080 (URL/email format), OWNER S6 §1 (Zod
                is a strong preference but not a mandate), S5 §11 (server validation
                is the authority)
OPTIONS:        Zod | Yup | Valibot | io-ts
SELECTED:       Zod
RATIONALE:      OWNER stated Zod as an orientation, not a hard mandate. Among credible
                candidates, Zod is the de facto standard for TypeScript-first schema
                validation in 2025-2026:
                - Zod: largest ecosystem, native TypeScript inference, pairs with
                  Drizzle (drizzle-zod), React Hook Form (zodResolver), and Server
                  Actions (parse input server-side). Best documentation.
                - Yup: older, less TypeScript-native, smaller ecosystem in 2025.
                - Valibot: smaller bundle but smaller ecosystem; API similar to Zod
                  but less battle-tested.
                - io-ts: functional-programming style, steeper learning curve, less
                  aligned with the React/Next.js ecosystem.
                Zod is the simplest choice that fits V1 (Drizzle + RHF + Server
                Actions). This is a DECIDED choice, not a MANDATED constraint — if a
                future requirement proves another library better, S7 can revisit.
CONSEQUENCES:   All server-side validation uses Zod. Client-side mirrors via the same
                schemas for UX. Drizzle-zod can generate Zod schemas from the DB schema
                to avoid duplication.
ADR CANDIDATE:  NO (standard tool choice)
STATUS:         DECIDED
```

### TD-009 — Password hashing mechanism (revised per OWNER §2 and §7)

```
TD-009: Password Hashing Mechanism (revised)
DECISION AREA:  ADMIN and Fantomas password storage
REQUIREMENTS:   NFR-010 (no plaintext password; vetted mechanism)
OPTIONS:        Better Auth default (scrypt) | bcrypt | argon2id
SELECTED:       Better Auth default — scrypt (Node.js built-in crypto.scrypt)
RATIONALE:      Per OWNER revision §2 and §7: with Better Auth retained as the auth
                library (TD-003), the password hashing is delegated to Better Auth's
                default mechanism. Better Auth uses scrypt by default (Node.js
                crypto.scrypt — no native binding, no Vercel build concern, vetted
                standard). The bcrypt-vs-bcryptjs open question from the initial draft
                is therefore eliminated entirely (OWNER §7).
                - scrypt (Better Auth default): vetted, memory-hard, no native dep,
                  built into Node.js. Adequate for V1's small admin team.
                - bcrypt: would require a separate bcrypt dependency (native binding
                  or pure JS fallback). No advantage over scrypt for V1.
                - argon2id: stronger against GPU attacks but requires a native binding
                  with potential Vercel build issues. Overkill for V1.
                This decision is coupled to TD-003 (Better Auth). If TD-003 changes
                later, this decision is revisited.
CONSEQUENCES:   No separate password-hashing dependency. Better Auth handles
                hash/verify internally. The hash is stored in the user record (in
                the `password` column managed by Better Auth's Drizzle adapter).
                No `bcrypt` or `bcryptjs` npm package in the dependency tree.
ADR CANDIDATE:  NO (coupled to TD-003)
STATUS:         DECIDED
```

### TD-010 — Styling (reclassified per OWNER revision §1)

```
TD-010: Styling
DECISION AREA:  CSS / styling approach
REQUIREMENTS:   NFR-030 (accessibility), OWNER S6 §1 (Tailwind CSS as preference,
                not mandate), OWNER S6 §24 (simple, sobre, mobile responsive)
OPTIONS:        Tailwind CSS | CSS Modules | vanilla-extract | styled-components
SELECTED:       Tailwind CSS
RATIONALE:      OWNER stated Tailwind as a preference, not a hard mandate (Charter §10
                "Outils envisagés" + OWNER S6 §1). Among credible candidates:
                - Tailwind CSS: utility-first, strong accessibility defaults
                  (focus states, screen-reader classes), small production CSS,
                  good integration with shadcn/ui (TD-011). Largest ecosystem in 2025.
                - CSS Modules: native, no build dependency, but more verbose and
                  less suited for a design-system approach.
                - vanilla-extract: type-safe CSS-in-TS, good DX but smaller ecosystem.
                - styled-components: runtime CSS-in-JS, performance overhead, less
                  aligned with the RSC (React Server Components) model of Next.js
                  App Router.
                Tailwind is the simplest choice fitting V1 (RSC-compatible, shadcn/ui
                pairing). DECIDED, not MANDATED.
CONSEQUENCES:   tailwind.config.ts. No styled-components or emotion.
ADR CANDIDATE:  NO (standard tool choice)
STATUS:         DECIDED
```

### TD-011 — UI component library

```
TD-011: UI Component Library
DECISION AREA:  Pre-built UI components
REQUIREMENTS:   OWNER S6 §1 (shadcn/ui ou composants simples maison), OWNER S6 §24
                (pas de design system complexe)
OPTIONS:        shadcn/ui | composants maison | other component library (MUI, Chakra)
SELECTED:       shadcn/ui (with selective adoption — only the components actually used)
RATIONALE:      - shadcn/ui: copy-paste components (not a dependency), styled with
                  Tailwind, accessible by default (Radix UI primitives), well-aligned
                  with Next.js App Router. The "copy-paste" model means we own the
                  code; no version churn risk.
                - Composants maison: maximum flexibility but reinvents Form, Dialog,
                  Toast, Select, etc. Disproportionate effort for V1.
                - MUI / Chakra: heavier, opinionated design system, more lock-in.
                  OWNER explicitly excludes "design system complexe".
                shadcn/ui gives the right balance: accessible primitives from Radix,
                Tailwind styling we own, no external runtime dependency.
CONSEQUENCES:   components/ui/ folder with copied shadcn components (Button, Input,
                Textarea, Select, Label, Card, Badge, Dialog, Toast, etc.). Tailwind
                config extended with shadcn tokens. Lucide icons (TD-012).
ADR CANDIDATE:  NO (implementation detail)
STATUS:         DECIDED
```

### TD-012 — Icon library

```
TD-012: Icon Library
DECISION AREA:  Icons
REQUIREMENTS:   OWNER S6 §1 (Lucide si nécessaire)
SELECTED:       Lucide React (lucide-react)
RATIONALE:      Lightweight, tree-shakeable, consistent, Tailwind-friendly. Used by
                shadcn/ui by default. No material-icons font download needed.
CONSEQUENCES:   Icons imported per-component (tree-shaken).
ADR CANDIDATE:  NO (trivial)
STATUS:         DECIDED
```

### TD-013 — Rich text editor for offer description (revised per OWNER §4)

```
TD-013: Rich Text Editor for Offer Description (revised rendering contract)
DECISION AREA:  How ADMIN enters formatted description (paragraphs, lists, headings,
                links per BR-034) AND how the public renders it safely
REQUIREMENTS:   BR-034 (preserve formatting), OWNER S6 §5 (évalue Tiptap mais ne
                l'impose pas si une solution plus simple satisfait S5), OWNER revision
                §4 (corrected rendering contract)
OPTIONS:        Tiptap (rich text, JSON storage) | Markdown editor + textarea | Plain textarea
SELECTED:       Tiptap with JSON storage (jsonb) + Tiptap React server-side renderer
                for public rendering
RATIONALE:      - Tiptap: headless, framework-agnostic, produces structured JSON,
                  supports paragraphs/lists/headings/links out of the box. Mature,
                  maintained, used widely. WYSIWYG experience fits "professional
                  formatting" without requiring ADMIN to learn Markdown syntax.
                - Markdown + textarea: simpler but requires ADMIN to know Markdown
                  syntax. Goes against "simplicity of use" priority 1.
                - Plain textarea: no formatting. Fails BR-034.
                Tiptap is the right balance for editing.

                STORAGE: Tiptap JSON (ProseMirror document structure) in the
                `description` column of type `jsonb`. No raw HTML in DB.

                RENDERING (revised per OWNER §4): the public detail page renders the
                description from the Tiptap JSON **directly to React elements** using
                Tiptap's React renderer (`@tiptap/react` with `editor.JSONContent` →
                React components), running server-side inside a Server Component.
                This avoids the HTML-string roundtrip entirely:
                - No `generateHTML(json)` producing an HTML string.
                - No `dangerouslySetInnerHTML` with the resulting HTML string.
                - The Tiptap React renderer produces safe React elements from the
                  JSON: only known node types are rendered; unknown HTML or arbitrary
                  strings are ignored (Tiptap's schema enforces this).
                This is the safest rendering contract: structured JSON in DB → safe
                React elements on the server → safe HTML sent to the client.

                IF a HTML string is ever needed (e.g., for an RSS feed, a sitemap, or
                an email — none of which exist in V1), the mechanism must be:
                (a) `generateHTML(json)` produces an HTML string;
                (b) sanitize the HTML string with a vetted sanitizer
                    (e.g., `sanitize-html` with an explicit allowlist of tags and
                    attributes: p, ul, ol, li, h1, h2, h3, a[href], strong, em, br);
                (c) the sanitized HTML may then be rendered via
                    `dangerouslySetInnerHTML` ONLY if step (b) is verified.
                For V1's public rendering, this HTML-string path is NOT used; the
                React renderer is the default and only rendering path.

                The previous draft's contract was internally inconsistent (it stated
                "generateHTML" AND "no dangerouslySetInnerHTML" without explaining how
                the HTML would actually be rendered). This revision removes the
                inconsistency: V1 uses the Tiptap React renderer server-side, no
                HTML string is generated for public rendering.
CONSEQUENCES:   - Editor (admin side): @tiptap/react + @tiptap/starter-kit +
                @tiptap/extension-link + @tiptap/extension-text-align (client component).
                - Storage: `description` column type `jsonb` in `offers` table.
                - Rendering (public): @tiptap/react React renderer inside a Server
                Component — produces safe React elements from JSON, no HTML string.
                - No `dangerouslySetInnerHTML` for user content in V1.
                - No `sanitize-html` dependency needed in V1 (the React renderer is
                safe by construction). The sanitize-html path is documented above for
                future use only if a HTML string becomes necessary (deferred).
ADR CANDIDATE:  YES (revised)
STATUS:         DECIDED
```

### TD-014 — Public offer URL strategy

```
TD-014: Public Offer URL Strategy
DECISION AREA:  URL format for public offer detail pages
REQUIREMENTS:   FR-041 (public detail), FR-042 (non-published returns not-found),
                OWNER S6 §17 (évalue /offres/{id}, /offres/{slug}, /offres/{id}-{slug})
OPTIONS:        /offres/{id} | /offres/{slug} | /offres/{id}-{slug}
SELECTED:       /offres/{id} (where id is the offer's UUID)
RATIONALE:      - /offres/{id}: stable URL (id never changes), simple, no collision
                  risk. SEO: id is not a keyword but Next.js metadata + sitemap can
                  include title in the page title. URL is less pretty but durable.
                - /offres/{slug}: requires a unique slug derived from title. Problem:
                  titles can change (ADMIN edits title), which means slug must either
                  change (URL breaks, SEO loss) or be immutable (slug diverges from
                  title). Need a slug history table or redirect logic — disproportionate
                  for V1.
                - /offres/{id}-{slug}: best of both worlds for SEO but adds complexity
                  (slug extraction, redirect if slug changes). Still needs a slug
                  field in DB.
                For V1, /offres/{id} is the simplest durable choice. SEO is handled
                via Next.js metadata (title, description, canonical) + a sitemap.xml
                route that lists all published offers with their lastmod. A future
                version can add slug-based URLs with redirects if SEO becomes a
                priority.
CONSEQUENCES:   Route: app/(public)/offres/[id]/page.tsx. id is UUID v4 (TD-015).
                404 if offer is not PUBLISHED (FR-042).
ADR CANDIDATE:  YES
STATUS:         DECIDED
```

### TD-015 — ID strategy

```
TD-015: ID Strategy
DECISION AREA:  Primary key type for offers, users
REQUIREMENTS:   DR-010 (id format deferred to S6), NFR-060 (data integrity)
OPTIONS:        UUID v4 | BIGSERIAL (auto-increment integer) | ULID | nanoid
SELECTED:       UUID v4 (PostgreSQL native uuid type)
RATIONALE:      - UUID v4: globally unique, no collision risk, no sequential leak
                  (admin can't guess how many offers exist by incrementing id in URL),
                  PostgreSQL native uuid type, supported by Drizzle. Slightly larger
                  (16 bytes) than BIGSERIAL (8 bytes) but negligible for V1 scale.
                - BIGSERIAL: simpler, smaller, but exposes count via URL (/offres/1,
                  /offres/2...) and makes ID prediction possible. Acceptable for V1
                  but UUID is safer long-term.
                - ULID/nanoid: lexicographically sortable (nice for sort) but adds
                  a dependency; V1 sorts by published_at, not by id.
                UUID v4 is the standard choice. No sortability needed from id
                (BR-070 uses published_at).
CONSEQUENCES:   id column type uuid, default gen_random_uuid() (PostgreSQL ≥ 13).
ADR CANDIDATE:  NO (standard)
STATUS:         DECIDED
```

### TD-016 — Public search strategy (revised per OWNER §7, §8)

```
TD-016: Public Search Strategy (revised)
DECISION AREA:  How public text search (title, company, location) is implemented AND
                exposed (URL strategy)
REQUIREMENTS:   FR-050 (SHOULD — simple text search on title, company, location),
                OWNER S6 §9 (PostgreSQL ILIKE ou full-text si utile, pas d'Elasticsearch),
                OWNER revision §7 (décider en S6 : Server Component + searchParams,
                pas d'API publique), OWNER revision §8 (pas de pg_trgm obligatoire en
                V1 initiale, optimisation mesurée)
OPTIONS:        PostgreSQL ILIKE | PostgreSQL full-text search (tsvector + tsquery) |
                Elasticsearch (EXCLUDED per OWNER)
SELECTED:       PostgreSQL ILIKE (case-insensitive LIKE) on title + company + location
                with OR conditions; exposed via Server Component + URL searchParams
                (no public API route handler)
RATIONALE:      - ILIKE: simplest, no extra index type needed by default (a trigram
                  index can be added later if performance requires — see below),
                  works for "contains" semantics directly. For a small editorial
                  portal (single-digit to low-thousands of offers), ILIKE performance
                  is fine. Matches the SHOULD priority of FR-050.
                - Full-text search (tsvector GIN index): more powerful (stemming,
                  ranking, multi-language), but adds complexity (tsvector column,
                  trigger to maintain, query syntax). Overkill for V1.
                - Elasticsearch: excluded per OWNER S6 §9 (no distributed search
                  engine for V1).

                EXPOSURE (revised per OWNER §7): the public search is implemented as
                a Server Component reading the `?q=` URL search parameter, querying
                the DB via Drizzle, and rendering the filtered list server-side. NO
                public API route handler is created solely for the search. The URL
                `/offres?q=...` is the public search interface; it is server-rendered
                and indexable. This avoids creating a "public API" that V1 explicitly
                excludes (INT-001, OOS-015).

                pg_trgm (OWNER revision §8): the pg_trgm GIN index is an OPTIONAL
                PERFORMANCE OPTIMIZATION, NOT a V1 initial requirement. V1 ships
                WITHOUT pg_trgm. If production profiling later shows ILIKE queries
                exceeding the response-time expectation (when the offer count grows
                well beyond editorial portal scale), the operator adds the pg_trgm
                extension and a GIN index via a new forward migration (per TD-018
                doctrine). This is a measured optimization, not an initial dependency.
CONSEQUENCES:   Query: WHERE title ILIKE '%' || $1 || '%' OR company ILIKE '%' || $1
                || '%' OR location ILIKE '%' || $1 || '%'. URL: /offres?q=term.
                No pg_trgm extension in V1 initial migrations. No public API route
                handler for search. The search is a Server Component reading searchParams.
                pg_trgm addition deferred to a future migration only if profiling
                proves the need.
ADR CANDIDATE:  NO (implementation detail)
STATUS:         DECIDED
```

### TD-017 — Package manager (reclassified per OWNER revision §1)

```
TD-017: Package Manager
DECISION AREA:  JS package manager and lockfile
REQUIREMENTS:   OWNER S6 §28 ("pnpm recommandé" — a recommendation, not a mandate)
OPTIONS:        pnpm | npm | yarn | bun
SELECTED:       pnpm
RATIONALE:      OWNER recommended pnpm (not mandated). Among credible candidates:
                - pnpm: faster, disk-efficient (content-addressed store), strict about
                  phantom dependencies, deterministic lockfile (pnpm-lock.yaml). Native
                  Vercel support.
                - npm: default, no install needed, but slower and less disk-efficient.
                - yarn: similar to pnpm but smaller ecosystem share in 2025.
                - bun: fastest but newer, smaller ecosystem, lockfile format still
                  evolving.
                pnpm is the best fit for V1. DECIDED, not MANDATED.
CONSEQUENCES:   pnpm-lock.yaml committed. Vercel build setting: package manager = pnpm.
ADR CANDIDATE:  NO (standard tool choice)
STATUS:         DECIDED
```

### TD-018 — Database migration strategy (revised per OWNER §11)

```
TD-018: Database Migration Strategy (revised doctrine)
DECISION AREA:  Schema migration tooling and process
REQUIREMENTS:   OWNER S6 §14 (migrations versionnées, reproductibles, aucune
                modification manuelle non tracée, distinction schema/seed), OWNER
                revision §11 (forward corrective migrations preferred over automatic
                down migrations), TD-004 (Drizzle)
SELECTED:       Drizzle Kit (drizzle-kit) for schema migrations; separate seed/bootstrap
                scripts (not migrations) for initial data
RATIONALE:      Drizzle Kit is the official Drizzle migration tool. Schema-as-code in
                db/schema.ts. drizzle-kit generate creates versioned SQL migration files
                in db/migrations/. drizzle-kit migrate applies them. Idempotent
                where possible (Drizzle tracks applied migrations in a __drizzle_migrations
                table). Seed scripts are separate (db/seed/ and db/bootstrap/) and do
                NOT modify schema.

                MIGRATION DOCTRINE (per OWNER revision §11):
                1. Schema source controlled by Git (db/schema.ts is the source of truth).
                2. Migrations are generated via `drizzle-kit generate` and code-reviewed
                   before merge (no auto-generated migration merged blindly).
                3. Migrations are applied in a controlled manner:
                   - Local dev: developer runs `pnpm db:migrate` manually.
                   - Preview: applied automatically on Vercel Preview build OR manually
                     by operator against the preview Neon branch (S10 decision).
                   - Production: applied MANUALLY by operator before Vercel production
                     promotion, OR via a Vercel pre-deploy build hook (configurable).
                     NEVER automatically without verification.
                4. NEVER run `drizzle-kit push` against Production as a normal
                   mechanism — `push` skips the migration files and writes schema
                   directly, bypassing the versioned record. `push` is allowed only
                   for local dev experimentation, NEVER for Preview or Production.
                5. NO silent manual modification of the Production schema — every
                   schema change goes through a versioned migration file.

                ROLLBACK DOCTRINE (per OWNER revision §11):
                - V1 prefers FORWARD CORRECTIVE migrations over relying on automatic
                  down migrations.
                - If a migration causes a production issue, the response is:
                  (a) Roll back the Vercel deployment to the previous build
                      (instant, via Vercel dashboard).
                  (b) Write a NEW forward corrective migration that fixes the issue
                      (e.g., re-add a dropped column, fix a constraint).
                  (c) Apply the corrective migration via the normal controlled path.
                - Drizzle can generate down migrations for safety debugging, but V1
                  does NOT rely on running down migrations in production as a normal
                  rollback mechanism — down migrations can lose data (e.g., dropping
                  a column added by the up migration loses the data written to it).
                - The ultimate data rollback is Neon PITR (point-in-time recovery,
                  Section 8.7) for cases where forward correction is insufficient.
                - Exception: if a migration is purely additive (add column, add table,
                  add index) and the up migration is reversible without data loss, a
                  down migration may be retained for that specific case. This is the
                  only case where down migrations are part of the normal rollback
                  plan in V1.

                SEED vs BOOTSTRAP distinction (per OWNER revision §12):
                - SEED (demo data): optional scripts that populate the DB with sample
                  offers for development/demonstration. NEVER run against Production.
                  Lives in db/seed/demo.ts. Not part of migrations. Optional, run
                  manually in dev only.
                - BOOTSTRAP (system principals): the idempotent script that creates
                  Fantomas and the initial ADMIN. Lives in db/bootstrap/. Run ONCE
                  per environment after the first deploy, then can be re-run safely
                  (idempotent — does not overwrite existing users). This is NOT a
                  seed; it is a controlled bootstrap. See TD-020.
CONSEQUENCES:   db/migrations/ folder with versioned .sql files (generated by
                drizzle-kit). Drizzle meta table tracks applied migrations. db/seed/
                for demo data (dev only, never production). db/bootstrap/ for Fantomas
                + initial ADMIN (controlled, idempotent, per-environment).
                Production migration execution: explicit, never automatic, never
                via `drizzle-kit push`. Forward corrective migrations preferred over
                down migrations in production.
ADR CANDIDATE:  YES
STATUS:         DECIDED
```

### TD-019 — Environment model (Production vs Preview)

```
TD-019: Environment Model
DECISION AREA:  Environment separation
REQUIREMENTS:   Charter §10 (Production separated from Preview — MANDATED),
                OWNER S6 §13
SELECTED:       Two environments on Vercel (Production + Preview) with two Neon
                databases (Production branch + Preview branches). Local dev uses a
                local Neon branch or a local PostgreSQL.
RATIONALE:      - Vercel Production environment → Neon main branch (production DB).
                - Vercel Preview environments (one per git branch / PR) → Neon preview
                  branches (one per Vercel preview deployment, auto-created via Neon
                  Vercel integration).
                - Local development → developer's local Neon branch (created from
                  main) OR a local PostgreSQL instance for offline work.
                This guarantees a Preview deployment never touches production data.
                Each Neon preview branch is isolated and ephemeral (deleted when the
                Vercel preview deployment is deleted).
                No dedicated staging environment in V1 — Vercel Preview + Neon preview
                branches cover the need. A staging environment can be added in V2 if
                OWNER identifies a specific need.
CONSEQUENCES:   Vercel env vars:
                - Production: DATABASE_URL (Neon main branch), AUTH_SECRET, FANTOMAS_INITIAL_PASSWORD_HASH (or plain value at first-deploy bootstrap — see TD-020), NEXT_PUBLIC_SITE_URL (production domain)
                - Preview: DATABASE_URL (Neon preview branch for this PR), AUTH_SECRET (preview-specific), FANTOMAS_INITIAL_PASSWORD_HASH (preview-specific, can be a known test value), NEXT_PUBLIC_SITE_URL (preview domain)
                - Local: .env.local with developer's local DATABASE_URL
                The Vercel-Neon integration auto-provisions preview branches per PR.
ADR CANDIDATE:  YES (security-critical)
STATUS:         DECIDED
```

### TD-020 — Bootstrap of initial ADMIN and Fantomas (revised per OWNER §12)

```
TD-020: Bootstrap of Initial ADMIN and Fantomas (revised)
DECISION AREA:  How the first ADMIN and Fantomas are created without a public
                registration flow
REQUIREMENTS:   FR-004 (no public registration), NFR-013 (Fantomas credential handling),
                PERM-004 (Fantomas capabilities), AISE S0 §14/§21, S0 §13/§25,
                OWNER S6 §15 (idempotent, controlled, reproductible), OWNER revision §12
                (distinction: SEED démo ≠ BOOTSTRAP des principaux système)
SELECTED:       Idempotent bootstrap script (db/bootstrap/bootstrap.ts, NOT db/seed/)
                that:
                1. Creates the Fantomas user if it does not exist, with the
                   FANTOMAS_INITIAL_PASSWORD env var. The script uses Better Auth's
                   `auth.api.createUser()` server-side, which handles password hashing
                   (scrypt by default per TD-009) — the script does NOT hash passwords
                   itself.
                   Login (username) = "Fantomas". Role = "fantomas".
                   The script is idempotent — if Fantomas already exists, it is NOT
                   recreated, and a warning is logged. The password is NOT overwritten
                   on subsequent runs (so rotations done via the V2 admin UI or by
                   Fantomas directly are preserved).
                2. Optionally creates the initial ADMIN user(s) listed in a config-driven
                   bootstrap config (e.g., db/bootstrap/config.ts with login + env-var
                   name for the password — NEVER plaintext in the config). This is for
                   V1 bootstrap only; future ADMIN management UI is deferred (DR-050).
                3. The bootstrap script is run manually after migration (NOT automatic).
                   It is the deployment operator's responsibility (or OWNER's) to run
                   `pnpm db:bootstrap` once per environment after the first deployment.

                FANTOMAS_INITIAL_PASSWORD is provided via Vercel env var (Production
                and Preview separately). Per S0 §25, this secret is requested at the
                exact boundary where it is needed (deployment time, not S6/S7 time).
                The bootstrap script passes the password to Better Auth's createUser,
                which hashes it — only the hash is persisted in the DB. The plaintext
                password NEVER enters the database, the repository, or the logs.

                SEED vs BOOTSTRAP distinction (per OWNER revision §12):
                - The bootstrap script (db/bootstrap/) is for system principals ONLY
                  (Fantomas + initial ADMIN). It is NOT a demo seed.
                - A separate optional demo seed (db/seed/demo.ts) may exist for
                  development and demonstration purposes (sample offers). It is NEVER
                  run against Production. It is run manually in dev only.
                - The two are kept separate to ensure the bootstrap of system
                  principals does NOT depend on demo data being loaded.
RATIONALE:      - Avoids public registration (FR-004).
                - Idempotent: safe to re-run.
                - Fantomas is bootstrapped via env var + bootstrap script, satisfying
                  AISE §14 (Fantomas as bootstrap principal).
                - The initial ADMIN can be created by Fantomas post-bootstrap via
                  an ADMIN management UI — but V1 defers that UI (DR-050). For V1
                  launch, the initial ADMIN is created via the bootstrap script too.
                - The plaintext password NEVER enters the repository, the database,
                  or the logs. Only the scrypt hash is stored (via Better Auth).
                - Separating bootstrap (system) from seed (demo) prevents accidental
                  contamination of Production with demo data, and ensures bootstrap
                  is not coupled to demo data being present.
CONSEQUENCES:   db/bootstrap/bootstrap.ts script. db/bootstrap/config.ts for initial
                ADMIN config. Env vars: FANTOMAS_INITIAL_PASSWORD (Production + Preview
                separately). After first production deploy: OWNER (or operator) runs
                `pnpm db:bootstrap` once. The script logs what was created and warns
                if Fantomas already exists (no overwrite).
ADR CANDIDATE:  YES (security-critical + AISE-mandated)
STATUS:         DECIDED
```

### TD-021 — Representation of Entreprises / Secteurs / Catégories

```
TD-021: Representation of Entreprises / Secteurs / Catégories
DECISION AREA:  Storage and editing of company, sector, category fields
REQUIREMENTS:   Charter §7 + OWNER S6 §15 (no separate CRUD modules; these are info
                attached to offer, not standalone entities), BR-032 (never invent)
OPTIONS:        Free text columns | Enum columns | Reference tables with foreign keys
SELECTED:       Free text columns (text) for company, sector, category, contract_type,
                education_level, experience, location
RATIONALE:      OWNER S6 §15 explicitly forbids CRUD modules for these in V1.
                Creating reference tables would imply a CRUD admin to manage them
                (otherwise they'd be empty). Free text is the simplest representation:
                the ADMIN types what they know; the system never invents values
                (BR-032). This preserves the "no normalisation" intent.
                A future version can introduce reference tables + autocomplete if the
                OWNER identifies a need (e.g., consistent sector filtering).
CONSEQUENCES:   All seven fields are text columns in the offers table. No joins
                needed for queries. The admin form uses plain text inputs (with
                optional datalist for suggestions if useful, but no constraint).
ADR CANDIDATE:  YES (architectural choice that bounds future scope)
STATUS:         DECIDED
```

### TD-022 — Date display format and timezone handling

```
TD-022: Date Display Format and Timezone Handling
DECISION AREA:  How dates are stored, processed, and displayed
REQUIREMENTS:   BR-060 (date categorization), BR-070 (public sort by published_at),
                OWNER S6 §12 (types PostgreSQL, timezone, traitement serveur,
                présentation utilisateur)
SELECTED:       Storage:
                - source_publication_date: date (no time)
                - application_deadline: date (no time)
                - published_at: timestamptz (UTC)
                - created_at: timestamptz (UTC)
                - updated_at: timestamptz (UTC)
                Server processing:
                - All timestamptz values are read as UTC from the DB.
                - For public display, format dates in a stable French format
                  (e.g., "14 septembre 2026") using Intl.DateTimeFormat('fr-FR').
                  The display timezone is UTC for V1 (no per-user timezone). If the
                  visitor's local timezone matters in a future version, an explicit
                  decision will be made in V2.
                - For ADMIN display and form input, dates use the ISO format
                  (yyyy-mm-dd) for date inputs, and a readable French format for
                  timestamps (created_at, updated_at).
                Public sort (BR-070) uses published_at (timestamptz) DESC at the DB
                level — no timezone conversion needed.
RATIONALE:      timestamptz is the standard PostgreSQL type for moments in time. UTC
                storage avoids ambiguity. Date-only fields use date type (no tz needed).
                French display via Intl is the simplest correct approach.
CONSEQUENCES:   Drizzle schema: timestamptz({ withTimezone: true }) for published_at,
                created_at, updated_at; date for source_publication_date and
                application_deadline.
ADR CANDIDATE:  NO (standard)
STATUS:         DECIDED
```

### TD-023 — Pagination strategy

```
TD-023: Pagination Strategy
DECISION AREA:  How offer lists (public + admin) are paginated
REQUIREMENTS:   FR-010 (admin list navigable), FR-040 (public list navigable),
                OWNER S6 §9 (pagination ou stratégie équivalente si nécessaire)
OPTIONS:        Offset-based pagination (LIMIT + OFFSET) | Cursor-based pagination
SELECTED:       Offset-based pagination (LIMIT + OFFSET) with URL search params
                (?page=2)
RATIONALE:      - Offset: simplest, supports jumping to a specific page, works with
                  the default sort (published_at DESC). For V1 scale (editorial portal),
                  offset performance is fine even at a few thousand offers.
                - Cursor: better for very large or fast-changing datasets (no count
                  drift), but adds complexity (cursor encoding, no jump-to-page).
                  Overkill for V1.
                Default page size: 20 (public + admin). Configurable in lib/server/pagination.ts.
CONSEQUENCES:   Drizzle queries use limit + offset. URL: /offres?page=2 (public),
                /admin/offres?page=2 (admin). Total count query for pagination UI
                (computed with a separate count query — small N, no perf issue).
ADR CANDIDATE:  NO (implementation detail)
STATUS:         DECIDED
```

### TD-024 — Testing strategy

```
TD-024: Testing Strategy
DECISION AREA:  Test layers and tools
REQUIREMENTS:   OWNER S6 §21 (Vitest unit, React Testing Library component, Playwright
                E2E; critical E2E covers the full admin+public lifecycle), NFR-060
                (data integrity)
SELECTED:       Layer 1 — Unit/logic: Vitest (pure functions, validation, business rules)
                Layer 2 — Component: React Testing Library + Vitest (UI components in isolation)
                Layer 3 — Integration: Vitest + real Neon preview branch (Drizzle queries
                against a real PostgreSQL; NO mocking of the DB)
                Layer 4 — E2E: Playwright (critical user journey per OWNER S6 §21)
                Mocking discipline (S6 §18):
                - DB: NEVER mocked in integration tests. Use a real Neon preview branch
                  or a local PostgreSQL container.
                - Auth: mocked at the session level for non-auth-focused tests; real
                  Better Auth flow tested in integration.
                - External APIs: N/A in V1 (no external integration).
                Critical E2E scenario (OWNER S6 §21):
                1. ADMIN login
                2. ADMIN creates DRAFT offer
                3. ADMIN saves (still DRAFT)
                4. ADMIN edits
                5. ADMIN publishes → PUBLISHED
                6. PUBLIC sees offer in list
                7. PUBLIC opens detail → all fields visible
                8. ADMIN suspends → PUBLIC 404 on detail
                9. ADMIN republishes → PUBLIC sees again
                10. ADMIN archives → PUBLIC 404
                11. ADMIN sees archived offer in admin list (content preserved)
CONSEQUENCES:   vitest + @testing-library/react + playwright. Test setup in vitest.config.ts.
                E2E runs against a Vercel Preview deployment (or local Next.js server)
                with a dedicated Neon preview branch. Vitest integration tests use
                a separate test DATABASE_URL (Neon preview branch).
ADR CANDIDATE:  YES (testing architecture is structuring)
STATUS:         DECIDED
```

### TD-025 — CI pipeline

```
TD-025: CI Pipeline
DECISION AREA:  GitHub Actions workflow
REQUIREMENTS:   OWNER S6 §27 (typecheck, lint, tests, build, éventuellement Playwright
                selon coût)
SELECTED:       GitHub Actions workflow on PR + on push to main:
                - Job 1: install (pnpm)
                - Job 2: typecheck (tsc --noEmit)
                - Job 3: lint (eslint)
                - Job 4: unit + component tests (vitest)
                - Job 5: build (next build)
                - Job 6 (optional, on main only): E2E (Playwright) against a Preview
                  deployment. Skipped on PRs for cost; can be enabled per-PR manually
                  via a label.
RATIONALE:      Simple, fast feedback on PRs. E2E on main ensures the critical path
                stays green. E2E on PRs is opt-in via a label to control cost.
CONSEQUENCES:   .github/workflows/ci.yml. Playwright job conditional on
                github.event.pull_request.label.name == 'run-e2e' or on push to main.
ADR CANDIDATE:  NO (implementation detail)
STATUS:         DECIDED
```

### TD-026 — Observability

```
TD-026: Observability
DECISION AREA:  Logging, error tracking, metrics
REQUIREMENTS:   OWNER S6 §22 (logs serveur structurés suffisants, logs Vercel, erreurs
                importantes observables, Sentry seulement si valeur claire)
SELECTED:       Structured server logs (console with JSON format in production) +
                Vercel platform logs + Next.js error boundary for UI errors.
                Sentry: NOT used in V1 (deferred — see DR-180 in this document).
RATIONALE:      V1 has no formal uptime SLO (Charter §13). Structured logs to stdout
                (JSON in production) + Vercel's log viewer are sufficient for V1
                observability. Sentry would add value for production error tracking
                but is not strictly necessary at V1 scale; can be added in V2 if
                OWNER identifies a need.
                Per AISE S0 §23 (zero scheduled work), no automated alerting or
                monitoring cron is configured. OWNER/operator checks Vercel logs
                manually when needed.
CONSEQUENCES:   A small logger utility (lib/server/logger.ts) that wraps console with
                JSON formatting in production and pretty format in dev. No Sentry SDK
                in V1.
ADR CANDIDATE:  NO (proportional to V1)
STATUS:         DECIDED
```

### TD-027 — Lint / formatting

```
TD-027: Lint / Formatting
DECISION AREA:  Code quality tooling
REQUIREMENTS:   OWNER S6 §28 (ESLint, formatting, TypeScript strict)
SELECTED:       ESLint (with Next.js + TypeScript plugins) + Prettier + TypeScript
                strict mode
RATIONALE:      Standard Next.js setup. ESLint catches React/Next.js-specific issues.
                Prettier handles formatting. TS strict catches type errors at compile
                time. Together they prevent most common bugs.
CONSEQUENCES:   .eslintrc.json (Next.js recommended + strict). .prettierrc.
                tsconfig.json with strict: true. CI runs all three (TD-025).
ADR CANDIDATE:  NO (standard)
STATUS:         DECIDED
```

### TD-028 — CSRF protection

```
TD-028: CSRF Protection
DECISION AREA:  Protection of Server Actions against cross-site request forgery
REQUIREMENTS:   NFR-012 (session protection), OWNER S6 §19
SELECTED:       Next.js Server Actions built-in CSRF protection (origin check) +
                SameSite=Lax session cookies
RATIONALE:      Next.js App Router Server Actions have built-in origin verification
                since v14 (the framework compares the Origin header to the allowed
                origins). Combined with SameSite=Lax on the Better Auth session cookie,
                this provides adequate CSRF protection for V1 without custom token
                management.
CONSEQUENCES:   No custom CSRF token. Better Auth session cookie config: sameSite: 'lax',
                secure: true in production, httpOnly: true (per TD-003 revised).
ADR CANDIDATE:  YES (security-relevant)
STATUS:         DECIDED
```

### TD-029 — Sitemap / SEO

```
TD-029: Sitemap / SEO
DECISION AREA:  How public offer pages are indexable
REQUIREMENTS:   OWNER S6 §16 (pages indexables, metadata, URL, canonical, robots/sitemap
                seulement si utile, pas d'usine SEO)
SELECTED:       Next.js metadata API (generateMetadata per route) + a sitemap.xml
                route (app/sitemap.ts) listing all PUBLISHED offers + a robots.txt
                route (app/robots.ts) allowing indexing of public pages and
                disallowing /admin/*.
RATIONALE:      Standard Next.js App Router primitives. No SEO framework needed.
                metadata.title and metadata.description per offer detail page
                (using offer title and a generated description from the description
                content). Canonical URL is the public /offres/[id] URL.
CONSEQUENCES:   app/sitemap.ts generates sitemap.xml from DB query (PUBLISHED offers
                only). app/robots.ts is static. Each page exports a generateMetadata
                function.
ADR CANDIDATE:  NO (standard)
STATUS:         DECIDED
```

### TD-030 — Neon PostgreSQL driver (added per OWNER §5, finalized per OWNER final patch §4)

```
TD-030: Neon PostgreSQL Driver (finalized)
DECISION AREA:  Which Drizzle-Neon binding to use for DB access
REQUIREMENTS:   TD-002 (PostgreSQL on Neon), TD-004 (Drizzle), OWNER revision §5 (driver
                choice must match V1's actual transaction needs), OWNER final patch §4
                (choose explicitly between drizzle-orm/neon-http and
                drizzle-orm/neon-serverless; do NOT leave "HTTP/WebSockets" as two
                possibilities in a DECIDED entry)
OPTIONS:        drizzle-orm/neon-http (HTTP, no interactive transactions) |
                drizzle-orm/neon-serverless (WebSocket, interactive transactions) |
                drizzle-orm/postgres-js (TCP, full interactive transactions)
SELECTED:       drizzle-orm/neon-http (HTTP-based, no interactive transactions)
RATIONALE:      V1's transaction needs (per OWNER revision §6 and final patch §4 —
                identify operations requiring a transaction):
                1. Bootstrap of Fantomas + initial ADMIN — single createUser call per
                   user via Better Auth (which internally does INSERT user + INSERT
                   account credential). Better Auth executes these as separate
                   statements, not a multi-statement interactive transaction. If the
                   second INSERT fails, the first can remain (idempotent re-run handles
                   it; or the bootstrap script can wrap them in a try/catch and clean
                   up). No interactive transaction required.
                2. Better Auth session creation — single INSERT into the session table.
                3. Better Auth rate limiter with database storage (TD-031 revised) —
                   INSERT or UPSERT into a rate-limit table + SELECT count. Better
                   Auth's rate limiter executes these as separate statements; no
                   multi-statement interactive transaction required. The rate-limit
                   counter is eventually consistent (a slight over-count or under-count
                   under concurrent attempts is acceptable for V1's threat model —
                   Vercel edge DDoS protection is the primary defense).
                4. Offer mutations (create, edit, publish, suspend, archive) — each is
                   a single UPDATE or INSERT on the offers table, optionally with a
                   revalidatePath call (not a DB operation). No multi-statement
                   transaction needed.
                5. Public reads — single SELECT per request.

                V1 has NO multi-statement interactive transactions, NO long-running
                transactions, NO transactions requiring a persistent WebSocket or
                TCP connection across multiple round trips. All V1 DB operations are
                short, single-statement HTTP requests.

                Therefore:
                - drizzle-orm/neon-http: HTTP-based, one request per statement, no
                  persistent connection, no interactive transactions. Simplest,
                  fastest cold-start, best fit for Vercel serverless functions.
                  Sufficient for ALL V1 operations listed above.
                - drizzle-orm/neon-serverless (WebSocket): supports interactive
                  transactions via persistent WebSocket — overkill for V1; adds
                  WebSocket lifecycle complexity (connection management, reconnect,
                  idle timeout) for no benefit.
                - drizzle-orm/postgres-js (TCP): would require a persistent connection
                  or a pool, fragile on Vercel serverless. Overkill.

                drizzle-orm/neon-http is the simplest binding compatible with V1's
                actual operations. If a future version requires interactive
                transactions (e.g., a multi-step data import needing atomicity across
                statements), the binding can be switched to drizzle-orm/neon-serverless
                or drizzle-orm/postgres-js for that specific code path.
CONSEQUENCES:   Drizzle is instantiated with the neon-http binding:
                `drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), {
                ...neonConfig })` from drizzle-orm/neon-http. Underlying package:
                @neondatabase/serverless (the neon-http binding uses
                @neondatabase/serverless's HTTP client under the hood). No `pg` or
                `postgres-js` dependency. No WebSocket connection. All DB operations
                are single-statement HTTP requests.
                IMPORTANT: any code path that later needs an interactive transaction
                must NOT silently use db.transaction() expecting it to work on
                neon-http — it will not. Such a code path requires switching the
                binding for that path or rethinking the operation.
ADR CANDIDATE:  NO (implementation detail, but explicit to avoid S10 ambiguity)
STATUS:         DECIDED
```

### TD-031 — Login rate limiting architecture (finalized per OWNER final patch §1)

```
TD-031: Login Rate Limiting Architecture (finalized)
DECISION AREA:  Architectural mechanism for protecting the login endpoint against
                brute-force attacks, compatible with Vercel serverless
REQUIREMENTS:   NFR-012 (session protection), OWNER revision §7 (define the behavior
                architecturally in S6), OWNER final patch §1 (in-memory per-IP is NOT
                retained for Vercel/serverless production; use Better Auth integrated
                rate limiter; storage = database = Neon PostgreSQL; no Redis; no
                custom rate limiter)
OPTIONS:        Better Auth integrated rate limiter + database storage (Neon) |
                In-memory per-IP (REJECTED — not serverless-compatible) |
                DB-backed custom rate limiter (REJECTED — reinvents Better Auth) |
                Vercel KV / Upstash Redis (REJECTED — paid add-on, OWNER excludes)
SELECTED:       Better Auth integrated rate limiter, with database storage backed by
                Neon PostgreSQL. Applied to the authentication endpoints (login
                primarily; the only unauthenticated mutation in V1).
RATIONALE:      OWNER final patch §1 directs S6 to NOT use in-memory rate limiting for
                production Vercel/serverless (Better Auth documents that in-memory
                storage is not suitable for serverless environments because each
                function instance has its own memory and the counter does not
                persist across instances or cold starts — an attacker hitting
                different instances would bypass it).

                Decision: use Better Auth's integrated rate limiter (the rate limiting
                feature built into Better Auth) with `storage = database` (a Drizzle-
                backed storage adapter pointing at the same Neon PostgreSQL database
                used by the rest of V1). This:
                - Is serverless-compatible (the counter is in the DB, not in process
                  memory; it persists across function instances and cold starts).
                - Adds NO new dependency (no Redis, no Vercel KV, no Upstash).
                - Adds NO custom rate-limiter code (no reinvention, no maintenance
                  burden, no sliding-window vs token-bucket choice to maintain).
                - Is configured via Better Auth's config (rateLimit option with the
                  database storage adapter); the rate-limit table is generated by
                  Better Auth's Drizzle schema generation, then integrated into the
                  versioned Drizzle migrations per TD-018 doctrine.

                Scope: applied to the authentication endpoints (login). The default
                rules (configurable at implementation time) cover the main brute-
                force concern: limit failed login attempts per IP/username within a
                rolling window. The exact thresholds (e.g., max 5 failed attempts
                per IP per 15 minutes, max 10 per username per hour) are S10
                implementation choices — S6 fixes only the architecture: Better Auth
                rate limiter + database storage + Neon.

                On threshold exceeded, the login attempt is rejected by Better Auth
                with a generic error (no information leak about whether the
                username/password was valid — same shape as FR-001-ERR).

                The rate limiter does NOT cover admin mutations (those are already
                protected by authentication + requireCapability). It does NOT cover
                public reads (Vercel edge DDoS protection handles those).
CONSEQUENCES:   - Better Auth config includes the rate limiter with database storage
                  adapter (Drizzle adapter, same DATABASE_URL as the rest of V1).
                - Better Auth generates the rate-limit table schema via its Drizzle
                  schema generation; S6/S10 integrates this schema into the versioned
                  Drizzle migrations (per TD-018 — forward migration, reviewed, never
                  drizzle-kit push against Production).
                - No Redis, no Vercel KV, no Upstash Redis dependency.
                - No custom lib/server/auth/rate-limit.ts module (the previous draft's
                  in-memory module is REMOVED from the spec). Rate limiting is purely
                  configured via Better Auth, not custom code.
                - Login Server Action delegates to Better Auth's signIn, which
                  internally checks the rate limiter before verifying credentials.
                - Thresholds configurable via Better Auth config + env vars
                  (BETTER_AUTH_RATE_LIMIT_* — exact names defined by Better Auth config
                  at implementation time in S10).
ADR CANDIDATE:  NO (security detail, coupled to TD-003)
STATUS:         DECIDED
```

---

## 6. Components / Modules

The modular monolith is organized into clear internal modules. Each module has a single responsibility and a clear interface.

### 6.1 Module map

```
app/                          # Next.js App Router routes
  (public)/                   # Public route group (no auth)
    layout.tsx
    page.tsx                  # Root: PUBLISHED offers list (FR-040)
    offres/[id]/page.tsx      # Offer detail (FR-041, FR-042)
  admin/                      # Admin route group (auth required)
    layout.tsx                # Auth guard via middleware + layout check
    page.tsx                  # Redirect to /admin/offres
    login/page.tsx            # Login form (FR-001)
    offres/
      page.tsx                # Admin offer list (FR-010)
      nouvelles/page.tsx      # New offer form (FR-020)
      [id]/page.tsx           # Edit form (FR-021)
  sitemap.ts                  # Sitemap (TD-029)
  robots.ts                   # Robots (TD-029)

components/                   # React components
  ui/                         # shadcn/ui copies (TD-011)
  public/                     # Public-only components (OfferCard, OfferDetail)
  admin/                      # Admin-only components (OfferForm, OfferList, StatusBadge,
                              #   actions: PublishButton, SuspendButton, ArchiveButton)
  shared/                     # Shared (e.g., Logo, Footer)

lib/                          # Cross-cutting libraries
  server/                     # Server-only code (never imported by client components)
    auth/                     # Better Auth config + authorization layer
      auth.ts                 # Better Auth config (Drizzle adapter, username plugin, sign-up disabled, rate limiter config)
      authorization.ts        # can(), requireCapability(), getPrincipal() (library-independent)
    db.ts                     # Drizzle client (drizzle-orm/neon-http, read DATABASE_URL)
    validation/               # Zod schemas (offer schema, login schema, etc.)
    services/                 # Business logic services
      offers.ts               # Offer CRUD + lifecycle transitions
      users.ts                # ADMIN/Fantomas user queries
      search.ts               # Public search (TD-016)
    logger.ts                 # Structured logger (TD-026)
  client/                     # Client-only utilities (rare)
  shared/                     # Shared types (offer status, etc.)

db/                           # Database layer
  schema.ts                   # Drizzle schema (TD-004, Section 8)
  migrations/                 # Drizzle Kit migrations (TD-018)
  seed/                       # Bootstrap scripts (TD-020)
    bootstrap.ts              # Fantomas + initial ADMIN

tests/                        # Tests outside app/ (Vitest + Playwright)
  unit/                       # Unit tests (Vitest)
  component/                  # Component tests (RTL)
  integration/                # Integration tests (real Neon preview branch)
  e2e/                        # Playwright E2E specs

messages/                     # French strings (V1: simple object, not i18n framework)
  fr.ts                      # UI strings
```

### 6.2 Module responsibilities and dependencies

| Module | Owns | Depends on | Must not own |
|---|---|---|---|
| `app/(public)` | Public routes, server-rendered | lib/server/services, components/public | DB schema, business rules |
| `app/admin` | Admin routes, auth guard | lib/server/auth, lib/server/services, components/admin | DB schema, direct DB queries |
| `lib/server/auth` | Better Auth config + authorization layer (can/requireCapability independent of auth library) | db/schema (user, session, account, verification via Better Auth adapter) | Business logic |
| `lib/server/db` | Drizzle client, connection | DATABASE_URL env var | Business logic |
| `lib/server/validation` | Zod schemas | (none) | DB access |
| `lib/server/services/offers` | Offer CRUD, lifecycle transitions, public queries, search | lib/server/db, lib/server/validation, db/schema | Auth, UI |
| `lib/server/services/users` | User queries (login, role) | lib/server/db, db/schema | Offer logic |
| `db/schema` | Drizzle schema definitions | drizzle-orm | Migrations |
| `db/migrations` | SQL migration files | (generated by drizzle-kit) | Schema definitions |
| `db/bootstrap` | Idempotent bootstrap of Fantomas + initial ADMIN (separate from demo seed) | db/schema, lib/server/auth (Better Auth createUser), env var | Routes, UI |
| `components/ui` | shadcn/ui copies | tailwind, lucide-react | Business logic |
| `components/public` | OfferCard, OfferDetail | components/ui, lib/server/services (read-only) | Mutations |
| `components/admin` | OfferForm, OfferList, action buttons, StatusBadge | components/ui, lib/server/validation, React Hook Form | DB direct access |

### 6.3 Dependency direction rule

```
app/ → lib/server/services → lib/server/db → db/schema
        ↓
        lib/server/validation (Zod)
        ↓
        lib/server/auth (when needed)
```

Client components (`components/*`) may only import from `components/ui`, `lib/client`, `lib/shared`, and invoke Server Actions. Client components must NEVER import from `lib/server/*` (Next.js enforces this via "server-only" package import).

---

## 7. Technology Stack

### 7.1 Stack summary

| Layer | Choice | Decision ID | Status |
|---|---|---|---|
| Runtime | Node.js (Vercel serverless) | MANDATED (Vercel) | MANDATED |
| Language | TypeScript (strict) | Charter §10 | MANDATED |
| Framework | Next.js (App Router) | Charter §10 | MANDATED |
| Database | PostgreSQL on Neon | Charter §10 | MANDATED |
| Neon driver | drizzle-orm/neon-http (HTTP-based, no interactive transactions; underlying: @neondatabase/serverless) | TD-030 (finalized) | DECIDED |
| ORM / Query | Drizzle ORM + Drizzle Kit | TD-004 | DECIDED |
| Validation | Zod | TD-008 | DECIDED |
| Auth | Better Auth (Drizzle adapter, Username plugin + Admin plugin + emailAndPassword { disableSignUp: true }, database sessions, rate limiter with database storage; principalType field for business authorization) | TD-003 (finalized) | DECIDED |
| Password hashing | Better Auth default (scrypt, Node.js built-in) | TD-009 (revised) | DECIDED |
| Rate limiting | Better Auth integrated rate limiter + database storage on Neon (NOT in-memory, NOT Redis) | TD-031 (finalized) | DECIDED |
| Authorization abstraction | can() / requireCapability() (independent of auth library) | TD-003 + Section 13 | DECIDED |
| Forms | React Hook Form + zodResolver | TD-007 | DECIDED |
| Data fetching | Server Components (read) + Server Actions (mutate) | TD-006 | DECIDED |
| Styling | Tailwind CSS | TD-010 | DECIDED |
| UI components | shadcn/ui (copy-paste, Radix-based) | TD-011 | DECIDED |
| Icons | Lucide React | TD-012 | DECIDED |
| Rich text | Tiptap (JSON storage in jsonb, React server-side render) | TD-013 (revised) | DECIDED |
| Search | PostgreSQL ILIKE, Server Component + searchParams (no public API) | TD-016 (revised) | DECIDED |
| IDs | UUID v4 (PostgreSQL native) | TD-015 | DECIDED |
| Migrations | Drizzle Kit (forward corrective preferred; no push against Production) | TD-018 (revised) | DECIDED |
| Bootstrap | Idempotent script via Better Auth createUser + env vars (separate from seed) | TD-020 (revised) | DECIDED |
| Testing | Vitest + React Testing Library + Playwright | TD-024 | DECIDED |
| Lint/format | ESLint + Prettier + tsc strict | TD-027 | DECIDED |
| Package manager | pnpm | TD-017 | DECIDED |
| CI | GitHub Actions | TD-025 | DECIDED |
| Hosting | Vercel (Production + Preview) | TD-019 | DECIDED |
| Observability | Structured logs + Vercel logs (no Sentry in V1) | TD-026 | DECIDED |
| SEO | Next.js metadata + sitemap.ts + robots.ts | TD-029 | DECIDED |

### 7.2 NOT used (with rationale)

| Tech | Why not |
|---|---|
| Prisma | TD-004 — Drizzle simpler, SQL-first, no query engine binary |
| Auth.js v5 | TD-003 (revised) — Better Auth better aligned with Drizzle-first + Next.js App Router; Credentials provider is discouraged in Auth.js docs for database-backed auth |
| bcrypt / bcryptjs | TD-009 (revised) — Better Auth handles password hashing internally (scrypt by default); no separate password-hashing dependency needed |
| TanStack Query | TD-006 — Server Components + Server Actions cover V1 needs |
| TanStack Table | Not needed — admin list is simple (filter + pagination); a raw HTML table with sorting on URL params suffices for V1. Can be added in V2 if column sorting/pinning becomes valuable. |
| GraphQL | Excluded per OWNER S6 anti-overengineering |
| Separate NestJS backend | Excluded per OWNER S6 §2 |
| Redis / cache layer | No approved performance requirement justifying it (S6 §6) |
| Elasticsearch | Excluded per OWNER S6 §9 |
| Microservices / K8s | Excluded per OWNER S6 anti-overengineering |
| Sentry | Deferred (TD-026) — V1 uses Vercel logs |
| Custom auth | TD-003 — Better Auth covers all needs without fragile custom code |
| Material UI / Chakra | TD-011 — shadcn/ui is simpler and aligned with Tailwind |
| i18n framework | NFR-040 — V1 is French only; a simple messages object suffices |
| Stripe / payment lib | Excluded per Charter §8 |
| Email service (Resend, etc.) | Excluded — V1 has no notifications (OOS-013) |
| pg_trgm extension (in V1 initial) | TD-016 (revised) — optional performance optimization; deferred to a future migration only if profiling proves the need |
| In-memory rate limiting | TD-031 (finalized) — NOT serverless-compatible (per-instance counter does not persist across Vercel function instances); replaced by Better Auth integrated rate limiter with database storage on Neon |
| Custom rate limiter module | TD-031 (finalized) — reinvents Better Auth; no custom lib/server/auth/rate-limit.ts in V1 |
| Vercel KV / Upstash Redis | TD-031 (finalized) — paid add-ons; database storage on Neon is sufficient for V1 |
| `pg` / `postgres-js` (TCP drivers) | TD-030 (finalized) — V1 has no long interactive transactions; drizzle-orm/neon-http is sufficient and serverless-optimized |
| drizzle-orm/neon-serverless (WebSocket) | TD-030 (finalized) — supports interactive transactions via persistent WebSocket, but V1 has no interactive transactions; adds WebSocket lifecycle complexity for no benefit |

---

## 8. Data Architecture

### 8.1 Persistence model and system of record

- **System of record**: PostgreSQL on Neon (TD-002). All offer data, user data, and session data live in this single database.
- **No secondary data stores**: no Redis, no search index, no file storage (V1 has no file upload).
- **Single schema**: one PostgreSQL schema per Neon branch (production main branch + ephemeral preview branches).

### 8.2 Data ownership and transaction boundaries

- All offer mutations occur within a single PostgreSQL transaction in the corresponding Server Action. No distributed transactions (S6 §16 — no evidence for them).
- Admin actions (create, edit, publish, suspend, archive) are atomic per action. Each action validates, mutates, and commits in one transaction.
- No multi-entity business transactions in V1 (offers and users are independent entities).

### 8.3 Consistency expectations

- **Strong consistency** for all offer data (PostgreSQL default). After a publish action commits, the public list reflects it immediately (Next.js revalidatePath).
- **No eventual consistency** — no async replicas, no cache layer that could lag.
- **Optimistic concurrency not needed in V1**: only ADMIN mutates offers, and V1 has a small admin team (single-digit). Concurrent edits to the same offer are an edge case; if it occurs, last-write-wins is acceptable (the updated_at reflects the latest). A future version can add optimistic locking (e.g., a version column) if needed.

### 8.4 History and audit requirements

- Per NFR-050: minimal audit data per offer — created_at, updated_at, published_at.
- **No full audit log in V1** (deferred — DR-030/040). If a future version requires who-did-what tracking, an audit_log table will be added (with user_id, action, offer_id, timestamp, before/after JSONB).
- **No soft-delete**: archived offers are retained (FR-034); physical deletion is OUT OF SCOPE (OOS-019).

### 8.5 Retention and deletion policies

- **Archived offers**: retained indefinitely (FR-034). No automatic deletion.
- **Physical deletion**: OUT OF SCOPE V1 (OOS-019).
- **Sessions**: Better Auth database session strategy — sessions have an expiry. Expired sessions are pruned by Better Auth on access (no scheduled job — S0 §23). For V1 scale (single-digit admins), this is sufficient.
- **Users (ADMIN, Fantomas)**: never deleted in V1. Fantomas cannot be deleted (Charter §7).

### 8.6 Concurrency and conflict handling

- **Single-writer assumption**: V1 has a small admin team. Concurrent edits to the same offer are rare; last-write-wins via `updated_at = now()` is acceptable.
- **No optimistic locking in V1**: avoids complexity. If conflict becomes an issue in V2, add a `version` integer column with conditional update (`WHERE version = ?`).

### 8.7 Backup / recovery

- **Neon point-in-time restore**: Neon provides PITR for the production main branch (7-day window on free tier, longer on paid). This is the primary backup mechanism for V1.
- **No custom backup scripts** in V1 (no scheduled work — S0 §23).
- **No RPO/RTO numbers** in V1 (Charter does not specify; S6 §24 forbids inventing numbers).
- **Recovery procedure**: documented in `docs/architecture/` (deployment runbook — to be written in S12/S14, not in S6).

---

## 9. Physical Data Design

This section defines the PostgreSQL physical schema. Drizzle schema-as-code in `db/schema.ts` will reflect this. Migrations are versioned via Drizzle Kit (TD-018). S6 does NOT create migration files.

### 9.1 Enums

```sql
-- Offer status enum
CREATE TYPE offer_status AS ENUM ('DRAFT', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED');
```

Drizzle equivalent: `pgEnum('offer_status', ['DRAFT', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'])`.

### 9.2 Extensions

```sql
-- For UUID generation (PostgreSQL >= 13 has gen_random_uuid() built-in; no extension needed)
-- pg_trgm: NOT installed in V1 initial. Per TD-016 (revised), pg_trgm is an optional
-- performance optimization, added only if production profiling proves ILIKE needs it.
-- Default V1: no extension beyond built-in.
```

No extensions are installed in V1 initial. pg_trgm may be added via a future forward migration only if profiling proves the need (per TD-016 revised and TD-018 forward-migration doctrine).

### 9.3 Tables

#### 9.3.1 `offers` table (central entity)

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key (TD-015) |
| title | text | NOT NULL | — | Required (BR-030) |
| description | jsonb | NOT NULL | — | Tiptap JSON (TD-013); NOT raw HTML |
| status | offer_status | NOT NULL | 'DRAFT' | Enum (Section 9.1) |
| company | text | NULL | — | Optional (TD-021) |
| sector | text | NULL | — | Optional |
| category | text | NULL | — | Optional |
| contract_type | text | NULL | — | Optional |
| education_level | text | NULL | — | Optional |
| experience | text | NULL | — | Optional |
| location | text | NULL | — | Optional |
| source_publication_date | date | NULL | — | Optional (BR-060) |
| application_deadline | date | NULL | — | Optional (BR-060) |
| source_name | text | NULL | — | Optional (BR-050) |
| source_url | text | NULL | — | Optional, validated (BR-080) |
| application_modalities | text | NULL | — | Optional free text |
| application_email | text | NULL | — | Optional, validated email (BR-080) |
| application_url | text | NULL | — | Optional, validated URL (BR-080) |
| published_at | timestamptz | NULL | — | Set on first publication (BR-022); preserved on republication |
| created_at | timestamptz | NOT NULL | now() | System (BR-060) |
| updated_at | timestamptz | NOT NULL | now() | System; updated on every save |

**Constraints:**
- `PRIMARY KEY (id)`
- `CHECK (title <> '')` — non-empty after trim is enforced at app layer too (Zod)
- `CHECK (description IS NOT NULL)` — required (jsonb can be empty `{}` or `{"type": "doc", "content": []}` but not NULL)
- `CHECK (status IN ('DRAFT', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'))` — enforced by enum type

**Indexes:**
- `CREATE INDEX idx_offers_status ON offers(status)` — for admin list filtered by status (FR-012) and public list filter `WHERE status = 'PUBLISHED'` (FR-040).
- `CREATE INDEX idx_offers_published_at_desc ON offers(published_at DESC) WHERE status = 'PUBLISHED'` — partial index for public list ordering (BR-070). Only PUBLISHED offers are listed publicly; the partial index is smaller and faster.
- `CREATE INDEX idx_offers_created_at_desc ON offers(created_at DESC)` — for deterministic tie-breaker (BR-071) and admin list default order.
- Optional (only if perf requires): `CREATE INDEX idx_offers_search_trgm ON offers USING gin (title gin_trgm_ops, company gin_trgm_ops, location gin_trgm_ops)` — for public/admin ILIKE search (TD-016). Default V1: NOT created (deferred to S10/S11 if observed need).

**Uniques:**
- `PRIMARY KEY (id)` is the only unique constraint. No business uniqueness on (title, company, dates) — duplicates allowed (Charter §7).

#### 9.3.2 Auth tables — managed by Better Auth Drizzle adapter (per OWNER §13)

Per OWNER revision §13: Better Auth is RETAINED (TD-003 revised) and manages its own auth schema via its Drizzle adapter. S6 does NOT redefine Better Auth's internal tables; S6 documents the EXPECTED functional shape and the V1 extension (the `role` column on `user`).

Better Auth's Drizzle adapter generates the following tables (the exact column types and names follow Better Auth's conventions; S6 does not modify them):

**`user` table** (Better Auth standard + V1 extension):

| Column | Type | Source | Notes |
|---|---|---|---|
| id | text (Better Auth default) | Better Auth | Primary key |
| email | text | Better Auth | Optional in V1 (Fantomas logs in by username; ADMIN logs in by username) |
| emailVerified | boolean | Better Auth | Default false |
| name | text | Better Auth | Optional display name |
| username | text | Better Auth (username plugin) | **V1 login identifier** — unique. ADMIN and Fantomas log in by username. |
| image | text | Better Auth | Optional; NULL in V1 (no avatars) |
| createdAt | timestamptz | Better Auth | |
| updatedAt | timestamptz | Better Auth | |
| **principalType** | principal_type (enum: 'ADMIN' \| 'FANTOMAS') | **V1 business principal field** | THE JOURDAIN EMPLOI business principal identifier. Source of truth for `can()` / `requireCapability()` (Section 13). Independent of Better Auth's internal permissions. Default 'ADMIN'. Fantomas gets 'FANTOMAS'. |
| **role** | text (or Better Auth Admin plugin enum) | **Better Auth Admin plugin internal** | Reserved for Better Auth Admin plugin mechanics. JOURDAIN EMPLOI business authorization does NOT read this field. May be NULL or set by the Admin plugin internally. |

The `principalType` column is the V1 BUSINESS PRINCIPAL extension to Better Auth's standard user table. The `role` column is reserved for Better Auth Admin plugin internals and is NOT used for JOURDAIN EMPLOI business authorization. Both are added via Better Auth's configuration (not via a custom column bypass), so Better Auth is aware of them and can include them in session data.

**`session` table** (Better Auth standard):

| Column | Type | Source | Notes |
|---|---|---|---|
| id | text | Better Auth | Primary key |
| expiresAt | timestamptz | Better Auth | Session expiry |
| token | text | Better Auth | Unique session token (set in httpOnly cookie) |
| userId | text | Better Auth | Foreign key to user(id) ON DELETE CASCADE |
| createdAt | timestamptz | Better Auth | |
| updatedAt | timestamptz | Better Auth | |

**`account` table** (Better Auth standard — used for OAuth providers, empty in V1 but schema present):

| Column | Type | Source | Notes |
|---|---|---|---|
| id | text | Better Auth | Primary key |
| userId | text | Better Auth | Foreign key to user(id) |
| providerId | text | Better Auth | "credential" for username/password |
| accountId | text | Better Auth | |
| ... | ... | Better Auth | (other Better Auth standard columns) |

**`verification` table** (Better Auth standard — used for email verification tokens, empty in V1 but schema present):

| Column | Type | Source | Notes |
|---|---|---|---|
| id | text | Better Auth | Primary key |
| identifier | text | Better Auth | |
| value | text | Better Auth | Hashed token |
| expiresAt | timestamptz | Better Auth | |
| ... | ... | Better Auth | (other Better Auth standard columns) |

**V1 does NOT redefine these tables.** Better Auth's Drizzle adapter generates them via `drizzle-kit generate` based on the Better Auth config. The migration files are versioned (TD-018). The V1 customizations are the `principalType` column (business principal) and the `role` column (Admin plugin internal) on `user`, both added via Better Auth's config so the adapter includes them in the schema generation. Additionally, Better Auth's rate limiter with database storage (TD-031 finalized) generates a rate-limit table (e.g., `rate_limit` or similar — the exact name follows Better Auth's conventions) via the same Drizzle schema generation. This rate-limit table is part of the auth schema and is integrated into the versioned migrations like the other auth tables.

```sql
CREATE TYPE principal_type AS ENUM ('ADMIN', 'FANTOMAS');
-- The principal_type enum is the V1-specific schema addition for business
-- authorization. It is added by the Drizzle schema definition referenced by the
-- Better Auth config; Better Auth's adapter then generates the user table with
-- the principalType column.
-- The `role` column (Better Auth Admin plugin internal) is a separate field,
-- NOT governed by this enum and NOT used by can()/requireCapability().
```

**Constraints:**
- `UNIQUE (user.username)` — username is unique (V1 login identifier per FR-001).
- `CHECK (principalType IN ('ADMIN', 'FANTOMAS'))` — enforced by the principal_type enum.
- Better Auth's standard constraints on session, account, verification (foreign keys, uniqueness) are applied by the adapter.

**Indexes:**
- `UNIQUE INDEX idx_user_username ON user(username)` — for login lookup (FR-001).
- Better Auth's standard indexes on session.token, account.(userId, providerId), etc. — applied by the adapter.

### 9.4 No additional tables

S6 explicitly does NOT create:
- A `companies` table — TD-021 (free text column)
- A `sectors` table — TD-021
- A `categories` table — TD-021
- An `audit_log` table — DR-030/040 (deferred)
- A `password_resets` table — DR-050 (deferred)
- A `slugs` or `redirects` table — TD-014 (URL uses id only)
- A `tags` table — not in S5
- A `applications` table — excluded per Charter §8 (no internal application workflow)

---

## 10. Interfaces / APIs

V1 has NO public product API (INT-001, OOS-015). Internal Next.js interfaces are not "APIs" in the product sense.

### 10.1 Internal Server Actions (admin mutations)

Server Actions are Next.js App Router native — they are TypeScript functions invoked from client components via form actions or `useTransition`. They are NOT HTTP endpoints in the REST sense; Next.js handles the wire format.

| Server Action | Route / location | Input | Output | Auth |
|---|---|---|---|---|
| `loginAction` | app/admin/login/page.tsx | `{ login, password }` | `{ ok: boolean, error?: string }` | None (public) |
| `logoutAction` | app/admin/layout.tsx | — | `{ ok: boolean }` | ADMIN or FANTOMAS |
| `createOfferAction` | app/admin/offres/nouvelles/page.tsx | `OfferInput` (Zod-validated) | `{ ok: boolean, id?: uuid, error?: string }` | ADMIN or FANTOMAS |
| `updateOfferAction` | app/admin/offres/[id]/page.tsx | `{ id, ...OfferInput }` | `{ ok: boolean, error?: string }` | ADMIN or FANTOMAS |
| `publishOfferAction` | components/admin/PublishButton.tsx | `{ id }` | `{ ok: boolean, error?: string }` | ADMIN or FANTOMAS |
| `suspendOfferAction` | components/admin/SuspendButton.tsx | `{ id }` | `{ ok: boolean, error?: string }` | ADMIN or FANTOMAS |
| `republishOfferAction` | components/admin/RepublishButton.tsx | `{ id }` | `{ ok: boolean, error?: string }` | ADMIN or FANTOMAS |
| `archiveOfferAction` | components/admin/ArchiveButton.tsx | `{ id }` | `{ ok: boolean, error?: string }` | ADMIN or FANTOMAS |

Each Server Action:
1. Calls `requireAdmin()` from `lib/server/auth.ts` (except `loginAction`).
2. Validates input via Zod schema from `lib/server/validation/`.
3. Calls the corresponding service in `lib/server/services/`.
4. Returns a structured result. On error, returns `{ ok: false, error: '...' }` without throwing (Server Actions that throw leak stack traces; we return error objects).
5. Calls `revalidatePath` to refresh the relevant page cache.

### 10.2 Internal route handlers (if any)

V1 may use one route handler for dynamic public search (if FR-050 is implemented as a Client Component with debounced search). Default implementation: search is server-side via URL search params (`/offres?q=...`); no separate route handler needed.

If a route handler is added later, it would be `app/api/search/route.ts` returning JSON `{ offers: OfferCard[] }` — but this is NOT a public product API, just an internal Next.js endpoint. Marked DEFERRED (DR-110).

### 10.3 No external API contracts

V1 has no external API to define. No webhook, no OAuth callback, no third-party integration.

---

## 11. External Integrations

V1 has NO external integrations (INT-001). The only external dependencies are infrastructure:
- Vercel (hosting)
- Neon (database)
- GitHub (source repository — already canonical, no integration code in the app)

S6 defines no external integration contracts because there are none.

---

## 12. Authentication

### 12.1 Identity source

Local database (`user` table managed by Better Auth Drizzle adapter, Section 9.3.2). No external identity provider in V1. No OAuth in V1 (FR-004 — no public registration; ADMIN and Fantomas are bootstrapped, not self-registered).

### 12.2 Credential and session model

- **Auth library**: Better Auth (TD-003 finalized), with Drizzle adapter, Username plugin + Admin plugin + emailAndPassword, database sessions, public sign-up disabled via `disableSignUp: true`, rate limiter with database storage.
- **Daily login identifier**: username (NOT email). The login form asks for username + password. Fantomas logs in with username "Fantomas". ADMIN logs in with their assigned username. The email field exists in the user table (Better Auth requires it internally) but is NOT used as the daily login identifier; for system principals it is a synthetic value (e.g., "fantomas@jourdain.local").
- **Username uniqueness**: enforced by the Username plugin (unique constraint on the `username` column).
- **Username immutability for system principals**: usernames created by the bootstrap script are immutable in V1 (no "change username" feature in V1; the admin UI does not expose username editing). A V2 admin UI may add username editing with Fantomas authorization (DR-050).
- **Business principal field**: `principalType` (enum: 'ADMIN' | 'FANTOMAS') — the JOURDAIN EMPLOI business principal identifier. Source of truth for `can()` / `requireCapability()` (Section 13). INDEPENDENT of Better Auth's internal `role` field (which is reserved for the Admin plugin).
- **Credentials**: username + password. The password is hashed by Better Auth using scrypt (Node.js built-in crypto.scrypt) — per TD-009 revised. The hash is stored in the `account` table (Better Auth's standard credential-account record), NOT in a custom column, NOT manually written by the bootstrap script.
- **Session strategy**: database (Better Auth persists sessions in the `session` table via its Drizzle adapter). Sessions are NOT JWT-based in V1 — database sessions are preferred for stateful admin back-office (immediate invalidation on logout, auditable).
- **Session cookie**: Better Auth's session cookie (`better-auth.session_token` or similar — the exact name is set by Better Auth config), httpOnly, secure (production), SameSite=Lax.
- **Session lifetime**: 7 days (Better Auth default; can be tuned via Better Auth config).
- **Session expiry pruning**: lazy — Better Auth checks the `expiresAt` column on access and deletes expired sessions. No cron job (S0 §23).
- **Sign-up disabled**: Better Auth config uses the documented syntax `emailAndPassword: { enabled: true, disableSignUp: true }`. No public registration. Users are created ONLY via the bootstrap script (TD-020) calling `auth.api.createUser()` (authorized by the explicitly configured Admin plugin).
- **No public "username availability" endpoint**: no information leak about existing usernames. Brute-force protection is handled by the rate limiter, not by revealing existing usernames.

### 12.3 Login flow (FR-001)

```
Client → POST (form action) → Server Action `loginAction`
  → Zod validates input ({ username, password })
  → Server Action calls Better Auth's signIn server-side:
      auth.api.signInUsername({ body: { username, password } })
      (Username plugin endpoint; the emailAndPassword endpoint is NOT used for daily login)
  → Better Auth:
    → Checks the rate limiter (database storage on Neon — TD-031 finalized) BEFORE
      verifying credentials. If the IP/username has exceeded the threshold,
      returns a generic "too many attempts" error (no information leak about
      whether the username/password was valid — FR-001-ERR shape).
    → Queries user by username
    → If user found: verifies password via scrypt
      → If match: creates a session record in the `session` table, sets the
        httpOnly cookie in the response, returns success
      → If no match: returns failure (FR-001-ERR: do not disclose which field
        is wrong — Better Auth returns the same error shape for "user not
        found" and "wrong password")
    → If user not found: returns the same failure (no information leak)
  → Server Action returns { ok: true } or { ok: false, error: 'Identifiants invalides' }
  → On success: redirect to /admin/offres
  → On failure: re-render login page with error
```

### 12.4 Logout flow (FR-002)

```
Client → POST (form action) → Server Action `logoutAction`
  → Server Action calls Better Auth's signOut server-side:
      auth.api.signOut({ headers })
  → Better Auth: deletes the session record in the `session` table, clears the cookie
  → Redirect to /admin/login
```

### 12.5 Bootstrap of initial users (TD-020 revised)

```
After first production deploy:
  OWNER/operator runs `pnpm db:bootstrap` (NOT `pnpm db:seed` — see TD-020 revised
  for the seed-vs-bootstrap distinction)
    → db/bootstrap/bootstrap.ts:
      → Reads FANTOMAS_INITIAL_PASSWORD env var
      → If no user with username='Fantomas':
        → Calls Better Auth's SUPPORTED server-side user creation API
          (authorized by the explicitly configured Admin plugin):
            auth.api.createUser({ body: {
              username: 'Fantomas',
              password: FANTOMAS_INITIAL_PASSWORD,
              email: 'fantomas@jourdain.local',  // synthetic; not used for daily login
              principalType: 'FANTOMAS',  // V1 business principal field
              // ...other Better Auth required fields
            } })
        → Better Auth handles: password hashing (scrypt — TD-009), user record
          creation in the `user` table (including the principalType field),
          credential-account record creation in the `account` table
          (providerId='credential'). The bootstrap script does NOT manually
          INSERT password hashes, does NOT bypass Better Auth, does NOT write
          to the DB directly.
        → Log "Fantomas principal created (principalType=FANTOMAS)"
      → Else: log "Fantomas already exists — not recreated (no overwrite)"
      → For each admin in db/bootstrap/config.ts (username + env-var name for password):
        → If no user with that username:
          → Calls auth.api.createUser with the admin's username + env-var password
            + synthetic email + principalType='ADMIN'
      → Log summary
```

The bootstrap script is idempotent. Re-running it does NOT overwrite existing users (so password rotations are preserved — the script checks existence via `auth.api.listUsers({ query: { username } })` or a read-only query before calling createUser). It does NOT log passwords. It does NOT hash passwords itself — Better Auth's `auth.api.createUser()` does that internally. It does NOT manually INSERT password hashes into the DB — Better Auth handles all DB writes via its Drizzle adapter.

### 12.6 Separation of concerns (OWNER §2 and §3)

- **Better Auth authenticates**: verifies credentials, creates and manages sessions, handles password hashing, rate-limits auth endpoints, creates users server-side via `auth.api.createUser()`. S6 does NOT implement these.
- **Our `can()` / `requireCapability()` layer authorizes**: checks capabilities per AISE §21. S6 implements this (Section 13). The authorization layer is INDEPENDENT of the auth library — it only reads the `role` field from the session's user. If Better Auth were replaced by another library tomorrow, the authorization layer would still work as long as the new auth library populates the `role` field in the session.
- **Better Auth Admin plugin (if ever used)**: NOT used as a business authorization system. It would be a bootstrap/administration convenience at most. Our `can()` / `requireCapability()` remains the AUTHORITY for JOURDAIN EMPLOI business capabilities.

### 12.7 Password reset

OUT OF SCOPE V1 (DR-050). For V1, password reset for an ADMIN is done by Fantomas directly (via a V2 admin UI break-glass action, deferred) or by re-running the bootstrap script for that user after deleting the user (the script does not overwrite existing users). This is acceptable for V1's small admin team. A self-service reset flow is deferred to V2.

---

## 13. Authorization

### 13.1 Principal model

| Principal | principalType value | Capabilities |
|---|---|---|
| ADMIN | `'ADMIN'` | All offer lifecycle operations (PERM-002); no Fantomas-specific capabilities |
| FANTOMAS | `'FANTOMAS'` | All ADMIN capabilities + Fantomas-specific bootstrap / recovery / break-glass (AISE §14, §21) |

### 13.2 Authorization abstraction (revised per OWNER §2, §3)

The authorization layer is INDEPENDENT of the auth library (OWNER §2). Better Auth authenticates and provides the session; our `can()` / `requireCapability()` layer authorizes. The layer reads only the `principalType` field from the session (NOT Better Auth's internal `role` field) — it does not import Better Auth types or call Better Auth functions for capability checks.

S6 defines a single reusable helper module in `lib/server/auth/authorization.ts`:

```typescript
// Conceptual signature (not implementation code in S6):
type Principal = {
  id: string;
  username: string;
  principalType: 'ADMIN' | 'FANTOMAS';
};

type Capability =
  | 'offer:create' | 'offer:edit' | 'offer:save'
  | 'offer:publish' | 'offer:suspend' | 'offer:republish' | 'offer:archive'
  | 'admin:login'  // access back-office
  | 'system:bootstrap'  // Fantomas-only
  | 'system:recovery'; // Fantomas-only

// Returns the current principal or null if unauthenticated.
// Internally calls Better Auth's getSession() and maps the result to our
// Principal type (reading the principalType field, NOT Better Auth's role).
// The mapping is the ONLY place where Better Auth is imported in the
// authorization layer.
async function getPrincipal(): Promise<Principal | null>;

// Returns the principal if authenticated AND having the given capability.
// Throws an authorization error (or returns a redirect) if not.
async function requireCapability(capability: Capability): Promise<Principal>;

// Returns true if the principal has a given capability. Pure function.
// Reads principalType (NOT role).
function can(principal: Principal, capability: Capability): boolean;
```

The `requireCapability()` function (renamed from `requireAdmin()` per OWNER §3 — avoid role-name-coupled API) is the canonical entry point for Server Actions. Each Server Action calls `requireCapability('offer:create')` (or the relevant capability) at the top. This avoids duplicating `if role === ...` checks across the codebase — there is exactly one place (the `can()` function) that decides which role has which capability.

### 13.3 Capability matrix (per AISE §21)

| Capability | ADMIN | FANTOMAS |
|---|---|---|
| offer:create | YES | YES |
| offer:edit | YES | YES |
| offer:save | YES | YES |
| offer:publish | YES | YES |
| offer:suspend | YES | YES |
| offer:republish | YES | YES |
| offer:archive | YES | YES |
| admin:login | YES | YES |
| system:bootstrap | NO | YES |
| system:recovery | NO | YES |

Implementation (conceptual):

```typescript
const ADMIN_CAPABILITIES: Capability[] = [
  'offer:create', 'offer:edit', 'offer:save',
  'offer:publish', 'offer:suspend', 'offer:republish', 'offer:archive',
  'admin:login',
];

const FANTOMAS_EXTRA_CAPABILITIES: Capability[] = [
  'system:bootstrap', 'system:recovery',
];

function can(principal: Principal, capability: Capability): boolean {
  if (principal.principalType === 'FANTOMAS') {
    return [...ADMIN_CAPABILITIES, ...FANTOMAS_EXTRA_CAPABILITIES].includes(capability);
  }
  return ADMIN_CAPABILITIES.includes(capability);
}
```

This satisfies AISE §21 exactly:
- Every ADMIN capability is also authorized to Fantomas (Fantomas inherits ADMIN_CAPABILITIES).
- Fantomas has additional capabilities (FANTOMAS_EXTRA_CAPABILITIES).
- ADMIN does NOT inherit Fantomas-only capabilities (the `if principalType === 'FANTOMAS'` branch is the only path to FANTOMAS_EXTRA_CAPABILITIES).

**Future SUPER_ADMIN (DR-051)**: if a future version adds a formal SUPER_ADMIN role, the matrix extends: SUPER_ADMIN_CAPABILITIES = ADMIN_CAPABILITIES (or a superset); FANTOMAS inherits SUPER_ADMIN_CAPABILITIES + FANTOMAS_EXTRA_CAPABILITIES. This does NOT require creating SUPER_ADMIN in V1 — V1 has only ADMIN and FANTOMAS. The `can()` abstraction makes the future extension a localized change.

### 13.4 Server-side enforcement points

- **Middleware** (`middleware.ts`): protects `/admin/*` routes. Calls Better Auth's session check; if no valid session → redirect to `/admin/login`. This is the first line of defense (authentication only — no capability check here, since middleware runs on every request and capability checks are per-action).
- **Layout guard** (`app/admin/layout.tsx`): double-checks session via `getPrincipal()`. If null → redirect (defense in depth).
- **Each Server Action**: calls `requireCapability(capability)` first, where `capability` is the action's required capability (e.g., `offer:create`, `offer:publish`). The `requireCapability` helper internally calls `getPrincipal()` (which calls Better Auth's `getSession()`) and `can()`. If either fails, the action returns an authorization error.
- For Fantomas-only actions (none in V1's normal UI; the bootstrap script uses `system:bootstrap`), the action calls `requireCapability('system:bootstrap')`.
- **No client-side authorization**: client components render based on session info passed from the server, but all mutations are validated server-side. The client UI hides admin controls from public visitors, but the server is the authority (NFR-012, standard security practice).

### 13.5 No client trust

Per NFR-012 and standard security practice, client components NEVER make authorization decisions. The server is the authority. Even if a malicious user crafts a request to a Server Action without proper auth, the `requireAdmin()` call rejects it before any DB mutation.

### 13.6 Fantomas in the daily interface

Fantomas is NOT exposed as a role in the admin UI's role picker (there is no role picker in V1 — single ADMIN role). The admin UI shows the current principal's login and a logout button. If the principal is Fantomas, the UI shows "Fantomas (system principal)" as a label but no additional controls in V1 (Fantomas-specific bootstrap/recovery actions are not surfaced in V1's daily UI; they would be added in a V2 break-glass interface, currently OUT OF SCOPE).

---

## 14. Security / Privacy

### 14.1 Trust boundaries (recap from Section 3.3)

| Boundary | Mechanism |
|---|---|
| Public → Admin | Better Auth middleware + layout guard |
| Public → non-PUBLISHED offer data | Server-side filter `WHERE status = 'PUBLISHED'` + 404 on non-PUBLISHED detail |
| Admin mutations | Server Actions with `requireCapability()` + Zod validation (Section 13) |
| Form input → DB | Zod server-side (TD-008); client validation is UX-only |
| Rich content (description) | Tiptap JSON stored (no raw HTML in DB); rendered via Tiptap React server-side renderer (no HTML string roundtrip, no dangerouslySetInnerHTML with user content — TD-013 revised) |
| Secrets → Code | S0 §13: no secrets in repo; S0 §25: secrets via Vercel env vars |
| Preview → Production DB | TD-019: distinct DATABASE_URL per Vercel environment |

### 14.2 Authentication and authorization

- Covered in Sections 12 and 13.
- Password storage: scrypt via Better Auth default (TD-009 revised), never plaintext (NFR-010).
- Session: Better Auth database session; cookie httpOnly, secure (production), SameSite=Lax (TD-028, TD-003 revised).

### 14.3 Input validation and output encoding

- **Input validation**: Zod at every Server Action boundary (TD-008). Client-side React Hook Form + zodResolver mirrors server validation for UX (FR-023-ERR, FR-024-ERR).
- **Output encoding**: React automatically escapes text content. The only non-text content is the rich description, which is rendered from Tiptap JSON via Tiptap's `generateHTML` (Tiptap only generates HTML for known node types; arbitrary HTML in the JSON is not rendered). No `dangerouslySetInnerHTML` with user content.
- **URL fields** (application_url, source_url): rendered as `<a href={url}>` — React escapes the href attribute. Server validates URL format (BR-080, FR-024). No javascript: URLs allowed (Zod URL schema with `url:` validation rejects non-http(s) schemes — to be enforced at the Zod level in S10).

### 14.4 Data protection at rest and in transit

- **At rest**: Neon encrypts storage (managed service standard). The app does not encrypt specific columns (no column-level encryption in V1 — no approved requirement for it).
- **In transit**: all Vercel → Neon connections use TLS (managed service). All client → Vercel connections use HTTPS (Vercel enforces).

### 14.5 Secret architecture

| Secret | Storage | Rotation |
|---|---|---|
| `DATABASE_URL` (Production) | Vercel env var (Production) | Neon password rotation; update Vercel env var |
| `DATABASE_URL` (Preview) | Vercel env var (Preview) | Same, per preview environment |
| `BETTER_AUTH_SECRET` | Vercel env var | Regenerate; update Vercel env var; rotate sessions (Better Auth invalidates old sessions on secret change) |
| `FANTOMAS_INITIAL_PASSWORD` | Vercel env var (Production only — set once at first deploy) | Once bootstrapped, the scrypt hash is in the DB (via Better Auth). Rotation = re-bootstrap (delete user, re-run bootstrap with new env var) OR a V2 admin UI break-glass action. The env var can be removed from Vercel after first bootstrap. |
| Initial ADMIN passwords | Same pattern — env vars at first deploy, scrypt hash stored via Better Auth, env var removed after bootstrap | Same |

Per S0 §13: NO secret is committed to the repository, written to logs, displayed in error messages, or stored in `.env.example` (only placeholder names like `FANTOMAS_INITIAL_PASSWORD=...`).

### 14.6 Sensitive data boundaries and masking

- **Password hashes**: stored in `users.password_hash`, never returned in queries that go to the client. Server-side services select only non-sensitive columns when returning user info.
- **Session tokens**: stored in `sessions.sessionToken`, never returned to the client (the cookie holds the token; the server compares).
- **Logs**: never log passwords, session tokens, or password hashes. The structured logger (TD-026) has a redaction layer for known sensitive keys.

### 14.7 Audit trail

- Minimal in V1 (NFR-050): `created_at`, `updated_at`, `published_at` per offer.
- No who-did-what audit log (DR-030/040 — deferred). Future version can add `audit_log` table.

### 14.8 Privacy / GDPR

- V1 stores: ADMIN login, ADMIN password hash, offer content (which may include contact info in application modalities — e.g., application_email).
- **No public user data**: V1 has no candidate accounts (OOS-004), no public registration.
- **Personal data in offers**: contact info entered by ADMIN in application_modalities / application_email / application_url. This is business data, not user data. The "data subject" is not a JOURDAIN EMPLOI user but a third-party (the recruiter or contact mentioned in the offer). GDPR obligations on this data are deferred to detailed GDPR constraints (Charter D1, DR-160, TD-018).
- **No cookies except the auth session cookie** (no analytics, no tracking). A cookie banner is therefore NOT required for V1 (the auth cookie is strictly necessary, exempt from consent under GDPR/ePrivacy).
- **Data subject rights**: not directly applicable in V1 (no candidate accounts). ADMIN can request their own data; Fantomas can manage ADMIN accounts.

### 14.9 Retention and deletion realization

- Archived offers retained indefinitely (FR-034, BR-024).
- No physical deletion in V1 (OOS-019).
- Sessions expire per Better Auth default; expired sessions are pruned lazily.

### 14.10 Rate limiting (revised per OWNER final patch §1)

- V1 has no public submission endpoint (no public form). Login is the only unauthenticated mutation.
- **Login rate limiting**: handled by Better Auth's integrated rate limiter with database storage on Neon (TD-031 finalized). NOT in-memory (in-memory is not serverless-compatible — see TD-031 rationale). NOT custom code. NOT Redis/Vercel KV/Upstash. The exact thresholds (max attempts per IP/username per window) are configurable via Better Auth config + env vars at implementation time (S10). The architecture is fixed in S6: Better Auth rate limiter + database storage + Neon.
- **No rate limiting on public reads** — public reads are server-rendered via Server Components; abuse is handled at the Vercel edge (DDoS protection built into Vercel).
- **No rate limiting on admin mutations** — admin mutations are already protected by authentication + `requireCapability()`.

### 14.11 No injection prevention

- **SQL injection**: prevented by Drizzle's parameterized queries. No string-concatenated SQL.
- **NoSQL injection**: N/A (no NoSQL).
- **XSS**: prevented by React's automatic escaping + Tiptap's structured JSON rendering (no `dangerouslySetInnerHTML` with user content).
- **CSRF**: prevented by Next.js Server Actions origin check + SameSite cookie (TD-028).
- **Command injection**: N/A (no shell commands executed from user input).

---

## 15. Reliability / Failure Model

V1 has no formal uptime SLO (Charter §13). The failure model is pragmatic.

### 15.1 Failure modes and responses

| Failure | Detection | Response |
|---|---|---|
| Database unreachable (Neon) | Drizzle query throws | Server Action returns `{ ok: false, error: 'Service indisponible' }`. UI shows a generic error message. Vercel logs the error. |
| Invalid input | Zod parse throws | Server Action returns field-level errors. UI shows them next to the corresponding fields (FR-023-ERR, FR-024-ERR). |
| Auth failure (invalid credentials) | Better Auth signIn returns failure (no distinction between "user not found" and "wrong password") | FR-001-ERR: generic "Identifiants invalides" (no leak of which field is wrong). |
| Auth failure (no session on admin route) | Middleware/layout guard | Redirect to /admin/login. |
| Offer not found (public detail) | Drizzle returns null | FR-042: 404 page (no distinction between "not found" and "not PUBLISHED"). |
| Offer not found (admin edit) | Drizzle returns null | 404 in admin (or redirect to admin list with a "not found" toast). |
| Concurrent edit (last-write-wins) | No detection in V1 | The latest save wins; updated_at reflects it. No user warning. |
| Vercel build failure | CI build job fails | PR is not merged. No production deploy. |
| Drizzle migration failure | drizzle-kit migrate exits non-zero | Production deploy is blocked (migrations run as a pre-deploy step or manually before deploy per TD-018). |
| Seed script failure | Script exits non-zero | Fantomas or ADMIN not created. Operator must investigate via logs. No automatic retry. |

### 15.2 Degraded mode

V1 has no degraded mode — if the database is down, the public list returns an error page and admin actions fail. This is acceptable for V1 (Charter §13 — no uptime SLO).

### 15.3 Restart and recovery

- Vercel serverless functions are stateless; restarts are transparent. Better Auth sessions are in the DB, so they survive restarts.
- Neon PITR is the primary data recovery mechanism (Section 8.7).
- Application code is stateless; no in-memory state to recover.

### 15.4 Idempotency

- **Server Actions**: each action is idempotent for the same input state. E.g., publishing an already-PUBLISHED offer is a no-op (or returns "already published"). Archiving an already-archived offer is a no-op. This prevents accidental double-transitions.
- **Seed script**: idempotent (TD-020). Re-running does not overwrite existing users.
- **Migrations**: idempotent via Drizzle's migration tracking table.

---

## 16. Concurrency / Consistency

### 16.1 Consistency model

- **Strong consistency** within PostgreSQL (default). No distributed transactions, no eventual consistency.
- **No saga / 2PC** — no evidence justifies them.

### 16.2 Transaction scope and isolation

- Each Server Action runs in a single PostgreSQL transaction (Drizzle's `db.transaction()`).
- Default isolation level: READ COMMITTED (PostgreSQL default). Sufficient for V1.
- No SERIALIZABLE needed (no concurrent-offer-update business rule in V1).

### 16.3 Locking strategy

- No explicit locks in V1. PostgreSQL row-level locks are acquired automatically on UPDATE.
- No optimistic concurrency (no `version` column). Last-write-wins (acceptable for V1's small admin team).

### 16.4 Conflict detection

- None in V1. If two admins edit the same offer simultaneously, the second save overwrites the first; updated_at reflects the latest. A future V2 can add a "this offer was modified by someone else" warning via a version column.

### 16.5 Ordering guarantees

- Public list ordered by `published_at DESC` then `created_at DESC` (BR-070, BR-071). PostgreSQL ORDER BY is deterministic given these two columns are unique-per-row (UUID id provides additional tiebreaker if needed — but created_at granularity is sufficient for V1).
- Admin list default ordered by `created_at DESC`. Filter by status preserves this order.

---

## 17. Performance / Capacity

### 17.1 NFR mapping

| NFR | Requirement | Technical realization | Verification | Status |
|---|---|---|---|---|
| NFR-001 | Public pages display primary content within reasonable time | Server Components render on server (no client fetch waterfall). Partial index `idx_offers_published_at_desc` for the public list query. Next.js ISR with on-demand revalidation via `revalidatePath` after admin mutations. | Manual inspection of Vercel build timings + Lighthouse on public pages. No formal perf test in V1 (Charter §13 — success is functional). | DECIDED |
| NFR-030 | Reasonable accessibility | Semantic HTML, ARIA labels via shadcn/ui, keyboard navigation, contrast checked during implementation. | axe-core scan in E2E (Playwright + axe). Manual keyboard navigation test. | DECIDED |

### 17.2 No invented performance targets

Per S6 §17, S6 does NOT invent performance numbers. V1 has no approved quantitative target (Charter §13, OWNER S5 §11 — success is functional). If OWNER adds a quantitative target later (e.g., "public list must render in <500ms p95"), a new NFR is added via S5 change control, then S6 maps it.

### 17.3 Capacity assumptions

- **V1 volumetry**: editorial portal scale (Charter §10 — no quantitative assumption). Single-digit to low-thousands of offers, single-digit admins.
- **Concurrent users**: < 10 admins concurrent (single-digit admin team). Public traffic: not measured in V1 (Charter §13).
- **Database size**: a few MB to a few tens of MB. Neon free tier handles this easily.

### 17.4 Indexes (recap)

- `idx_offers_status` (B-tree on `status`)
- `idx_offers_published_at_desc` (partial B-tree, WHERE status='PUBLISHED', on `published_at DESC`)
- `idx_offers_created_at_desc` (B-tree on `created_at DESC`)
- `idx_users_login` (unique B-tree on `login`)
- Optional: `idx_offers_search_trgm` (GIN trigram on title, company, location) — added only if perf requires

### 17.5 No caching layer

- No Redis (OWNER S6 anti-overengineering, no approved NFR justifying it).
- Next.js built-in cache (Data Cache, Full Route Cache, Router Cache) is used implicitly. ISR for public offer detail pages (revalidate every X minutes OR on-demand via revalidatePath after admin mutation). On-demand is preferred for V1 (no stale content; revalidate immediately when ADMIN publishes/edits).

### 17.6 No speculative scale infrastructure

S6 does NOT design for "millions of users" (no approved requirement). If V1 grows, the simplest path is: add the pg_trgm index, switch ISR to a longer revalidate window, consider Neon read replicas. All deferred until evidence of need.

---

## 18. Testing Architecture

### 18.1 Layers (per TD-024)

| Layer | Tool | Purpose | Boundaries mocked | Boundaries real |
|---|---|---|---|---|
| Unit | Vitest | Pure functions: Zod schemas, business rule helpers (lifecycle transitions), capability checks (can()) | None (no I/O) | All (pure logic) |
| Component | Vitest + React Testing Library | UI components in isolation (OfferCard, OfferForm, StatusBadge) | Server Actions (mocked) | Component logic |
| Integration | Vitest + real Neon preview branch | Server Actions end-to-end against real PostgreSQL: create, edit, publish, suspend, archive, search | None for DB (real Neon) | DB (real), Drizzle, Zod, services |
| E2E | Playwright | Critical user journey per OWNER S6 §21 | None | All (full app + real DB) |

### 18.2 Test data strategy

- **Unit tests**: use simple inline data (objects, arrays). No fixtures.
- **Component tests**: render components with mock props. No DB access.
- **Integration tests**: each test suite runs against a dedicated test database (Neon preview branch or local PostgreSQL). Before each test, the DB is reset (truncate tables). After each test, cleanup. Use a `beforeEach` hook to seed minimal data (one admin, one Fantomas, a few offers).
- **E2E tests**: run against a Vercel Preview deployment (or local Next.js server) with a dedicated Neon preview branch. The E2E setup script seeds the test DB before the suite runs and tears down after.

### 18.3 Mocking discipline (S6 §18)

- **Database**: NEVER mocked in integration tests. Use a real Neon preview branch or local PostgreSQL. This catches SQL errors, schema mismatches, and Drizzle type issues that mocks would hide.
- **Auth**: in non-auth-focused tests, mock the session (set the principal directly). In auth-focused tests (login, logout, capability checks), use the real Better Auth flow.
- **External APIs**: N/A in V1.
- **Time**: where time-dependent logic exists (e.g., published_at), use `vi.useFakeTimers()` in Vitest to control timestamps.

### 18.4 Critical E2E scenario (per OWNER S6 §21)

The Playwright E2E spec `tests/e2e/critical-journey.spec.ts` covers:

1. ADMIN navigates to /admin/login, enters credentials, submits → redirected to /admin/offres
2. ADMIN clicks "Nouvelle offre", fills title + description + 1-2 optional fields, saves → offer appears in admin list as DRAFT
3. ADMIN edits the offer, modifies description, saves → updated content visible in edit form
4. ADMIN clicks "Publier" → status becomes PUBLISHED, published_at is set
5. PUBLIC visits / (root) → offer appears in list as a card
6. PUBLIC clicks "Voir l'offre" → detail page shows all entered fields, formatting preserved
7. PUBLIC verifies no "Apply" button, no share, no logo
8. ADMIN clicks "Suspendre" → status becomes SUSPENDED
9. PUBLIC visits / → offer no longer in list. Public direct URL → 404
10. ADMIN clicks "Republier" → status becomes PUBLISHED, published_at preserved
11. PUBLIC visits / → offer visible again
12. ADMIN clicks "Archiver" → status becomes ARCHIVED (terminal)
13. PUBLIC visits / → offer not visible. Direct URL → 404
14. ADMIN visits admin list → archived offer still visible with status ARCHIVED, content preserved
15. ADMIN clicks "Logout" → redirected to /admin/login

This is the minimum verifiable functional demonstration of V1.

### 18.5 CI integration (per TD-025)

- Vitest unit + component tests: every PR
- Vitest integration tests: every PR (against a CI-dedicated Neon preview branch or local PostgreSQL service container)
- Playwright E2E: on push to main; on PR with label `run-e2e`

---

## 19. Observability

### 19.1 Logging (per TD-026)

- **Structured server logs**: JSON format in production (`{ level, message, timestamp, requestId, ... }`), pretty format in dev.
- **Log levels**: `debug` (dev only), `info` (lifecycle events: offer created, published, etc.), `warn` (recoverable errors: rate-limited login, malformed input rejected), `error` (DB failures, unexpected errors).
- **No sensitive data in logs**: passwords, password hashes, session tokens, secrets are never logged. The logger has a redaction layer (configurable list of keys to redact).

### 19.2 Vercel platform logs

- All Next.js server logs (Server Components, Server Actions, route handlers) are captured by Vercel's log viewer.
- Vercel's runtime metrics (function duration, memory, invocations) are visible in the Vercel dashboard.
- No custom metrics exported in V1 (no Prometheus, no Datadog).

### 19.3 Error tracking

- **Sentry**: NOT used in V1 (TD-026 — deferred).
- **Next.js error boundary**: catches React render errors on the client and shows a fallback UI. Logs the error to Vercel via the `error.tsx` route.
- **Server errors**: Server Actions return `{ ok: false, error: '...' }`. The error message is logged with context (action name, input shape — without sensitive values).

### 19.4 Health indicator

- Vercel provides built-in health checks (deployment readiness).
- No custom `/health` endpoint in V1 (no approved requirement for it). A future version can add a `/api/health` route that checks DB connectivity.

### 19.5 No scheduled monitoring

Per S0 §23 (zero scheduled work), no cron, no background monitoring, no alerting pipeline. OWNER/operator checks Vercel logs manually when needed.

---

## 20. Configuration / Environments

### 20.1 Environments (per TD-019, revised per OWNER §10)

Strict separation between Production and Preview is enforced (Charter §10 MANDATED, TD-019). Local dev must NEVER accidentally write to Production.

| Environment | Purpose | Database | Vercel env | Secrets |
|---|---|---|---|---|
| Local dev | Developer's machine | Local PostgreSQL OR developer's own Neon branch (NOT the production main branch, NOT shared preview branches) | `.env.local` (not committed) | Developer-local DATABASE_URL, BETTER_AUTH_SECRET, FANTOMAS_INITIAL_PASSWORD |
| Preview | Per-PR Vercel deployment | Neon preview branch (auto-provisioned by Neon-Vercel integration, one per PR; isolated, ephemeral) | Vercel Preview env vars | Preview DATABASE_URL, BETTER_AUTH_SECRET, FANTOMAS_INITIAL_PASSWORD (test value, can be a known dev password like "fantomas-preview") |
| Production | Live site | Neon main branch (dedicated, single, protected) | Vercel Production env vars | Production DATABASE_URL, BETTER_AUTH_SECRET, FANTOMAS_INITIAL_PASSWORD (real OWNER-provided value, set once at first deploy, then env var can be removed after bootstrap) |

**Isolation guarantees:**
- The Neon main branch (Production) is NEVER shared with Preview or Local dev. The Neon-Vercel integration auto-creates ephemeral preview branches per PR; these are isolated from the main branch.
- Local dev uses either a local PostgreSQL instance OR a developer-specific Neon branch created from main (NEVER the main branch itself). The developer's `DATABASE_URL` in `.env.local` points to this isolated branch.
- Vercel Production env vars are distinct from Vercel Preview env vars — Vercel enforces this separation; a Preview deployment reads Preview env vars, not Production env vars.
- The Neon main branch should be protected (Neon's branch-protection feature, if available) to prevent accidental drops.

### 20.2 Environment variables

| Variable | Scope | Example value | Notes |
|---|---|---|---|
| `DATABASE_URL` | All | `postgresql://...neon.tech/db?sslmode=require` | Neon connection string (different per environment per 20.1) |
| `BETTER_AUTH_SECRET` | All | (random 32+ char string) | Used by Better Auth to sign session tokens |
| `BETTER_AUTH_URL` | All | `https://jourdain-emploi.example.com` (production) | Better Auth base URL (the deployment URL) |
| `FANTOMAS_INITIAL_PASSWORD` | All (set once on first deploy, then can be removed) | (OWNER-provided value) | Used by the bootstrap script (TD-020); plaintext is hashed by Better Auth at bootstrap; env var can be removed from Vercel after first bootstrap |
| `NEXT_PUBLIC_SITE_URL` | All | `https://jourdain-emploi.example.com` | For sitemap/SEO (TD-029) |
| `INITIAL_ADMIN_LOGIN` | Optional (first deploy only) | `admin1` | Used by bootstrap script for first ADMIN (per TD-020) |
| `INITIAL_ADMIN_PASSWORD` | Optional (first deploy only) | (value) | Used by bootstrap script for first ADMIN; env var can be removed after bootstrap |
| `BETTER_AUTH_RATE_LIMIT_*` | Optional | (Better Auth rate-limit config) | Thresholds for the Better Auth rate limiter (TD-031 finalized). Exact env var names defined by Better Auth config at implementation time (S10). Examples: max attempts per IP, max per username, window duration. |

### 20.3 `.env.example` (committed placeholder — no real values)

```
# Database (Neon) — different per environment (Production / Preview / Local)
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=generate-a-32+-char-random-string
BETTER_AUTH_URL=http://localhost:3000

# Bootstrap (set once on first deploy per environment, then can be removed)
FANTOMAS_INITIAL_PASSWORD=set-at-first-deploy-then-rotate
INITIAL_ADMIN_LOGIN=admin1
INITIAL_ADMIN_PASSWORD=set-at-first-deploy-then-rotate

# Public site URL (for sitemap/SEO)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Better Auth rate limiting (optional; exact names defined by Better Auth config in S10)
# Examples: BETTER_AUTH_RATE_LIMIT_MAX_ATTEMPTS, BETTER_AUTH_RATE_LIMIT_WINDOW_SECONDS
# BETTER_AUTH_RATE_LIMIT_*=
```

This file is committed with placeholder values only (no real secrets — S0 §13). Real values are set in Vercel env vars (Production + Preview separately) and in each developer's `.env.local` (not committed, listed in `.gitignore`).

### 20.4 Target verification (S0 §25, revised per OWNER §10)

Before any write to Production (migrations, bootstrap, any production-only Server Action):
1. **Verify the target environment**: check `process.env.VERCEL_ENV === 'production'` (Vercel sets this automatically). If not production → STOP, do not run the production-only code path.
2. **Verify the database is the Neon main branch**: check `process.env.DATABASE_URL` host against the production Neon hostname (e.g., `ep-xxx-main.region.aws.neon.tech`). If the host does not match the production pattern → STOP, do not write. This prevents a Preview deployment's DATABASE_URL from accidentally pointing to production (or vice versa).
3. **Verify the bootstrap has not already run** (for the bootstrap script): check if Fantomas already exists in the DB. If yes → log a warning and do not overwrite (idempotent, per TD-020).
4. **Log the verification**: the bootstrap script and any production-only code path logs "target verified: production + main branch" before the first write, so the operator can confirm in Vercel logs.

This is enforced in the bootstrap script (TD-020) and in any future production-only Server Action. The migration script (`drizzle-kit migrate`) is run manually against production by the operator (per TD-018) — the operator is responsible for verifying they are targeting the production DATABASE_URL before running the command.

**Local dev safeguard**: the developer's `.env.local` must point to a local PostgreSQL or a developer-specific Neon branch, NEVER to the production main branch. A pre-commit or pre-deploy check (e.g., a git hook or a CI check) can verify that `.env.local`'s DATABASE_URL host is not the production host — this is an S10 implementation detail.

---

## 21. Deployment Architecture

### 21.1 Runtime and hosting

- **Vercel** (MANDATED, TD-019). Next.js App Router native deployment.
- **Node.js runtime** (Vercel default for Next.js).
- **No Docker, no Kubernetes** (OWNER anti-overengineering).

### 21.2 Build artifacts

- Vercel builds the Next.js app from the GitHub main branch (or preview branch).
- Build command: `pnpm build` (Next.js build).
- Output: `.next/` directory deployed to Vercel's edge network.

### 21.3 Migration execution

- Per TD-018: migrations are NOT run automatically by Vercel.
- Before each production deploy, the operator runs `pnpm db:migrate` against the production DATABASE_URL (or Vercel runs it as a pre-deploy build step if configured).
- S6 specifies the mechanism (Drizzle Kit migrate); the actual production migration is executed in S13 (Production Deployment & Verification) per OWNER GO.

### 21.4 Rollback

- Vercel provides instant rollback to the previous deployment (one click in the dashboard).
- Database migrations: Drizzle migrations are forward-only in V1. If a migration breaks production, the operator rolls back the Vercel deployment to the previous build AND runs a manual SQL down-migration (if Drizzle generated one). Drizzle Kit can generate down migrations if configured. S6 recommends enabling down migrations for safety.
- Neon PITR is the ultimate rollback for data (Section 8.7).

### 21.5 Availability model

- V1 has no formal availability SLO (Charter §13).
- Vercel provides automatic failover and global CDN.
- Neon provides managed PostgreSQL with automatic failover within the region.
- No multi-region deployment in V1 (Charter does not require it).

### 21.6 Health checks

- Vercel provides built-in deployment readiness checks.
- No custom health endpoint in V1 (Section 19.4).

---

## 22. Migration / Evolution

### 22.1 Migration mechanism

- Drizzle Kit (TD-018). Schema-as-code in `db/schema.ts`.
- `drizzle-kit generate` creates versioned SQL migration files in `db/migrations/`.
- `drizzle-kit migrate` applies pending migrations in order.
- Drizzle tracks applied migrations in a `__drizzle_migrations` table.

### 22.2 Compatibility

- Forward-only in V1. No backward-compatible migration pattern required (no API consumers in V1).
- Drizzle can generate down migrations for rollback safety (recommended).

### 22.3 Deployment ordering

1. CI passes (typecheck, lint, tests, build).
2. PR merged to main.
3. Vercel deploys to Preview (per branch).
4. Operator runs `pnpm db:migrate` against Preview DB (or Vercel runs it as a build step).
5. Smoke test on Preview.
6. OWNER GO for production deploy.
7. Vercel promotes to Production.
8. Operator runs `pnpm db:migrate` against Production DB (or Vercel runs it as a pre-deploy step).
9. S13 verification (smoke test on production).

### 22.4 Zero-downtime

- Vercel deployments are atomic (new deployment takes over; in-flight requests complete on the old deployment).
- Database migrations in V1 are simple (no destructive schema changes expected). If a migration requires a long table rewrite, the operator coordinates a brief maintenance window — V1 has no formal uptime requirement so this is acceptable.

### 22.5 Legacy transition strategy

- N/A — V1 has no legacy system to migrate from (Charter §4 — D2 deferred).

---

## 23. Backup / Recovery

### 23.1 Backup scope and frequency

- **Neon automatic backups** for the production main branch. Neon provides PITR (point-in-time recovery) — 7-day window on free tier, longer on paid.
- No custom backup scripts in V1 (no scheduled work — S0 §23).
- No file storage (no uploads in V1).

### 23.2 Recovery expectations

- **RPO**: not specified in V1 (Charter does not specify; S6 §24 forbids inventing). Neon's PITR window is the de facto RPO (7 days).
- **RTO**: not specified. The operator restores via Neon's PITR UI when needed.
- **Restore verification**: the operator manually verifies after restore (e.g., a known offer is visible, the admin can log in).

### 23.3 Operational ownership

- OWNER (or operator designated by OWNER) is responsible for:
  - Vercel deployment management
  - Neon branch management
  - Production secret rotation
  - Periodic check of Vercel logs for errors
  - Recovery if a production incident occurs

S6 does not define an SLA, an on-call rotation, or an incident response playbook — those are operational concerns outside the technical specification scope.

---

## 24. Requirement-to-Design Traceability

S6 maps every critical S5 requirement to its design realization and verification type.

### 24.1 FR (Functional Requirements) traceability

| S5 ID | S5 requirement | S6 realization | Verification |
|---|---|---|---|
| FR-001 | Admin login | TD-003 revised (Better Auth), Section 12.3 | E2E step 1; integration test (loginAction) |
| FR-002 | Admin logout | TD-003, Section 12.4 | E2E step 15 |
| FR-003 | Back-office denied to unauthenticated | middleware.ts + Section 13.4 | Integration test (unauthenticated request to /admin/offres → redirect) |
| FR-004 | No public registration | No registration route; Section 12 | E2E: verify no /register route; component test |
| FR-010 | Admin offer list | app/admin/offres/page.tsx + lib/server/services/offers.ts + Section 9.3.1 | Integration test (list query) + E2E step 2 |
| FR-011 | Admin list status visibility | StatusBadge component + Section 9.1 enum | Component test + E2E visual check |
| FR-012 | Admin status filter | URL search param + Drizzle WHERE clause | Integration test (filter) |
| FR-013 | Admin title search (SHOULD) | URL search param + Drizzle ILIKE | Integration test (search) |
| FR-020 | New offer creation | createOfferAction + lib/server/validation/offerSchema.ts + Section 9.3.1 | Integration test + E2E step 2 |
| FR-021 | Offer editing | updateOfferAction | Integration test + E2E step 3 |
| FR-022 | Save without publishing | BR-021 enforced in updateOfferAction (status not changed on save) | Integration test (save DRAFT, verify still DRAFT) |
| FR-023 | Required field validation | Zod offerSchema | Unit test (Zod) + integration test |
| FR-024 | URL/email validation | Zod (email, url) | Unit test + integration test |
| FR-025 | PUBLISHED modification stays PUBLISHED | updateOfferAction does not change status | Integration test (edit PUBLISHED, verify status preserved) |
| FR-030 | Publish offer | publishOfferAction + service updates status + sets published_at + revalidatePath | Integration test + E2E step 4 |
| FR-031 | Suspend offer | suspendOfferAction | Integration test + E2E step 8 |
| FR-032 | Republish offer | republishOfferAction (preserves published_at) | Integration test + E2E step 10 |
| FR-033 | Archive offer (terminal) | archiveOfferAction | Integration test + E2E step 12 |
| FR-034 | No auto-delete | No deletion code path; OOS-019 | Code review |
| FR-035 | No automated expiration | No scheduled job; S0 §23 | Code review (no cron) |
| FR-040 | Public offer list at root | app/(public)/page.tsx + lib/server/services/offers.ts (WHERE status='PUBLISHED' ORDER BY published_at DESC) | Integration test + E2E step 5 |
| FR-041 | Public offer detail | app/(public)/offres/[id]/page.tsx + Drizzle query | Integration test + E2E step 6 |
| FR-042 | Non-published → 404 | Drizzle query returns null → notFound() | Integration test (DRAFT, SUSPENDED, ARCHIVED → 404) |
| FR-050 | Public simple search (SHOULD) | TD-016 (ILIKE) | Integration test |
| FR-060 | Empty public list state | app/(public)/page.tsx empty state | Component test |
| FR-061 | Empty admin list state | app/admin/offres/page.tsx empty state | Component test |

### 24.2 BR (Business Rules) traceability

| S5 ID | S6 realization | Verification |
|---|---|---|
| BR-020 | Enum offer_status (Section 9.1) + service transitions | Unit test (state machine) |
| BR-021 | publishOfferAction is separate from updateOfferAction | Integration test |
| BR-022 | published_at set in publishOfferAction, preserved in republishOfferAction | Integration test |
| BR-023 | suspendOfferAction preserves content (only status + updated_at change) | Integration test (snapshot before/after) |
| BR-024 | archiveOfferAction preserves content; no transition out of ARCHIVED | Integration test |
| BR-025 | All public queries filter status='PUBLISHED' | Integration test (verify other statuses excluded) |
| BR-026 | No scheduled jobs; no date-based transitions | Code review (no cron, no date-based status updates) |
| BR-030 | Zod offerSchema requires title + description non-empty | Unit test (Zod) |
| BR-031 | Optional fields nullable; UI omits absent values | Component test |
| BR-032 | System never auto-fills; ADMIN enters all values | Code review (no defaults for optional content fields) |
| BR-033 | Card omits company if absent; detail shows "Entreprise non communiquée" | Component test |
| BR-034 | Tiptap JSON stored, rendered server-side | Integration test (format preserved) + E2E step 6 |
| BR-040 | No Apply button component; modalities shown as info | Component test (no Apply button rendered) |
| BR-050 | source fields nullable, no import code | Code review |
| BR-060 | date type for source_publication_date + application_deadline; timestamptz for published_at, created_at, updated_at | Drizzle schema inspection |
| BR-061 | source_publication_date and published_at are separate columns | Schema inspection |
| BR-062 | No auto-transition on application_deadline | Code review |
| BR-063 | No expiration_date column | Schema inspection |
| BR-070 | Public list ORDER BY published_at DESC | Integration test |
| BR-071 | Tie-breaker created_at DESC | Integration test |
| BR-080 | Zod email + url validation | Unit test (Zod) |

### 24.3 PERM (Permissions) traceability

| S5 ID | S6 realization | Verification |
|---|---|---|
| PERM-001 | Public routes have no auth requirement | E2E (public can browse without login) |
| PERM-002 | requireAdmin() in each admin Server Action | Integration test (admin actions reject unauthenticated) |
| PERM-003 | middleware.ts + layout guard | Integration test (unauthenticated → redirect) |
| PERM-004 | can() function with capability matrix (Section 13.3) | Unit test (can('admin', 'offer:publish') === true; can('fantomas', 'system:bootstrap') === true; can('admin', 'system:bootstrap') === false) |

### 24.4 INT (Integration) traceability

| S5 ID | S6 realization | Verification |
|---|---|---|
| INT-001 (no external integration) | No integration code; no external API client | Code review (no external fetch except Vercel/Neon infra) |

### 24.5 NFR (Non-Functional) traceability

| S5 ID | S6 realization | Verification |
|---|---|---|
| NFR-001 | Server Components + partial index + ISR | Lighthouse on public pages (manual) |
| NFR-010 | scrypt password hashing via Better Auth default (TD-009 revised) | Unit test (hash format) + DB inspection (no plaintext column) |
| NFR-011 | No secret in repo; S0 §13 + §25 | Code review (grep for secret patterns; .env.example has placeholders only) |
| NFR-012 | Better Auth database session + httpOnly + secure + SameSite=Lax cookie (TD-003 revised, TD-028) | Component test + browser DevTools inspection |
| NFR-013 | Fantomas bootstrap via env var + idempotent bootstrap script (TD-020 revised) | Integration test (bootstrap script creates Fantomas with scrypt-hashed password via Better Auth) |
| NFR-030 | Semantic HTML, shadcn/ui ARIA, keyboard nav | axe-core in E2E + manual keyboard test |
| NFR-040 | French only; messages/fr.ts | Code review (no i18n framework; all strings in French) |
| NFR-050 | created_at, updated_at, published_at columns | Schema inspection |
| NFR-060 | Status transitions preserve content; only status + updated_at change | Integration tests (FR-031/032/033) |

### 24.6 Unaddressed critical S5 requirements

**0** — every critical S5 requirement (MUST) has an S6 design realization in the matrix above.

---

## 25. Technical Risks

Compact risk register (S6 §27 — every risk has evidence or concrete scenario; no speculative catalogue).

| Risk | Evidence | Impact | Response | Owner |
|---|---|---|---|---|
| Fantomas bootstrap password mishandling | S0 §13/§25; if accidentally committed, GitHub Secret Scanning may revoke access | High (system compromise if leaked; recovery blocked if revoked) | MITIGATE: env var only; seed script hashes; rotate after first use; TD-020 documents the procedure | OWNER + S6 |
| Concurrent offer edit (last-write-wins) | Small admin team; rare in practice | Low (data loss for one edit; recoverable via Neon PITR) | ACCEPT for V1; add optimistic locking in V2 if it becomes an issue | S6 |
| Better Auth API churn | Better Auth was stabilizing in 2024-2025; minor API changes possible | Low-Medium (build breaks; quick fix) | MITIGATE: pin Better Auth version; CI catches breaks | S6 |
| Drizzle migration failure on production | Migration may fail mid-way (rare with Drizzle) | Medium (production deploy blocked; manual recovery needed) | MITIGATE: enable Drizzle down migrations; test migrations on Preview first | S6 + operator |
| Neon free tier limits | Free tier has compute/storage limits; V1 may hit them if volumetry grows unexpectedly | Low (warning before hard limit) | MONITOR: Vercel + Neon dashboards show usage. Upgrade tier if needed. | OWNER |
| Tiptap rendering security (if a future extension allows raw HTML) | Currently V1 uses Tiptap React server-side renderer (no HTML string, no dangerouslySetInnerHTML — TD-013 revised); a future extension enabling raw HTML paste could introduce risk | Low (V1 has no such extension) | MITIGATE: do not enable `@tiptap/extension-html` or raw HTML paste in V1. Code review in S10. | S6 + S10 |
| ~~Vercel build failure due to native bcrypt dep~~ | ~~bcrypt npm package uses a native binding~~ | RESOLVED — TD-009 revised uses Better Auth's scrypt (Node.js built-in crypto.scrypt, no native binding). The bcrypt build risk no longer applies. Risk removed from V1. | RESOLVED by TD-009 revised | N/A |
| Public offer URL not SEO-optimized (uses UUID) | /offres/{uuid} is not keyword-rich | Low (Charter §13 — no quantitative SEO target) | ACCEPT for V1; revisit in V2 if SEO becomes a priority | OWNER |

---

## 26. Open Technical Decisions (revised per OWNER §7)

OWNER revision §7 directs S6 to reclass the 5 items previously listed as "non-blocking, resolved in S10". S10 must primarily IMPLEMENT, not choose architecture tardively. The 5 items are reclassified as follows:

| Previous open item | Reclassification (per OWNER §7) | Final status |
|---|---|---|
| bcrypt vs bcryptjs | RESOLVED by TD-009 revised — Better Auth handles password hashing with scrypt by default. No bcrypt or bcryptjs dependency. The question disappears entirely. | CLOSED in S6 |
| pg_trgm index creation timing | RESOLVED by TD-016 revised — pg_trgm is OPTIONAL PERFORMANCE OPTIMIZATION, not a V1 initial requirement. V1 ships WITHOUT pg_trgm. If profiling proves the need later, a forward migration adds it (per TD-018 doctrine). | CLOSED in S6 (deferred as measured optimization, not an open question) |
| Public search route handler vs URL search params | RESOLVED by TD-016 revised — public search is implemented as a Server Component reading `?q=` searchParams, querying the DB via Drizzle, rendering the filtered list server-side. NO public API route handler is created (avoids creating a "public API" that V1 excludes — INT-001, OOS-015). | CLOSED in S6 |
| Login rate limiting implementation | RESOLVED architecturally by TD-031 finalized — Better Auth integrated rate limiter with database storage on Neon (NOT in-memory — in-memory is not serverless-compatible per OWNER final patch §1). No Redis. No custom module. Thresholds configurable via Better Auth config + env vars at implementation time. | CLOSED in S6 (architecture); S10 implements the chosen architecture |
| Drizzle down migrations | RESOLVED by TD-018 revised — V1 prefers FORWARD CORRECTIVE migrations over automatic down migrations. Down migrations are retained only for purely additive migrations (add column, add table, add index) where the up is reversible without data loss. For destructive or transformative migrations, forward correction is the rollback path. | CLOSED in S6 |

**BLOCKING technical decisions: 0.**
**NON-BLOCKING open technical decisions: 0.**

All 5 previously-open items are now CLOSED in S6 — they have an architectural decision recorded in the relevant TD. S10 implements the decisions; S10 does NOT re-choose architecture. S6 can close.

---

## 27. ADR Candidates for S7 (revised)

The following S6 decisions are structuring enough to warrant durable ADR treatment in S7 (per S6 §33 handoff):

| TD ID | Decision | Why ADR-worthy |
|---|---|---|
| TD-001 | Modular monolith Next.js full-stack | Architecture-defining; bounds future scope |
| TD-003 (revised) | Better Auth (Drizzle adapter, username/password, database sessions, sign-up disabled) + can()/requireCapability() authorization layer independent of auth library | Security-relevant; separation of auth/authorization is a structuring pattern; hard to change later |
| TD-004 | Drizzle ORM | Cross-cutting; affects all DB code |
| TD-006 | Server Components + Server Actions (no TanStack Query) | Architectural pattern; affects all data flows |
| TD-009 (revised) | Better Auth default password hashing (scrypt) | Security-relevant; coupled to TD-003 |
| TD-013 (revised) | Tiptap JSON storage + Tiptap React server-side renderer (no HTML string roundtrip) | Affects description schema, editor, rendering; safety contract |
| TD-014 | /offres/{id} URL strategy (UUID v4) | Public-facing; affects SEO and external links |
| TD-018 (revised) | Drizzle Kit migrations + forward corrective doctrine (no push against Production; no down-migration reliance) | Affects all schema evolution and rollback safety |
| TD-019 | Vercel Production + Preview with Neon main + preview branches (strict isolation + target verification) | Security-critical (Preview/Production isolation) |
| TD-020 (revised) | Bootstrap of Fantomas and initial ADMIN via idempotent bootstrap script + env vars (separate from demo seed) | Security-critical; AISE-mandated; seed-vs-bootstrap distinction |
| TD-021 | Free text for Entreprises/Secteurs/Catégories (no CRUD modules) | Bounds future scope |
| TD-024 | Testing architecture (Vitest + RTL + Playwright, real DB in integration) | Affects all tests |
| TD-028 | CSRF via Next.js Server Actions origin check + SameSite=Lax | Security-relevant |
| TD-030 | drizzle-orm/neon-http (HTTP-based, matched to V1's short transactions; explicit binding, no WebSocket/TCP) | Affects all DB connection code |
| TD-031 | Better Auth integrated rate limiter + database storage on Neon (NOT in-memory, NOT Redis, NOT custom module) | Security-relevant; coupled to TD-003; serverless-compatible |

The remaining TDs (TD-002, TD-005, TD-007, TD-008, TD-010, TD-011, TD-012, TD-015, TD-016, TD-017, TD-022, TD-023, TD-025, TD-026, TD-027, TD-029) are either MANDATED (not choices — TD-002) or implementation details / standard tool choices that don't need durable ADR treatment.

---

## 28. S7 Handoff

S6 hands off to S7 (Project Manifest + ADR):

- **APPROVED TECHNICAL_SPECIFICATION** (this document, once OWNER approves)
- **TECHNICAL DECISION LIST**: TD-001 through TD-031 (Section 5 + Section 27)
- **ADR CANDIDATES**: 15 ADRs (Section 27)
- **SELECTED STACK**: Section 7
- **ARCHITECTURAL BOUNDARIES**: Section 6 (module map + dependency direction rule)
- **CANONICAL TECHNICAL CONSTRAINTS**:
  - Modular monolith (no microservices / no backend séparé)
  - PostgreSQL on Neon (MANDATED)
  - Vercel Production + Preview (MANDATED)
  - Drizzle ORM + @neondatabase/serverless (TD-004, TD-030)
  - Better Auth + can()/requireCapability() authorization layer (TD-003 revised)
  - scrypt password hashing via Better Auth default (TD-009 revised)
  - Tiptap JSON storage + Tiptap React server-side renderer (TD-013 revised)
  - /offres/{id} URLs with UUID v4 (TD-014, TD-015)
  - PostgreSQL ILIKE search via Server Component + searchParams (TD-016 revised)
  - Drizzle Kit migrations with forward corrective doctrine (TD-018 revised)
  - Idempotent bootstrap separate from demo seed (TD-020 revised)
  - Better Auth integrated rate limiter + database storage on Neon (TD-031 finalized)
  - No public API, no notifications, no automatic expiration, no physical deletion, no multi-tenant, no multilingual, no complex RBAC (all per S5)
  - AISE S0 invariants: §13, §14/§21, §23, §24, §25

S6 does NOT create ADR files. S7 creates the durable ADR files based on this handoff.

---

## 29. Approval / Baseline Status

**APPROVED BY OWNER on 2026-09-15.**

OWNER has explicitly approved this technical specification at canonical commit `7c85323c557476672a1e227e8773b0fa45459ff4` with the following acknowledgment:

> J'approuve explicitement la spécification technique S6 finalisée de JOURDAIN EMPLOI. TECHNICAL SPECIFICATION: docs/architecture/TECHNICAL_SPECIFICATION.md. BASELINE S6 APPROUVÉ: 7c85323c557476672a1e227e8773b0fa45459ff4. S6 est APPROUVÉ.

Per AISE S6 §31, the baseline is now FROZEN as the canonical intended state for the project. Any future modification requires a material change record and OWNER approval.

Per AISE S6 §32, S6 transitions PROJECT_STATE to:
- AISE PHASE: S6 — CLOSED / PASS
- TECHNICAL SPECIFICATION: APPROVED
- NEXT RECOMMENDED: S7 — Project Manifest + ADR

S7 begins only after explicit OWNER GO.

| Field | Value |
|---|---|
| Document status | OWNER APPROVED — S6 CLOSED / PASS |
| Charter reference | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Product requirements reference | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| S6 initial draft date | 2026-09-14 |
| S6 revision date | 2026-09-15 (after OWNER revision decisions §1–§15 + final patch §1–§5 + auth consistency patch) |
| S6 OWNER approval date | 2026-09-15 |
| Approved baseline commit | `7c85323c557476672a1e227e8773b0fa45459ff4` |
| Next recommended component | S7 — Project Manifest + ADR |

### 29.1 Quality gate self-check (per S6 §34, revised per OWNER §14 + final patch §5)

| Check | Result |
|---|---|
| Blocking product ambiguities | 0 (S5 baseline approved with 0 blocking) |
| Blocking technical decisions | 0 (Section 26 — all 5 previously-open items CLOSED in S6) |
| Unaddressed critical S5 requirements | 0 (Section 24 — every MUST mapped) |
| S6 decisions contradicting S5 | 0 (no S5 requirement altered; all decisions preserve S5 semantics) |
| Unjustified major technical complexity | 0 (modular monolith, single DB, no cache, no async infra, no external API — all per OWNER S6 anti-overengineering) |
| Mandated constraints ignored | 0 (all MANDATED constraints applied: React, Next.js, TS, App Router, Vercel, Neon, Production/Preview isolation) |
| PREFERENCE silently converted to MANDATED (OWNER §1) | 0 — Zod, Tailwind, pnpm, Better Auth, Drizzle, TanStack Query, React Hook Form, shadcn/ui are all DECIDED (Section 2.3), not MANDATED. Each has rationale. |
| Auth/session incompatibility (OWNER §14) | 0 — Better Auth + Drizzle adapter + database sessions are compatible (TD-003 finalized); no Auth.js/bcrypt remnants; no bcrypt/bcryptjs dependency (TD-009 revised). |
| Auth choice deferred to S10 (OWNER §14) | 0 — TD-003 finalized is DECIDED in S6. S10 implements, does not re-choose. |
| Tiptap rendering contradiction (OWNER §14) | 0 — TD-013 revised uses Tiptap React server-side renderer (no HTML string roundtrip, no dangerouslySetInnerHTML with user content). The contract is internally consistent. |
| Critical NFRs without realization | 0 (NFR-001 perf, NFR-010/011/012/013 security, NFR-030 accessibility, NFR-040 French, NFR-050 audit, NFR-060 integrity — all realized, Section 24.5) |
| Critical boundaries without verification | 0 (auth boundary, public visibility boundary, secret boundary, Preview/Production boundary, auth-vs-authorization separation — all have verification in Section 24 and TD-019/Section 13) |
| Major decisions without rationale | 0 (every TD-NNN has rationale linked to requirement or OWNER decision) |
| Separation auth/authorization clear (OWNER §14) | YES — Better Auth authenticates; `can()` / `requireCapability()` authorizes independently (Section 13.2). Better Auth Admin plugin is NOT the business authorization system. |
| Fantomas still conformant (OWNER §14) | YES — capability matrix Section 13.3 satisfies AISE §21 (Fantomas inherits ADMIN capabilities + extra; ADMIN does not inherit Fantomas-only). |
| Drizzle/Neon coherent (OWNER §14) | YES — TD-004 (Drizzle) + TD-030 finalized (drizzle-orm/neon-http, matched to V1's short transactions; explicit binding choice, not "HTTP/WebSockets"). |
| Production/Preview coherent (OWNER §14) | YES — TD-019 + Section 20 strict isolation + target verification. |
| **Rate limiting compatible with Vercel serverless (OWNER final patch §5)** | **YES** — TD-031 finalized: Better Auth integrated rate limiter + database storage on Neon. NOT in-memory (per-instance counter is not serverless-compatible). NOT Redis. No custom module. |
| **No Redis added (OWNER final patch §5)** | **YES** — no Redis, no Vercel KV, no Upstash. Rate limiting uses the same Neon DB as the rest of V1. |
| **Username plugin explicitly defined (OWNER final patch §5)** | **YES** — TD-003 finalized explicitly names the Better Auth Username plugin; daily login identifier is username (NOT email); Section 12.2 documents the credential model. |
| **Login Fantomas technically feasible (OWNER final patch §5)** | **YES** — Fantomas logs in with username "Fantomas" via the Username plugin endpoint (`auth.api.signInUsername`). The bootstrap script creates Fantomas with this username via `auth.api.createUser()`. |
| **Public signup disabled (OWNER final patch §5 + auth consistency patch)** | **YES** — `emailAndPassword: { enabled: true, disableSignUp: true }` (Better Auth documented syntax; NOT the old `emailAndPassword.signUp.disabled` form). No /sign-up endpoint; users created ONLY via bootstrap. |
| **Admin plugin explicitly configured (auth consistency patch)** | **YES** — Better Auth Admin plugin (better-auth/plugins/admin) is explicitly configured server-side; enables `auth.api.createUser()` for the bootstrap script; NOT the business authorization system; no user-management UI in V1. |
| **principalType present (auth consistency patch)** | **YES** — `principalType` field (enum: 'ADMIN' | 'FANTOMAS') added to user table via Better Auth config; source of truth for `can()` / `requireCapability()`. |
| **principalType ADMIN/FANTOMAS (auth consistency patch)** | **YES** — Fantomas bootstrap sets `principalType: 'FANTOMAS'`; initial ADMIN bootstrap sets `principalType: 'ADMIN'`. |
| **Better Auth role != JOURDAIN business principal (auth consistency patch)** | **YES** — Better Auth's `role` field is reserved for Admin plugin internals; JOURDAIN EMPLOI business authorization reads `principalType`, NOT `role`. |
| **can()/requireCapability() uses principalType (auth consistency patch)** | **YES** — `can()` reads `principal.principalType` (NOT `principal.role`); the authorization layer is independent of Better Auth's internal permissions. |
| **Bootstrap compatible with Better Auth (OWNER final patch §5)** | **YES** — TD-003 finalized + TD-020 revised + Section 12.5: bootstrap calls `auth.api.createUser()` (Better Auth's SUPPORTED server-side user creation API). Better Auth handles hashing + DB writes. |
| **No manual password hash INSERT (OWNER final patch §5)** | **YES** — the bootstrap script does NOT manually INSERT password hashes, does NOT bypass Better Auth, does NOT write to the DB directly. All DB writes go through `auth.api.createUser()`. |
| **Drizzle/Neon driver unique and clearly decided (OWNER final patch §5)** | **YES** — TD-030 finalized: drizzle-orm/neon-http (HTTP-based). NOT "HTTP/WebSockets" as two possibilities. Explicit single binding. |
| **can()/requireCapability() independent of Better Auth (OWNER final patch §5 + auth consistency patch)** | **YES** — Section 13.2: the authorization layer reads only the `principalType` field from the session (NOT Better Auth's `role`); it does not import Better Auth types or call Better Auth functions for capability checks. The mapping from Better Auth session to our `Principal` type is the ONLY place where Better Auth is imported in the authorization layer. |
| **0 OPEN (OWNER final patch §5)** | **YES** — 0 OPEN status; 0 non-blocking open technical decisions (Section 26 — all CLOSED in S6). |
| **0 PROVISIONAL (OWNER final patch §5)** | **YES** — 0 PROVISIONAL status. |
| **No other architecture modified (OWNER final patch §5)** | **YES** — only TD-003 (auth + bootstrap), TD-030 (driver), TD-031 (rate limiting), Section 12 (auth flows), Section 14.10 (rate limiting), Section 7.1/7.2 (stack summary), Section 9.3.2 (auth tables note), module map (Section 6) were updated. All other TDs and architecture decisions are unchanged from the previous revision. |

**Verdict: QUALITY GATE PASS. S6 is READY FOR OWNER APPROVAL.**

### 29.2 Owner approval summary (revised)

When presenting to OWNER for approval, S6 summarizes:

- **Architecture**: Modular monolith Next.js full-stack (TD-001). Single app, single DB, no microservices, no cache, no external API.
- **Major stack choices**: Drizzle ORM (TD-004, DECIDED); Better Auth (TD-003 finalized, DECIDED — Username plugin + emailAndPassword, replaces Auth.js); scrypt via Better Auth default (TD-009 revised — replaces bcrypt); Tiptap JSON + React server-side renderer (TD-013 revised — no HTML string roundtrip); Tailwind + shadcn/ui (TD-010, TD-011, both DECIDED — reclassified from MANDATED); pnpm (TD-017, DECIDED); Zod (TD-008, DECIDED); Vitest + RTL + Playwright (TD-024); drizzle-orm/neon-http (TD-030 finalized); Better Auth integrated rate limiter + database storage on Neon (TD-031 finalized).
- **Data design**: offers table (Section 9.3.1) + Better Auth standard tables (user, session, account, verification) with V1 `role` extension on user (Section 9.3.2 — Better Auth manages these tables; S6 documents the expected shape). Free text for Entreprises/Secteurs/Catégories (TD-021). UUID ids (TD-015). 4-state enum for offer status.
- **Integration model**: No external integration in V1 (INT-001).
- **Auth/security**: Better Auth (Username plugin + emailAndPassword) + database sessions + sign-up disabled; Fantomas via idempotent bootstrap script calling `auth.api.createUser()` + env var (TD-020 revised — separate from demo seed); `can()` / `requireCapability()` capability abstraction per AISE §21 (Section 13) — INDEPENDENT of the auth library (OWNER §2 separation of concerns); Better Auth integrated rate limiter with database storage on Neon (TD-031 finalized — NOT in-memory, NOT Redis).
- **Deployment**: Vercel Production + Preview with Neon main + preview branches (TD-019, strict isolation + target verification per Section 20.4). No Docker/K8s.
- **Migration doctrine (TD-018 revised)**: schema source-controlled; migrations generated and reviewed; applied controlled (never `drizzle-kit push` against Production); forward corrective migrations preferred over down migrations; seed vs bootstrap distinction (OWNER §12).
- **Testing**: Vitest (unit + component + integration with REAL DB, no DB mocking) + Playwright (E2E critical journey per OWNER S6 §21).
- **Critical NFR realization**: NFR-001 (Server Components + partial index + ISR), NFR-010/011/012/013 (Better Auth + secret handling), NFR-030 (semantic HTML + axe-core), NFR-040 (French only), NFR-050 (timestamps), NFR-060 (status transitions preserve content).
- **Material risks**: 8 risks identified (Section 25) — all MITIGATE/ACCEPT/MONITOR with concrete responses. The Fantomas credential mishandling risk and Tiptap rendering risk are mitigated by TD-020 (env var + idempotent bootstrap, no plaintext in repo) and TD-013 revised (React renderer, no HTML string).
- **Trade-offs**: Prisma vs Drizzle (chose Drizzle); Better Auth vs Auth.js (chose Better Auth per OWNER §2); TanStack Query vs Server Actions (chose Server Actions); Tiptap vs Markdown (chose Tiptap); URL strategy (chose /offres/{id} over slug-based); bcrypt vs scrypt (chose scrypt via Better Auth default); pg_trgm vs none (chose none in V1 initial — optional optimization); Neon serverless vs TCP driver (chose serverless — matched to V1's short transactions).
- **Status distribution (revised)**: 31 TDs total — 28 DECIDED + 1 MANDATED (PostgreSQL/Neon, TD-002) + 0 PROVISIONAL + 0 OPEN + 0 DEFERRED status. Note: TD-002 is the only MANDATED TD (PostgreSQL/Neon from Charter §10); all other "preferences" (Zod, Tailwind, pnpm, Better Auth, Drizzle, etc.) are DECIDED with rationale (Section 2.3).
- **Open questions**: 0 blocking + 0 non-blocking (all 5 previously-open items CLOSED in S6 per OWNER §7).
- **ADR candidates**: 15 (Section 27 — added TD-030 and TD-031).

S6 is ready for OWNER approval. S7 has NOT started.
