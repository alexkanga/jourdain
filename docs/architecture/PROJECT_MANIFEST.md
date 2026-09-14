# PROJECT MANIFEST — JOURDAIN EMPLOI V1

**Status:** OWNER APPROVED — S7 CLOSED / PASS
**Date:** 2026-09-15 (created), 2026-09-15 (OWNER APPROVED)
**Project:** JOURDAIN EMPLOI V1
**Canonical repository:** `github.com/alexkanga/jourdain`

---

## 1. Manifest Status

| Field | Value |
|---|---|
| Project | JOURDAIN EMPLOI |
| Version | V1 |
| Status | OWNER APPROVED — S7 CLOSED / PASS |
| Source Charter | `docs/planning/PROJECT_CHARTER.md` — APPROVED at `fa377c1` (2026-09-13) |
| Source Product Requirements | `docs/product/PRODUCT_REQUIREMENTS.md` — APPROVED at `9ec4a08` (2026-09-14) |
| Source Technical Specification | `docs/architecture/TECHNICAL_SPECIFICATION.md` — APPROVED at `7c85323` (2026-09-15) |
| S6 TD count | 31 (30 DECIDED + 1 MANDATED) |
| ADR count | 10 |
| Implementation status | NOT STARTED |

This manifest is governed by AISE protocol S7 (`docs/engineering/AISE_PROJECT_MANIFEST_ADR.md`). It is a concise canonical technical reference — NOT the full Technical Specification. Detail lives in S6; rationale lives in ADRs; the current technical baseline lives here.

---

## 2. Architecture Baseline

**Architecture:** Modular monolith Next.js full-stack. APPROVED.

- One application serving both public and admin.
- One PostgreSQL database.
- No microservices, no separate backend, no GraphQL, no Redis, no Kafka, no event bus, no Elasticsearch, no distributed architecture.
- Any evolution toward these technologies requires a new explicit architectural decision and OWNER authorization.

**ADR:** ADR-0001

---

## 3. Canonical Technology Stack

| Layer | Choice | Status | Source |
|---|---|---|---|
| Runtime | Node.js (Vercel serverless) | MANDATED | Charter §10 |
| Language | TypeScript (strict) | MANDATED | Charter §10 |
| Framework | Next.js (App Router) | MANDATED | Charter §10 |
| Database | PostgreSQL on Neon | MANDATED | Charter §10 |
| Neon driver | drizzle-orm/neon-http (HTTP-based) | APPROVED | TD-030 |
| ORM | Drizzle ORM + Drizzle Kit | APPROVED | TD-004 |
| Validation | Zod | APPROVED | TD-008 |
| Auth | Better Auth (Username plugin + Admin plugin + emailAndPassword, database sessions, database rate limiting) | APPROVED | TD-003 |
| Password hashing | scrypt via Better Auth default | APPROVED | TD-009 |
| Forms | React Hook Form + zodResolver | APPROVED | TD-007 |
| Data access | Server Components (read) + Server Actions (mutate); no TanStack Query | APPROVED | TD-006 |
| Styling | Tailwind CSS | APPROVED | TD-010 |
| UI components | shadcn/ui (selective adoption) | APPROVED | TD-011 |
| Icons | Lucide React | APPROVED | TD-012 |
| Rich text | Tiptap (JSON/JSONB storage, React server-side renderer) | APPROVED | TD-013 |
| Search | PostgreSQL ILIKE via Server Component + searchParams | APPROVED | TD-016 |
| IDs | UUID v4 (PostgreSQL native) | APPROVED | TD-015 |
| Package manager | pnpm | APPROVED | TD-017 |
| CI | GitHub Actions | APPROVED | TD-025 |
| Hosting | Vercel (Production + Preview) | MANDATED | Charter §10, TD-019 |
| Observability | Structured server logs + Vercel logs; no Sentry in V1 | APPROVED | TD-026 |

---

## 4. System / Module Boundaries

```
app/                          Next.js App Router routes
  (public)/                   Public route group (no auth) — root = offer list
  admin/                      Admin route group (auth required)
components/                   React components (ui/, public/, admin/)
lib/server/                   Server-only code (auth/, db, validation/, services/)
db/                           Drizzle schema, migrations, bootstrap
tests/                        Vitest + Playwright tests
messages/                     French UI strings
```

**Dependency direction:** `app/ → lib/server/services → lib/server/db → db/schema`. Client components never import from `lib/server/*`. Detail: S6 §6.

---

## 5. Data / Persistence Baseline

- **System of record:** PostgreSQL on Neon (single database).
- **Consistency model:** Strong (PostgreSQL default). No distributed transactions.
- **Primary entity:** Offer (jobs table). Detail: S6 §9.3.1.
- **Auth tables:** Managed by Better Auth Drizzle adapter (user, session, account, verification, rate-limit). Detail: S6 §9.3.2.
- **Data model principles:** company, sector, category are free-text columns on the offers table — no separate CRUD modules in V1. No over-normalization.
- **Offer lifecycle:** DRAFT → PUBLISHED → SUSPENDED → ARCHIVED (terminal). Only PUBLISHED is public. No automatic expiration.
- **Retention:** Archived offers retained indefinitely. No physical deletion in V1.

**ADRs:** ADR-0002 (persistence stack), ADR-0007 (migrations), ADR-0009 (offer URL).

---

## 6. Identity / Authorization Baseline

### Authentication

- **Library:** Better Auth with Username plugin + Admin plugin + emailAndPassword.
- **Daily login:** username + password (NOT email). Fantomas logs in as "Fantomas".
- **Public sign-up:** DISABLED (`disableSignUp: true`). Users created only via bootstrap.
- **Sessions:** database-backed (session table managed by Better Auth).
- **Password hashing:** scrypt via Better Auth (no bcrypt dependency).
- **Rate limiting:** Better Auth integrated rate limiter, database storage on Neon.

**ADR:** ADR-0003

### Authorization (business)

- **Business principal field:** `principalType` (enum: 'ADMIN' | 'FANTOMAS') — the JOURDAIN EMPLOI source of truth for authorization.
- **Better Auth `role` field:** reserved for Admin plugin internals; NOT used for business authorization.
- **Authorization layer:** `can(principal, capability)` / `requireCapability(capability)` in `lib/server/auth/authorization.ts` — INDEPENDENT of Better Auth. Reads `principalType`, not `role`.
- **Fantomas invariant (AISE §14/§21):** Fantomas inherits ALL ADMIN capabilities PLUS Fantomas-only capabilities (system:bootstrap, system:recovery). ADMIN does NOT inherit Fantomas-only. A future SUPER_ADMIN (if added in V2) must also have all its capabilities accessible to Fantomas.

**ADR:** ADR-0004

### Bootstrap

- **Mechanism:** idempotent `db/bootstrap/bootstrap.ts` script calling `auth.api.createUser()` (Better Auth's supported server-side user creation, authorized by the Admin plugin).
- **Bootstrap ≠ seed:** bootstrap creates system principals (Fantomas + initial ADMIN); seed (separate, optional, dev-only) creates demo data. Never mixed.
- **No manual password hash INSERT.** Better Auth handles hashing internally.
- **Env vars:** `FANTOMAS_INITIAL_PASSWORD`, `INITIAL_ADMIN_LOGIN`, `INITIAL_ADMIN_PASSWORD` — set at first deploy, removed after bootstrap.

---

## 7. Interface / Integration Baseline

- **No external integration in V1** (S5 INT-001).
- **No public API.** Internal Next.js endpoints (if any) are implementation details, not a product API.
- **Public routes:** `/` (offer list), `/offres/{id}` (offer detail). Server-rendered.
- **Admin routes:** `/admin/*` (protected by Better Auth middleware + `requireCapability()`).

---

## 8. Runtime / Environment Baseline

| Environment | Database | Purpose |
|---|---|---|
| Local dev | Local PostgreSQL or developer-specific Neon branch | Development |
| Preview | Neon preview branch (auto-provisioned per PR) | Vercel Preview deployment |
| Production | Neon main branch (dedicated, protected) | Live site |

**Critical invariant:** Production database ≠ Preview database. No Vercel Preview deployment writes to Production. Target verification required before any Production write (S0 §25).

**ADR:** ADR-0006

---

## 9. Deployment Baseline

- **Hosting:** Vercel (MANDATED). Next.js App Router native deployment.
- **Migration execution:** `drizzle-kit migrate` applied manually by operator before production promotion. Never `drizzle-kit push` against Production. Forward corrective migrations preferred over automatic down migrations.
- **Rollback:** Vercel instant rollback to previous deployment + Neon PITR for data.
- **CI:** GitHub Actions — typecheck, lint, tests, build on every PR; E2E on main + opt-in via label on PR.

**ADRs:** ADR-0006 (environment isolation), ADR-0007 (migration strategy).

---

## 10. Build / Verification Baseline

| Layer | Tool | What it proves |
|---|---|---|
| Unit/logic | Vitest | Pure functions, Zod schemas, capability checks |
| Component | React Testing Library + Vitest | UI components in isolation |
| Integration | Vitest + real Neon preview branch | Server Actions end-to-end against real DB (NO DB mocking) |
| E2E | Playwright | Critical user journey: admin login → create → publish → public visible → suspend → republish → archive |

**Critical E2E scenario** (per OWNER S6 §21): 15-step journey covering the full offer lifecycle + public visibility transitions.

**ADR:** ADR-0008

---

## 11. Technical Constraints

### MANDATED (Charter §10 — not S6 optimization choices)

- React, Next.js, TypeScript, Next.js App Router, Vercel, PostgreSQL Neon.
- Production environment separated from Preview.
- No microservices / K8s / Kafka / ES / Redis / event bus without demonstrated need.

### FROZEN (AISE S0)

- §13: No secrets in repository files.
- §14/§21: Fantomas principal semantics (inheritance + extra capabilities).
- §23: Zero scheduled work (no cron, no background monitoring without OWNER authorization).
- §24: Contract preservation (never adapt valid evidence to defective implementation).
- §25: External parameter gate (secrets requested only at exact boundary where required).

### Anti-overengineering invariant

The V1 privileges the simplest solution satisfying approved requirements. No generic abstraction before real need. No ceremonial repository/service pattern without demonstrated value. No dependency added "just in case". No distributed system. No excessive normalization.

---

## 12. ADR Index

| ADR ID | Title | Status | Source TD | File |
|---|---|---|---|---|
| ADR-0001 | Modular Monolith Next.js Full-Stack | ACCEPTED | TD-001 | `adr/ADR-0001-modular-monolith.md` |
| ADR-0002 | Persistence Stack — PostgreSQL Neon + Drizzle + neon-http | ACCEPTED | TD-002, TD-004, TD-030 | `adr/ADR-0002-persistence-stack.md` |
| ADR-0003 | Authentication — Better Auth + Username + Admin + scrypt + rate limiting | ACCEPTED | TD-003, TD-009, TD-031 | `adr/ADR-0003-authentication.md` |
| ADR-0004 | Business Authorization — principalType + can()/requireCapability() + Fantomas hierarchy | ACCEPTED | TD-003, PERM-004, AISE §14/§21 | `adr/ADR-0004-business-authorization.md` |
| ADR-0005 | Rich Text — Tiptap JSON/JSONB + safe server rendering | ACCEPTED | TD-013 | `adr/ADR-0005-rich-text.md` |
| ADR-0006 | Database Environment Isolation — Production / Preview / Local | ACCEPTED | TD-019 | `adr/ADR-0006-environment-isolation.md` |
| ADR-0007 | Migration Strategy — Drizzle Kit + forward corrective doctrine | ACCEPTED | TD-018 | `adr/ADR-0007-migration-strategy.md` |
| ADR-0008 | Testing Strategy — Vitest + RTL + Playwright, real DB in integration | ACCEPTED | TD-024 | `adr/ADR-0008-testing-strategy.md` |
| ADR-0009 | Offer Public Identity — UUID v4 + /offres/{id} | ACCEPTED | TD-014, TD-015 | `adr/ADR-0009-offer-url.md` |
| ADR-0010 | Search — PostgreSQL ILIKE + searchParams, no Elasticsearch/API | ACCEPTED | TD-016 | `adr/ADR-0010-search.md` |

---

## 13. Decision Governance

Structural canonical decisions recorded in this manifest and in accepted ADRs MUST NOT be silently replaced during S8/S9/S10. The following changes require an explicit architectural decision and, when AISE requires, OWNER authorization:

- Drizzle → Prisma (or any ORM change)
- Better Auth → Auth.js (or any auth library change)
- Neon → another database (or any persistence change)
- Monolith → microservices (or any architecture style change)
- `principalType` → Better Auth `role` as business authorization source
- Tiptap JSONB → raw HTML as canonical storage
- neon-http → another driver binding

A Work Package (S9) or implementation (S10) that silently modifies the approved architecture is a contract violation (S0 §24).

---

## 14. Known Non-Blocking Technical Items

All 5 previously-open items are CLOSED in S6 (per OWNER revision §7). No non-blocking technical items remain open. S10 implements the approved architecture; S10 does NOT re-choose architecture.

---

## 15. Canonical References

| Document | Path | Approved at | Commit |
|---|---|---|---|
| Project Charter (S4) | `docs/planning/PROJECT_CHARTER.md` | 2026-09-13 | `fa377c1` |
| Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` | 2026-09-14 | `9ec4a08` |
| Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` | 2026-09-15 | `7c85323` |
| Project State | `docs/planning/PROJECT_STATE.md` | (living) | — |
| AISE Manifest | `docs/engineering/AISE_MANIFEST.md` | S3 | `2991df5` |
| ADRs | `docs/architecture/adr/` | S7 | (this commit) |

---

## 16. Implementation Status

| Component | Approved | Implemented |
|---|---|---|
| Architecture (modular monolith) | YES | NOT STARTED |
| PostgreSQL Neon + Drizzle | YES | NOT STARTED |
| Better Auth | YES | NOT STARTED |
| Authorization (can/requireCapability) | YES | NOT STARTED |
| Tiptap rich text | YES | NOT STARTED |
| Public offer list + detail | YES | NOT STARTED |
| Admin CRUD + lifecycle | YES | NOT STARTED |
| Bootstrap (Fantomas + initial ADMIN) | YES | NOT STARTED |
| CI pipeline | YES | NOT STARTED |
| Testing (Vitest + Playwright) | YES | NOT STARTED |
| Vercel deployment | YES | NOT STARTED |

**Implementation has NOT started.** S8 (roadmap), S9 (work packages), and S10 (implementation) have not started. S7 records approved design only.
