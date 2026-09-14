# TECHNICAL SPECIFICATION — JOURDAIN EMPLOI V1

**Document type:** AISE S6 — Technical Specification
**Status:** DRAFT — PENDING OWNER APPROVAL
**Date:** 2026-09-14
**Project:** JOURDAIN EMPLOI V1
**Canonical repository:** `github.com/alexkanga/jourdain`
**Canonical branch:** `main`
**Charter-approved HEAD (source S4):** `fa377c1feba5a111c07e0f40d094245fdadc727d`
**Product-requirements-approved HEAD (source S5):** `9ec4a08b467a4a3909fa9bc0a72bf02e4c682418`
**S6 draft HEAD at start:** `dfe91621f94a0cdc6368707bc3a3f0416b455f74`

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
| Status | DRAFT — PENDING OWNER APPROVAL |
| Source Charter | `docs/planning/PROJECT_CHARTER.md` — APPROVED 2026-09-13 at `fa377c1` |
| Source Product Requirements | `docs/product/PRODUCT_REQUIREMENTS.md` — APPROVED 2026-09-14 at `9ec4a08` |
| S6 draft date | 2026-09-14 |
| S6 OWNER approval | PENDING |
| Next recommended component | S7 — Project Manifest + ADR |

Per AISE S6 §30, the baseline is NOT valid until OWNER explicitly approves it.

---

## 2. Technical Context

### 2.1 Approved inputs

- **Charter** (`fa377c1`): JOURDAIN EMPLOI V1 is a simple, mono-tenant web portal for publishing and consulting job offers. Single ADMIN role, no complex RBAC, no notifications, no API publique, no multilingual, no multi-tenant. Fantomas principal mandated by AISE §14/§21.
- **Product Requirements** (`9ec4a08`): 65 CONFIRMED requirements (30 FR + 21 BR + 4 PERM + 1 INT + 9 NFR), 60 MUST + 5 SHOULD. 4-state offer lifecycle (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED — terminal). 21 offer business fields. No public API, no notifications, no automatic expiration, no physical deletion.

### 2.2 OWNER-mandated technical constraints (MANDATED, not S6 optimization choices)

| Constraint | Source | Implication |
|---|---|---|
| React | Charter §10, OWNER S6 §1 | UI library |
| Next.js | Charter §10, OWNER S6 §1 | Web framework |
| TypeScript | Charter §10, OWNER S6 §1 | Language |
| Next.js App Router | Charter §10, OWNER S6 §1 | Routing model |
| Vercel | Charter §10, OWNER S6 §1 | Hosting platform |
| PostgreSQL Neon | Charter §10, OWNER S6 §1 | Database |
| Production separated from Preview | Charter §10, OWNER S6 §13 | Environment isolation |
| No microservices / K8s / Kafka / ES / Redis / event bus / distributed architecture without demonstrated need | Charter §10, OWNER S6 anti-overengineering | Monolith modular full-stack |
| AISE S0 §13 (no secrets in repo) | S0 FROZEN | All secrets via §25 External Parameter Gate |
| AISE S0 §14/§21 (Fantomas) | S0 FROZEN | Break-glass principal with full SUPER_ADMIN + specific capabilities |
| AISE S0 §23 (zero scheduled work) | S0 FROZEN | No cron, no background jobs, no auto-expiration |
| AISE S0 §24 (contract preservation) | S0 FROZEN | Never adapt valid evidence to defective implementation |
| AISE S0 §25 (external parameter gate) | S0 FROZEN | Secrets requested only at exact boundary where required |

### 2.3 Confirmed technical preferences (OWNER-stated, evaluated and decided in S6)

| Preference | Source | S6 decision (see Section 5) |
|---|---|---|
| Drizzle ou Prisma | Charter §10, OWNER S6 §1 | TD-004 — see evaluation |
| Zod | Charter §10, OWNER S6 §1 | TD-008 — accepted |
| TanStack Query | Charter §10, OWNER S6 §1 | TD-006 — see evaluation (only if justified) |
| React Hook Form | Charter §10, OWNER S6 §1 | TD-007 — see evaluation |
| Tailwind CSS | Charter §10, OWNER S6 §1 | TD-010 — accepted |
| shadcn/ui | Charter §10, OWNER S6 §1 | TD-011 — see evaluation |

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
| Public → Admin pages | Authentication required (server-side check) |
| Public → Offer data (non-PUBLISHED) | Server-side status filter; non-PUBLISHED offers return 404 on public URLs |
| Admin mutations | Server Actions with auth check + Zod validation |
| Form input → DB | Server-side Zod validation; client validation is UX-only |
| Description rich content | Server-side sanitization on input + safe rendering on output |
| Secrets → Code | S0 §13 + S0 §25; secrets via environment variables only |
| Preview env → Production DB | Strict isolation via distinct `DATABASE_URL` env vars per Vercel environment |

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

### TD-003 — Authentication architecture

```
TD-003: Authentication Architecture
DECISION AREA:  ADMIN and Fantomas authentication
REQUIREMENTS:   FR-001 (login), FR-002 (logout), FR-003 (back-office denied to public),
                FR-004 (no public registration), NFR-010 (no plaintext password),
                NFR-011 (no password in repo), NFR-012 (session protection),
                NFR-013 (Fantomas credential handling), PERM-003 (back-office restricted),
                Charter §7 (Fantomas), AISE S0 §14/§21
OPTIONS:        Better Auth | Auth.js (NextAuth) | Lightweight custom session-based auth
SELECTED:       Auth.js (NextAuth) with Credentials provider + bcrypt password hashing
                + httpOnly session cookie
RATIONALE:      - Better Auth (newer, less mature ecosystem as of late 2025; smaller
                  community; risk of API churn during V1 development)
                - Auth.js (NextAuth v5): mature, large ecosystem, well-documented,
                  supports Credentials provider for username+password, integrates
                  natively with Next.js App Router middleware for route protection,
                  session via JWT or database strategy. Database strategy with
                  sessions table fits a stateful admin back-office.
                - Custom auth: requires implementing session management, CSRF
                  protection, password hashing, secure cookie flags — fragile and
                  not justified when Auth.js covers all needs.
                Auth.js Credentials provider + bcrypt + httpOnly cookie + database
                session strategy is the simplest mature solution that meets
                NFR-010/011/012 and supports the bootstrap of Fantomas (NFR-013).
CONSEQUENCES:   Sessions table in DB. bcrypt for password hashing (TD-009).
                Auth.js middleware protects /admin/* routes. Fantomas is just another
                user record with a special role flag, bootstrapped at seed time.
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
TD-008: Validation Library
DECISION AREA:  Server-side input validation
REQUIREMENTS:   BR-030 (required fields), BR-080 (URL/email format), OWNER S6 §1 (Zod),
                S5 §11 (server validation is the authority)
SELECTED:       Zod
RATIONALE:      OWNER MANDATED preference (Charter §10, OWNER S6 §1). Zod is the de
                facto standard for TypeScript-first schema validation. Pairs with
                Drizzle (zodSchemas), React Hook Form (zodResolver), and Server
                Actions (parse input server-side).
CONSEQUENCES:   All server-side validation uses Zod. Client-side mirrors via the same
                schemas for UX.
ADR CANDIDATE:  NO (MANDATED)
STATUS:         MANDATED
```

### TD-009 — Password hashing mechanism

```
TD-009: Password Hashing Mechanism
DECISION AREA:  ADMIN and Fantomas password storage
REQUIREMENTS:   NFR-010 (no plaintext password; vetted mechanism)
OPTIONS:        bcrypt | argon2id | scrypt | pbkdf2
SELECTED:       bcrypt (with cost factor ≥ 12)
RATIONALE:      - bcrypt: mature, well-vetted, widely supported in Node.js (bcrypt
                  npm package), adjustable cost factor. Standard choice for
                  server-side password hashing in 2025 for non-edge runtimes.
                - argon2id: winner of PHC, more modern, better against GPU attacks.
                  Requires native binding (argon2 npm package) — may complicate
                  Vercel build. Recommended for high-security needs.
                - scrypt: good but less commonly used in Node ecosystem.
                - pbkdf2: built-in but less recommended than bcrypt/argon2.
                For a small admin team (single-digit admins + 1 Fantomas), bcrypt with
                cost 12 provides adequate security. argon2id is a better long-term
                choice but adds build complexity on Vercel. V1 uses bcrypt; S2 (V2)
                can migrate to argon2id if needed. The decision is reversible because
                passwords can be re-hashed on next login.
CONSEQUENCES:   bcrypt npm package. Cost factor 12. Hash column in users table.
ADR CANDIDATE:  YES (security-relevant)
STATUS:         DECIDED
```

### TD-010 — Styling

```
TD-010: Styling
DECISION AREA:  CSS / styling approach
REQUIREMENTS:   NFR-030 (accessibility), OWNER S6 §1 (Tailwind CSS), OWNER S6 §24
                (simple, sobre, mobile responsive)
SELECTED:       Tailwind CSS
RATIONALE:      OWNER MANDATED. Tailwind provides utility-first styling with strong
                accessibility defaults (focus states, screen-reader classes built-in),
                small production CSS (only used utilities), and good integration with
                shadcn/ui (TD-011). No need for a separate CSS-in-JS library.
CONSEQUENCES:   tailwind.config.ts. No styled-components or emotion.
ADR CANDIDATE:  NO (MANDATED)
STATUS:         MANDATED
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

### TD-013 — Rich text editor for offer description

```
TD-013: Rich Text Editor for Offer Description
DECISION AREA:  How ADMIN enters formatted description (paragraphs, lists, headings,
                links per BR-034)
REQUIREMENTS:   BR-034 (preserve formatting), OWNER S6 §5 (évalue Tiptap mais ne
                l'impose pas si une solution plus simple satisfait S5)
OPTIONS:        Tiptap (rich text, JSON or HTML output) | Markdown editor (react-markdown
                + simple textarea) | Plain textarea with Markdown syntax help
SELECTED:       Tiptap with JSON storage + server-rendered HTML output
RATIONALE:      - Tiptap: headless, framework-agnostic, produces structured JSON (or
                  HTML), supports paragraphs/lists/headings/links out of the box,
                  sanitize-friendly. Mature, maintained, used widely. Provides a
                  WYSIWYG experience that fits "professional formatting" without
                  requiring ADMIN to learn Markdown syntax.
                - Markdown + textarea: simpler but requires ADMIN to know Markdown
                  syntax. Goes against "simplicity of use" priority 1. Renders
                  server-side via a Markdown parser (e.g., remark + rehype-sanitize).
                - Plain textarea: no formatting. Fails BR-034.
                Tiptap is the right balance: WYSIWYG for ADMIN, structured JSON for
                safe storage (no raw HTML in DB), server-side render to HTML via
                Tiptap's HTML renderer + sanitize on output.
                Storage choice: Tiptap JSON (ProseMirror doc) in the description column
                of type jsonb. Server-side, render JSON → HTML via Tiptap's
                generateHTML() + a small sanitizer pass. This avoids storing raw HTML
                (sanitization-on-input is fragile; structured JSON is safer).
CONSEQUENCES:   @tiptap/react + @tiptap/starter-kit + @tiptap/extension-link +
                @tiptap/extension-text-align. Server-side Tiptap HTML renderer for
                output. JSON stored in offers.description as jsonb. No raw HTML in DB.
ADR CANDIDATE:  YES
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

### TD-016 — Public search strategy

```
TD-016: Public Search Strategy
DECISION AREA:  How public text search (title, company, location) is implemented
REQUIREMENTS:   FR-050 (SHOULD — simple text search on title, company, location),
                OWNER S6 §9 (PostgreSQL ILIKE ou full-text si utile, pas d'Elasticsearch)
OPTIONS:        PostgreSQL ILIKE | PostgreSQL full-text search (tsvector + tsquery) |
                Elasticsearch (EXCLUDED per OWNER)
SELECTED:       PostgreSQL ILIKE (case-insensitive LIKE) on title + company + location
                with OR conditions
RATIONALE:      - ILIKE: simplest, no extra index type needed (besides a trigram index
                  if performance requires), works for "contains" semantics directly.
                  For a small editorial portal (single-digit to low-thousands of
                  offers), ILIKE performance is fine. Matches the SHOULD priority of
                  FR-050.
                - Full-text search (tsvector GIN index): more powerful (stemming,
                  ranking, multi-language), but adds complexity (tsvector column,
                  trigger to maintain, query syntax). Overkill for V1.
                - Elasticsearch: excluded per OWNER S6 §9 (no distributed search
                  engine for V1).
                ILIKE with a pg_trgm index (if perf needs it) is the right V1 choice.
                Migration to full-text search is straightforward later if needed.
CONSEQUENCES:   Query: WHERE title ILIKE '%' || $1 || '%' OR company ILIKE '%' || $1
                || '%' OR location ILIKE '%' || $1 || '%'. Add pg_trgm extension +
                GIN index on (title, company, location) if perf profiling requires
                (deferred to S10/S11 if observed need).
ADR CANDIDATE:  NO (implementation detail)
STATUS:         DECIDED
```

### TD-017 — Package manager

```
TD-017: Package Manager
DECISION AREA:  JS package manager and lockfile
REQUIREMENTS:   OWNER S6 §28 (pnpm recommandé)
SELECTED:       pnpm
RATIONALE:      OWNER preference. pnpm is faster, disk-efficient (content-addressed
                store), strict about phantom dependencies, has a deterministic
                lockfile (pnpm-lock.yaml). Works natively with Vercel builds.
CONSEQUENCES:   pnpm-lock.yaml committed. Vercel build setting: package manager = pnpm.
ADR CANDIDATE:  NO (MANDATED)
STATUS:         MANDATED
```

### TD-018 — Database migration strategy

```
TD-018: Database Migration Strategy
DECISION AREA:  Schema migration tooling and process
REQUIREMENTS:   OWNER S6 §14 (migrations versionnées, reproductibles, aucune
                modification manuelle non tracée, distinction schema/seed), TD-004
                (Drizzle)
SELECTED:       Drizzle Kit (drizzle-kit) for schema migrations; separate seed
                scripts (not migrations) for initial data
RATIONALE:      Drizzle Kit is the official Drizzle migration tool. Schema-as-code in
                db/schema.ts. drizzle-kit generate creates versioned SQL migration
                files in db/migrations/. drizzle-kit migrate applies them. Idempotent
                where possible (Drizzle tracks applied migrations in a __drizzle_migrations
                table). Seed scripts are separate (drizzle-kit seed or a custom script)
                and do NOT modify schema.
                Preview environments: each Neon preview branch has its own migration
                state (auto-synced from the branch's DB). Production migrations are
                applied manually after OWNER GO (per AISE S13).
CONSEQUENCES:   db/migrations/ folder with versioned .sql files. migrations meta in
                Drizzle's table. Seed scripts in db/seed/ (separate from migrations).
                Production migration execution: explicit, never automatic (S0 §25
                requires verified target before any write).
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

### TD-020 — Bootstrap of initial ADMIN and Fantomas

```
TD-020: Bootstrap of Initial ADMIN and Fantomas
DECISION AREA:  How the first ADMIN and Fantomas are created without a public
                registration flow
REQUIREMENTS:   FR-004 (no public registration), NFR-013 (Fantomas credential handling),
                PERM-004 (Fantomas capabilities), AISE S0 §14/§21, S0 §13/§25,
                OWNER S6 §15 (idempotent, controlled, reproductible)
SELECTED:       Idempotent seed script (pnpm db:seed) that:
                1. Creates the Fantomas user if it does not exist, with the
                   FANTOMAS_INITIAL_PASSWORD env var (hashed via bcrypt at seed time).
                   Login = "Fantomas". Role = "fantomas". The script is idempotent —
                   if Fantomas already exists, it is not recreated, but a warning is
                   logged. The password is NOT overwritten on subsequent runs (so
                   rotations are preserved).
                2. Optionally creates the initial ADMIN user(s) listed in a
                   config-driven seed file (e.g., db/seed/admins.ts with login + bcrypt
                   hash, NEVER plaintext). This is for V1 bootstrap only; future ADMIN
                   management UI is deferred (DR-050).
                3. The seed script is run manually after migration (NOT automatic).
                   It is the deployment operator's responsibility (or OWNER's) to
                   run `pnpm db:seed` once per environment after the first deployment.
                FANTOMAS_INITIAL_PASSWORD is provided via Vercel env var (Production
                and Preview separately). Per S0 §25, this secret is requested at the
                exact boundary where it is needed (deployment time, not S6/S7 time).
                The seed script hashes it via bcrypt before storing — only the hash
                is persisted in the DB.
RATIONALE:      - Avoids public registration (FR-004).
                - Idempotent: safe to re-run.
                - Fantomas is bootstrapped via env var + seed, satisfying AISE §14
                  (Fantomas as bootstrap principal).
                - The initial ADMIN can be created by Fantomas post-bootstrap via
                  an ADMIN management UI — but V1 defers that UI (DR-050). For V1
                  launch, the initial ADMIN is created via the seed script too.
                - The plaintext password NEVER enters the repository, the database,
                  or the logs. Only the bcrypt hash is stored.
CONSEQUENCES:   db/seed/bootstrap.ts script. Env vars: FANTOMAS_INITIAL_PASSWORD
                (Production + Preview separately). After first production deploy:
                OWNER (or operator) runs `pnpm db:seed` once. The script logs what
                was created and warns if Fantomas already exists (no overwrite).
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
                  Auth.js flow tested in integration.
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
                origins). Combined with SameSite=Lax on the Auth.js session cookie,
                this provides adequate CSRF protection for V1 without custom token
                management.
CONSEQUENCES:   No custom CSRF token. Auth.js session cookie config: sameSite: 'lax',
                secure: true in production, httpOnly: true.
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
    auth.ts                   # Auth.js config + helpers (getSession, requireAdmin)
    db.ts                     # Drizzle client (read DATABASE_URL)
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
| `lib/server/auth` | Auth.js config, session, role checks | db/schema (users table) | Business logic |
| `lib/server/db` | Drizzle client, connection | DATABASE_URL env var | Business logic |
| `lib/server/validation` | Zod schemas | (none) | DB access |
| `lib/server/services/offers` | Offer CRUD, lifecycle transitions, public queries, search | lib/server/db, lib/server/validation, db/schema | Auth, UI |
| `lib/server/services/users` | User queries (login, role) | lib/server/db, db/schema | Offer logic |
| `db/schema` | Drizzle schema definitions | drizzle-orm | Migrations |
| `db/migrations` | SQL migration files | (generated by drizzle-kit) | Schema definitions |
| `db/seed/bootstrap` | Idempotent seed of Fantomas + initial ADMIN | db/schema, lib/server (bcrypt), env var | Routes, UI |
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

| Layer | Choice | Decision ID |
|---|---|---|
| Runtime | Node.js (Vercel serverless) | MANDATED (Vercel) |
| Language | TypeScript (strict) | MANDATED |
| Framework | Next.js (App Router) | MANDATED |
| Database | PostgreSQL on Neon | MANDATED |
| ORM / Query | Drizzle ORM + Drizzle Kit | TD-004 |
| Validation | Zod | TD-008 |
| Auth | Auth.js (NextAuth v5) + Credentials provider | TD-003 |
| Password hashing | bcrypt (cost 12) | TD-009 |
| Forms | React Hook Form + zodResolver | TD-007 |
| Data fetching | Server Components (read) + Server Actions (mutate) | TD-006 |
| Styling | Tailwind CSS | TD-010 |
| UI components | shadcn/ui (copy-paste, Radix-based) | TD-011 |
| Icons | Lucide React | TD-012 |
| Rich text | Tiptap (JSON storage, server-side HTML render) | TD-013 |
| Search | PostgreSQL ILIKE + optional pg_trgm | TD-016 |
| IDs | UUID v4 (PostgreSQL native) | TD-015 |
| Migrations | Drizzle Kit | TD-018 |
| Testing | Vitest + React Testing Library + Playwright | TD-024 |
| Lint/format | ESLint + Prettier + tsc strict | TD-027 |
| Package manager | pnpm | TD-017 |
| CI | GitHub Actions | TD-025 |
| Hosting | Vercel (Production + Preview) | TD-019 |
| Observability | Structured logs + Vercel logs (no Sentry in V1) | TD-026 |

### 7.2 NOT used (with rationale)

| Tech | Why not |
|---|---|
| Prisma | TD-004 — Drizzle simpler, SQL-first, no query engine binary |
| TanStack Query | TD-006 — Server Components + Server Actions cover V1 needs |
| TanStack Table | Not needed — admin list is simple (filter + pagination); a raw HTML table with sorting on URL params suffices for V1. Can be added in V2 if column sorting/pinning becomes valuable. |
| GraphQL | Excluded per OWNER S6 anti-overengineering |
| Separate NestJS backend | Excluded per OWNER S6 §2 |
| Redis / cache layer | No approved performance requirement justifying it (S6 §6) |
| Elasticsearch | Excluded per OWNER S6 §9 |
| Microservices / K8s | Excluded per OWNER S6 anti-overengineering |
| Sentry | Deferred (TD-026) — V1 uses Vercel logs |
| Custom auth | TD-003 — Auth.js covers all needs without fragile custom code |
| Material UI / Chakra | TD-011 — shadcn/ui is simpler and aligned with Tailwind |
| i18n framework | NFR-040 — V1 is French only; a simple messages object suffices |
| Stripe / payment lib | Excluded per Charter §8 |
| Email service (Resend, etc.) | Excluded — V1 has no notifications (OOS-013) |

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
- **Sessions**: Auth.js database session strategy — sessions have an expiry. Expired sessions are pruned by Auth.js on access (no scheduled job — S0 §23). For V1 scale (single-digit admins), this is sufficient.
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
-- For pg_trgm (optional, only if perf requires — see TD-016):
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

`pg_trgm` is optional in V1. Added only if integration tests or production profiling show ILIKE performance issues. Default V1: not added (YAGNI for editorial scale).

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

#### 9.3.2 `users` table

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | uuid | NOT NULL | gen_random_uuid() | Primary key |
| login | text | NOT NULL | — | Unique login identifier (FR-001) |
| password_hash | text | NOT NULL | — | bcrypt hash (TD-009); NEVER plaintext (NFR-010) |
| role | user_role | NOT NULL | 'admin' | Enum: 'admin' | 'fantomas' |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

```sql
CREATE TYPE user_role AS ENUM ('admin', 'fantomas');
```

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (login)` — login is unique (Section 8.2 of S5)
- `CHECK (role IN ('admin', 'fantomas'))` — enforced by enum

**Indexes:**
- `UNIQUE INDEX idx_users_login ON users(login)` — for login lookup (FR-001).

#### 9.3.3 `sessions` table (Auth.js database session strategy)

Auth.js v5 with the database adapter creates this table. The exact schema is defined by the Auth.js Drizzle adapter. Key columns:

| Column | Type | Notes |
|---|---|---|
| id | text | Primary key (session token) |
| expires | timestamptz | Session expiry |
| sessionToken | text | Unique |
| userId | uuid | Foreign key to users(id) |

**Constraints:**
- Foreign key: `sessions.userId → users(id) ON DELETE CASCADE`
- Unique: `sessionToken`

Note: the exact Auth.js adapter schema is what Drizzle will produce; S6 does not modify Auth.js's internal schema.

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

Local database (`users` table, Section 9.3.2). No external identity provider in V1.

### 12.2 Credential and session model

- **Credentials**: login + password (bcrypt-hashed, TD-009).
- **Session strategy**: database (Auth.js Drizzle adapter persists sessions in the `sessions` table).
- **Session cookie**: `next-auth.session-token`, httpOnly, secure (production), SameSite=Lax.
- **Session lifetime**: 30 days (default Auth.js; can be tuned).
- **Session expiry pruning**: lazy — on each access, Auth.js checks the `expires` column and deletes expired sessions. No cron job (S0 §23).

### 12.3 Login flow (FR-001)

```
Client → POST (form action) → Server Action `loginAction`
  → Zod validates input ({ login, password })
  → Auth.js `authorize` callback queries users by login
  → If user found: bcrypt.compare(password, user.password_hash)
    → If match: return user (Auth.js creates session, sets cookie)
    → If no match: return null (FR-001-ERR: do not disclose which field is wrong)
  → If user not found: return null (same response — no information leak)
  → Server Action returns { ok: true } or { ok: false, error: 'Identifiants invalides' }
  → On success: redirect to /admin/offres
  → On failure: re-render login page with error
```

### 12.4 Logout flow (FR-002)

```
Client → POST (form action) → Server Action `logoutAction`
  → Auth.js `signOut()` invalidates session in DB and clears cookie
  → Redirect to /admin/login
```

### 12.5 Bootstrap of initial users (TD-020)

```
After first production deploy:
  OWNER/operator runs `pnpm db:seed` (or `pnpm db:bootstrap`)
    → seed/bootstrap.ts:
      → Reads FANTOMAS_INITIAL_PASSWORD env var
      → If no user with login='Fantomas':
        → bcrypt.hash(FANTOMAS_INITIAL_PASSWORD, 12) → password_hash
        → INSERT INTO users (login='Fantomas', password_hash, role='fantomas')
        → Log "Fantomas principal created"
      → Else: log "Fantomas already exists — not recreated"
      → For each admin in db/seed/admins.ts (a config file):
        → If no user with that login:
          → bcrypt.hash(admin.password_from_env_var, 12)
          → INSERT
      → Log summary
```

The seed script is idempotent. Re-running it does NOT overwrite existing users (so password rotations are preserved). It does NOT log passwords.

### 12.6 Password reset

OUT OF SCOPE V1 (DR-050). For V1, password reset for an ADMIN is done by Fantomas directly modifying the DB (via a break-glass operation) or by re-running the seed script for that user (which would not overwrite if the user exists — so the operator must first delete the user, then re-seed). This is acceptable for V1's small admin team. A self-service reset flow is deferred to V2.

---

## 13. Authorization

### 13.1 Principal model

| Principal | role enum value | Capabilities |
|---|---|---|
| ADMIN | `'admin'` | All offer lifecycle operations (PERM-002); no Fantomas-specific capabilities |
| FANTOMAS | `'fantomas'` | All ADMIN capabilities + Fantomas-specific bootstrap / recovery / break-glass (AISE §14, §21) |

### 13.2 Authorization abstraction

To avoid duplicating auth checks across Server Actions, S6 defines a single reusable helper in `lib/server/auth.ts`:

```typescript
// Conceptual signature (not implementation code in S6):
type Principal = {
  id: string;
  login: string;
  role: 'admin' | 'fantomas';
};

// Returns the current principal or null if unauthenticated.
async function getPrincipal(): Promise<Principal | null>;

// Throws (or returns a redirect) if not authenticated.
async function requireAdmin(): Promise<Principal>;

// Returns true if the principal has a given capability.
function can(principal: Principal, capability: Capability): boolean;
```

The `can` function is the authorization abstraction. Capabilities are:

```typescript
type Capability =
  | 'offer:create' | 'offer:edit' | 'offer:save'
  | 'offer:publish' | 'offer:suspend' | 'offer:republish' | 'offer:archive'
  | 'admin:login'  // access back-office
  | 'system:bootstrap'  // Fantomas-only
  | 'system:recovery'; // Fantomas-only
```

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
  if (principal.role === 'fantomas') {
    return [...ADMIN_CAPABILITIES, ...FANTOMAS_EXTRA_CAPABILITIES].includes(capability);
  }
  return ADMIN_CAPABILITIES.includes(capability);
}
```

This satisfies AISE §21 exactly: every ADMIN (SUPER_ADMIN in future) capability is also authorized to Fantomas; Fantomas has additional capabilities; ADMIN does not inherit Fantomas-only capabilities.

### 13.4 Server-side enforcement points

- **Middleware** (`middleware.ts`): protects `/admin/*` routes. If no valid session → redirect to `/admin/login`. This is the first line of defense.
- **Layout guard** (`app/admin/layout.tsx`): double-checks session via `getPrincipal()`. If null → redirect (defense in depth).
- **Each Server Action**: calls `requireAdmin()` first. For Fantomas-only actions (none in V1's normal UI, but the bootstrap script uses Fantomas), the action would call `can(principal, 'system:bootstrap')`.
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
| Public → Admin | Auth.js middleware + layout guard |
| Public → non-PUBLISHED offer data | Server-side filter `WHERE status = 'PUBLISHED'` + 404 on non-PUBLISHED detail |
| Admin mutations | Server Actions with `requireAdmin()` + Zod validation |
| Form input → DB | Zod server-side (TD-008); client validation is UX-only |
| Rich content (description) | Tiptap JSON stored (no raw HTML in DB); rendered server-side via Tiptap's HTML generator (no user-supplied HTML is rendered directly) |
| Secrets → Code | S0 §13: no secrets in repo; S0 §25: secrets via Vercel env vars |
| Preview → Production DB | TD-019: distinct DATABASE_URL per Vercel environment |

### 14.2 Authentication and authorization

- Covered in Sections 12 and 13.
- Password storage: bcrypt (TD-009), never plaintext (NFR-010).
- Session: httpOnly, secure, SameSite=Lax (TD-028).

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
| `AUTH_SECRET` | Vercel env var | Regenerate; update Vercel env var; rotate sessions (Auth.js invalidates old sessions on secret change) |
| `FANTOMAS_INITIAL_PASSWORD` | Vercel env var (Production only — set once at first deploy) | Once bootstrapped, the bcrypt hash is in the DB. Rotation = `bcrypt.hash(newPassword)` via a recovery script or V2 admin UI. The env var can be removed from Vercel after first seed. |
| Initial ADMIN passwords | Same pattern — env vars at first deploy, hash stored, env var removed after seed | Same |

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
- Sessions expire per Auth.js default; expired sessions are pruned lazily.

### 14.10 Rate limiting

- V1 has no public submission endpoint (no public form). Login is the only unauthenticated mutation.
- **Login rate limiting**: a simple in-memory or DB-based rate limiter (max N failed attempts per IP per minute) is SHOULD-priority for V1. Implementation: a small `login_attempts` table or in-memory cache (cleared on server restart — acceptable). If disproportionate, defer to V2.
- **No rate limiting on public reads** — public reads are cached via Next.js ISR / on-demand revalidation; abuse is handled at the Vercel edge (DDoS protection built into Vercel).

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
| Auth failure (invalid credentials) | bcrypt.compare returns false | FR-001-ERR: generic "Identifiants invalides" (no leak of which field is wrong). |
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

- Vercel serverless functions are stateless; restarts are transparent. Auth.js sessions are in the DB, so they survive restarts.
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
- **Auth**: in non-auth-focused tests, mock the session (set the principal directly). In auth-focused tests (login, logout, capability checks), use the real Auth.js flow.
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

### 20.1 Environments (per TD-019)

| Environment | Purpose | Database | Vercel env | Secrets |
|---|---|---|---|---|
| Local dev | Developer's machine | Local PostgreSQL OR developer's Neon branch | `.env.local` (not committed) | Developer-local DATABASE_URL, AUTH_SECRET, FANTOMAS_INITIAL_PASSWORD |
| Preview | Per-PR deployment | Neon preview branch (auto-provisioned) | Vercel Preview env vars | Preview DATABASE_URL, AUTH_SECRET, FANTOMAS_INITIAL_PASSWORD (test value) |
| Production | Live site | Neon main branch | Vercel Production env vars | Production DATABASE_URL, AUTH_SECRET, FANTOMAS_INITIAL_PASSWORD (real value, set once at first deploy) |

### 20.2 Environment variables

| Variable | Scope | Example value | Notes |
|---|---|---|---|
| `DATABASE_URL` | All | `postgresql://...neon.tech/db?sslmode=require` | Neon connection string |
| `AUTH_SECRET` | All | (random 32+ char string) | Used by Auth.js to sign sessions |
| `AUTH_TRUST_HOST` | All | `true` | Required by Auth.js on Vercel |
| `FANTOMAS_INITIAL_PASSWORD` | All (set once on first deploy) | (OWNER-provided value) | Used by seed script; can be removed after first seed |
| `NEXT_PUBLIC_SITE_URL` | All | `https://jourdain-emploi.example.com` | For sitemap/SEO |
| `INITIAL_ADMIN_LOGIN` | Optional (first deploy only) | `admin1` | Used by seed script for first ADMIN |
| `INITIAL_ADMIN_PASSWORD` | Optional (first deploy only) | (value) | Used by seed script for first ADMIN |

### 20.3 `.env.example` (committed placeholder — no real values)

```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
AUTH_SECRET=generate-a-32+-char-random-string
AUTH_TRUST_HOST=true
FANTOMAS_INITIAL_PASSWORD=set-at-first-deploy-then-rotate
NEXT_PUBLIC_SITE_URL=https://example.com
INITIAL_ADMIN_LOGIN=admin1
INITIAL_ADMIN_PASSWORD=set-at-first-deploy-then-rotate
```

This file is committed with placeholder values only (no real secrets — S0 §13). Real values are set in Vercel env vars.

### 20.4 Target verification (S0 §25)

Before any write to Production:
- Verify the target environment (Vercel Production env var `VERCEL_ENV === 'production'`).
- Verify the database is the Neon main branch (check `DATABASE_URL` host against the production Neon hostname).
- If target not verified → STOP (no write).

This is enforced in the seed script and in any future production-only mutation.

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
| FR-001 | Admin login | TD-003 (Auth.js Credentials), Section 12.3 | E2E step 1; integration test (loginAction) |
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
| NFR-010 | bcrypt password hashing (TD-009) | Unit test (hash format) + DB inspection |
| NFR-011 | No secret in repo; S0 §13 + §25 | Code review (grep for secret patterns; .env.example has placeholders only) |
| NFR-012 | httpOnly + secure + SameSite=Lax + Auth.js | Component test + browser DevTools inspection |
| NFR-013 | Fantomas bootstrap via env var + seed (TD-020) | Integration test (seed script creates Fantomas with hashed password) |
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
| Auth.js v5 API churn | Auth.js v5 was stabilizing in 2024-2025; minor API changes possible | Low-Medium (build breaks; quick fix) | MITIGATE: pin Auth.js version; CI catches breaks | S6 |
| Drizzle migration failure on production | Migration may fail mid-way (rare with Drizzle) | Medium (production deploy blocked; manual recovery needed) | MITIGATE: enable Drizzle down migrations; test migrations on Preview first | S6 + operator |
| Neon free tier limits | Free tier has compute/storage limits; V1 may hit them if volumetry grows unexpectedly | Low (warning before hard limit) | MONITOR: Vercel + Neon dashboards show usage. Upgrade tier if needed. | OWNER |
| Tiptap rendering security (if a future extension allows raw HTML) | Currently Tiptap JSON → HTML is safe (no raw HTML); a future extension could introduce risk | Low (V1 has no such extension) | MITIGATE: do not enable `@tiptap/extension-html` or raw HTML paste in V1. Code review in S10. | S6 + S10 |
| Vercel build failure due to native bcrypt dep | bcrypt npm package uses a native binding; build may fail on Vercel's build environment | Low (rare; bcrypt has prebuilt binaries for most platforms) | MITIGATE: if bcrypt fails, switch to `bcryptjs` (pure JS, slower but no native dep). Decision deferred to S10 if the issue arises. | S6 + S10 |
| Public offer URL not SEO-optimized (uses UUID) | /offres/{uuid} is not keyword-rich | Low (Charter §13 — no quantitative SEO target) | ACCEPT for V1; revisit in V2 if SEO becomes a priority | OWNER |

---

## 26. Open Technical Decisions

S6 cannot close with blocking architecture ambiguity. The following items are explicitly NON-BLOCKING (can be resolved during S10 execution):

| Open question | Why it matters | Options | Blocking? | Resolution |
|---|---|---|---|---|
| bcrypt vs bcryptjs (if native build fails on Vercel) | Build reliability | bcrypt (native, faster) / bcryptjs (pure JS, slower, no native dep) | NO | S10: try bcrypt first; fall back to bcryptjs if Vercel build fails |
| pg_trgm index creation timing | Public/admin search perf | Create in initial migration / add later if needed | NO | S10: defer; add via a new migration if integration tests or production profiling shows ILIKE > 100ms |
| Public search route handler vs URL search params | Code organization | URL search params (`/offres?q=`) / route handler returning JSON | NO | S10: default to URL search params (server-rendered); add route handler only if a debounced Client Component search is implemented |
| Login rate limiting implementation | Security (brute-force protection) | DB table / in-memory / Vercel KV (paid) | NO | S10: implement a simple in-memory limiter (cleared on restart, acceptable for V1) or defer to V2 |
| Drizzle down migrations | Rollback safety | Enable / disable | NO | S10: enable (`drizzle-kit generate --journal` produces both up and down) for safety |

**BLOCKING technical decisions: 0.**

S6 can close. All material architecture decisions are DECIDED. The non-blocking items above can be resolved during S10 implementation without re-opening S6.

---

## 27. ADR Candidates for S7

The following S6 decisions are structuring enough to warrant durable ADR treatment in S7 (per S6 §33 handoff):

| TD ID | Decision | Why ADR-worthy |
|---|---|---|
| TD-001 | Modular monolith Next.js full-stack | Architecture-defining; bounds future scope |
| TD-003 | Auth.js Credentials + bcrypt + database session | Security-relevant; hard to change later |
| TD-004 | Drizzle ORM | Cross-cutting; affects all DB code |
| TD-006 | Server Components + Server Actions (no TanStack Query) | Architectural pattern; affects all data flows |
| TD-009 | bcrypt for password hashing | Security-relevant |
| TD-013 | Tiptap JSON storage + server-side HTML render | Affects description schema, editor, rendering, sanitization |
| TD-014 | /offres/{id} URL strategy | Public-facing; affects SEO and external links |
| TD-018 | Drizzle Kit migrations (with down migrations enabled) | Affects all schema evolution |
| TD-019 | Vercel Production + Preview with Neon main + preview branches | Security-critical (Preview/Production isolation) |
| TD-020 | Bootstrap of Fantomas and initial ADMIN via idempotent seed + env vars | Security-critical; AISE-mandated |
| TD-021 | Free text for Entreprises/Secteurs/Catégories (no CRUD modules) | Bounds future scope |
| TD-024 | Testing architecture (Vitest + RTL + Playwright, real DB in integration) | Affects all tests |
| TD-028 | CSRF via Next.js Server Actions origin check + SameSite=Lax | Security-relevant |

The remaining TDs (TD-002, TD-005, TD-007, TD-008, TD-010, TD-011, TD-012, TD-015, TD-016, TD-017, TD-022, TD-023, TD-025, TD-026, TD-027, TD-029) are either MANDATED (not choices) or implementation details that don't need durable ADR treatment.

---

## 28. S7 Handoff

S6 hands off to S7 (Project Manifest + ADR):

- **APPROVED TECHNICAL_SPECIFICATION** (this document, once OWNER approves)
- **TECHNICAL DECISION LIST**: TD-001 through TD-029 (Section 5 + Section 27)
- **ADR CANDIDATES**: 13 ADRs (Section 27)
- **SELECTED STACK**: Section 7
- **ARCHITECTURAL BOUNDARIES**: Section 6 (module map + dependency direction rule)
- **CANONICAL TECHNICAL CONSTRAINTS**:
  - Modular monolith (no microservices / no backend séparé)
  - PostgreSQL on Neon (MANDATED)
  - Vercel Production + Preview (MANDATED)
  - Drizzle ORM (TD-004)
  - Auth.js (TD-003)
  - bcrypt (TD-009)
  - Tiptap JSON storage (TD-013)
  - /offres/{id} URLs (TD-014)
  - No public API, no notifications, no automatic expiration, no physical deletion, no multi-tenant, no multilingual, no complex RBAC (all per S5)
  - AISE S0 invariants: §13, §14/§21, §23, §24, §25

S6 does NOT create ADR files. S7 creates the durable ADR files based on this handoff.

---

## 29. Approval / Baseline Status

| Field | Value |
|---|---|
| Document status | DRAFT — PENDING OWNER APPROVAL |
| Charter reference | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Product requirements reference | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| S6 draft date | 2026-09-14 |
| S6 OWNER approval | PENDING |
| S6 closure (S6 CLOSED / PASS) | PENDING — requires OWNER approval |
| Next recommended component | S7 — Project Manifest + ADR |

Per AISE S6 §30, the baseline is NOT valid until OWNER explicitly approves it. OWNER's absence of objection is NOT approval — explicit acknowledgment is required.

### 29.1 Quality gate self-check (per S6 §34)

| Check | Result |
|---|---|
| Blocking product ambiguities | 0 (S5 baseline approved with 0 blocking) |
| Blocking technical decisions | 0 (Section 26) |
| Unaddressed critical S5 requirements | 0 (Section 24 — every MUST mapped) |
| S6 decisions contradicting S5 | 0 (no S5 requirement altered; all decisions preserve S5 semantics) |
| Unjustified major technical complexity | 0 (modular monolith, single DB, no cache, no async infra, no external API — all per OWNER S6 anti-overengineering) |
| Mandated constraints ignored | 0 (all MANDATED constraints applied: React, Next.js, TS, App Router, Vercel, Neon, Production/Preview isolation, pnpm, Tailwind, Zod) |
| Critical NFRs without realization | 0 (NFR-001 perf, NFR-010/011/012/013 security, NFR-030 accessibility, NFR-040 French, NFR-050 audit, NFR-060 integrity — all realized, Section 24.5) |
| Critical boundaries without verification | 0 (auth boundary, public visibility boundary, secret boundary, Preview/Production boundary — all have verification in Section 24) |
| Major decisions without rationale | 0 (every TD-NNN has rationale linked to requirement or OWNER decision) |

**Verdict: QUALITY GATE PASS. S6 is ready for OWNER_REVIEW.**

### 29.2 Owner approval summary

When presenting to OWNER for approval, S6 summarizes:

- **Architecture**: Modular monolith Next.js full-stack (TD-001). Single app, single DB, no microservices, no cache, no external API.
- **Major stack choices**: Drizzle ORM (TD-004), Auth.js + bcrypt (TD-003, TD-009), Tiptap JSON (TD-013), Tailwind + shadcn/ui (TD-010, TD-011), pnpm (TD-017), Vitest + RTL + Playwright (TD-024).
- **Data design**: 3 tables (offers, users, sessions) per Section 9. Free text for Entreprises/Secteurs/Catégories (TD-021). UUID ids (TD-015). 4-state enum for offer status.
- **Integration model**: No external integration in V1 (INT-001).
- **Auth/security**: Auth.js Credentials + bcrypt + database session; Fantomas via idempotent seed + env var; can() capability abstraction per AISE §21.
- **Deployment**: Vercel Production + Preview with Neon main + preview branches (TD-019). No Docker/K8s.
- **Testing**: Vitest (unit + component + integration with real DB) + Playwright (E2E critical journey per OWNER S6 §21).
- **Critical NFR realization**: NFR-001 (Server Components + partial index + ISR), NFR-010/011/012/013 (auth + secret handling), NFR-030 (semantic HTML + axe-core), NFR-040 (French only), NFR-050 (timestamps), NFR-060 (status transitions preserve content).
- **Material risks**: 8 risks identified (Section 25) — all MITIGATE/ACCEPT/MONITOR with concrete responses.
- **Trade-offs**: Prisma vs Drizzle (chose Drizzle); Better Auth vs Auth.js (chose Auth.js); TanStack Query vs Server Actions (chose Server Actions); Tiptap vs Markdown (chose Tiptap); URL strategy (chose /offres/{id} over slug-based).
- **Blocking questions**: 0.
- **ADR candidates**: 13 (Section 27).

S6 is ready for OWNER approval. S7 has NOT started.
