# JOURDAIN EMPLOI V1 — RELEASE RECORD

## Release Identity

| Field | Value |
|---|---|
| Application | JOURDAIN EMPLOI |
| Organization | Église Méthodiste de Côte d'Ivoire |
| Release | v1.0.0 |
| Release status | PRODUCTION |
| Production URL | https://jourdain-three.vercel.app |
| Release date | 2026-09-19 |

---

## Production Baseline

Validated application baseline:

```
eac879f9efb6092db43da42888b32dafc2f37a22
```

Later commits included in the final tag contain documentation, database
recovery dossier, and AISE v0.4 DCD doctrine material only. No
application behavior changed after the validated Production baseline.

---

## Public V1 Scope

- Published job listing portal
- Search by title, company, location
- Server-side pagination (12 offers per page)
- Offer detail page with safe rich-text rendering (Tiptap)
- Methodist responsive UI (Methodist green/gold design system)
- SEO metadata, sitemap.xml, robots.txt
- Official Methodist church logo
- Public header + footer with institutional identity

---

## Administration V1 Scope

- Secure admin login (Better Auth for DB-backed users + independent
  Fantomas break-glass)
- Offer creation and editing
- Offer lifecycle: DRAFT → PUBLISHED → SUSPENDED → ARCHIVED
- Restore archived offers (SUPER_ADMIN and FANTOMAS only)
- User management for authorized principals (SUPER_ADMIN and FANTOMAS)
- Responsive admin UI with sidebar navigation
- Role-based UI visibility and server-side authorization

---

## Authorization

### ADMIN

- Standard offer administration (create, edit, publish, suspend, republish, archive)
- No Users administration
- No Restore capability

### SUPER_ADMIN

- Inherits all ADMIN capabilities
- Users administration (list, create, update, delete)
- Restore capability (offer:restore)
- admin1 is canonically a SUPER_ADMIN

### FANTOMAS

- Inherits all SUPER_ADMIN capabilities
- Break-glass/system recovery capabilities (system:bootstrap, system:recovery)
- Independent DB-free authentication path (fantomas/fantomas credentials +
  Web Crypto HMAC-SHA256 signed session cookie)

**DB-backed transitional fantomas account:** Created by bootstrap with
FANTOMAS_INITIAL_PASSWORD. Retained temporarily for backward compatibility.
NOT used by the independent break-glass authentication path.

**Independent Fantomas break-glass principal:** DB-independent. Uses
fantomas/fantomas credentials + FANTOMAS_SESSION_SECRET for HMAC-signed
cookie. Does NOT require a user row, account row, or session row.

No credentials are documented in this release record.

---

## Database

| Field | Value |
|---|---|
| Technology | Neon PostgreSQL |
| Production | Neon main |
| Preview/dev | Neon dev |
| Test | Neon test |
| Application tables | 6 (account, offers, rateLimit, session, user, verification) |
| Technical migration table | drizzle.__drizzle_migrations |
| Migration count | 3 |
| Database contract divergence | NONE |

### Migrations

1. `0000_medical_gunslinger.sql` — Initial schema (6 tables, 2 enums, 2 indexes). principal_type enum = ADMIN, FANTOMAS.
2. `0001_happy_skullbuster.sql` — Better Auth type fixes (boolean/integer/bigint).
3. `0002_deep_justin_hammer.sql` — ALTER TYPE principal_type ADD VALUE 'SUPER_ADMIN' BEFORE 'FANTOMAS'.

Migration status: 3 / 3 APPLIED to Neon main.

### Enums

**offer_status:** DRAFT, PUBLISHED, SUSPENDED, ARCHIVED

**principal_type:** ADMIN, SUPER_ADMIN, FANTOMAS

---

## Database Reconstruction

### Canonical DCD Files

| File | Purpose |
|---|---|
| `docs/database/JOURDAIN_DATABASE_SCHEMA_REFERENCE.md` | Full human-readable schema reference |
| `docs/database/JOURDAIN_DATABASE_OBJECT_INVENTORY.md` | Concise audit-friendly inventory |
| `docs/database/JOURDAIN_DATABASE_REBUILD_RUNBOOK.md` | Canonical reconstruction procedure |
| `docs/database/JOURDAIN_PRODUCTION_SCHEMA_AUDIT.md` | Production schema audit report |
| `docs/database/JOURDAIN_DATABASE_SCHEMA.json` | Machine-readable structural representation |

### Canonical Reconstruction Method

```
EMPTY DATABASE
→ canonical migrations (pnpm db:migrate)
→ bootstrap (pnpm db:bootstrap)
→ verification
→ runtime configuration
→ deployment
```

**DATABASE RECONSTRUCTION ≠ DATA BACKUP.** Schema reconstruction and
data restoration are separate concerns. The DCD documents structure +
reconstruction contract, not data backup.

---

## Quality Evidence

| Gate | Result |
|---|---|
| pnpm lint | PASS |
| pnpm typecheck | PASS |
| pnpm build | PASS |
| Vitest | 263 / 263 PASS |
| Playwright | 107 / 107 PASS |
| Production public smoke | PASS |
| OWNER manual Production validation | PASS |

---

## UI Closure

| UI Phase | Status |
|---|---|
| UI-01 (Methodist design system + shells) | CLOSED |
| UI-02 (Public portal refresh) | CLOSED |
| UI-03 (Admin refresh) | CLOSED |
| Methodist visual identity | DEPLOYED / VALIDATED |

---

## AISE

| Field | Value |
|---|---|
| AISE version | 0.4 |
| DCD status | COMPLETE |
| Constitution | S0 §28 DATABASE CONTINUITY & RECONSTRUCTION DOCTRINE |
| Operationalization | S1, S6, S7, S11, S12, R3 |
| Topology | S0–S14 |
| S15 | NO |

---

## Post-V1 Items

The following are NOT V1 blockers. They are classified as POST-V1 and
belong to separate future workstreams:

- GitHub Actions pnpm 9 → pnpm 10 alignment (CI red check marks)
- Optional custom Production domain (e.g., emploi.methodiste-ci.org)
- Managed-user password reset mechanism (removed from V1 per final correction #2)
- Possible retirement of transitional DB-backed fantomas user
- Optional structured logging (replace console.error in service layer)
- Optional automated dependency scanning (Dependabot)
- Future advanced public filters if product need requires them

---

## Closure

| Field | Value |
|---|---|
| JOURDAIN EMPLOI V1 | PRODUCTION RELEASE PASS |
| Production blockers | 0 |
| Database reconstruction | SUPPORTED |
| Database contract divergence | NONE |
| AISE DCD | COMPLETE |
| Post-V1 | SEPARATE WORKSTREAM |
