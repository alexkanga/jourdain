# JOURDAIN EMPLOI V1 — Production Schema Audit Report

| Field | Value |
|---|---|
| Audit date | 2026-09-19 |
| Audit target | Neon Postgres — `main` branch (Production) |
| Production URL | https://jourdain-three.vercel.app |
| Application commit | `eac879f9efb6092db43da42888b32dafc2f37a22` |
| Audit mode | Read-only — `SELECT` only, no writes, no DDL |
| Final result | **MATCH — no schema divergence detected** |

---

## 1. Scope of Inspection

The audit performed **read-only `SELECT` queries** against the Neon `main` branch
catalog. No `INSERT`, `UPDATE`, `DELETE`, or DDL statements were executed against the
Production database at any point.

### 1.1 Catalog sources queried

| Source | Purpose |
|---|---|
| `information_schema.tables` | Enumerate schemas and tables |
| `information_schema.columns` | Per-column type, nullability, default |
| `information_schema.table_constraints` | PK, FK, UNIQUE, CHECK constraint names |
| `information_schema.key_column_usage` | PK / UNIQUE column membership |
| `information_schema.referential_constraints` | FK targets and ON DELETE / ON UPDATE actions |
| `information_schema.check_constraints` | CHECK constraint definitions |
| `pg_indexes` | Index definitions (btree, unique, ordering) |
| `pg_type` / `pg_enum` / `pg_namespace` | Enum types and ordered values |
| `pg_constraint` | Low-level constraint metadata (cascade actions) |
| `pg_extension` | Installed extensions |
| `drizzle.__drizzle_migrations` | Applied migration records |

### 1.2 Compared against

| Source | Role in comparison |
|---|---|
| `db/schema.ts` (Drizzle schema source) | Intent — what the schema *should* be |
| Migration chain (`drizzle/*.sql`, 3 files) | Operational — what was applied to the DB |
| Production catalog (this audit) | Reality — what the DB actually enforces |

---

## 2. Source Comparison Summary

| Dimension | `db/schema.ts` | Migration chain | Production catalog | Result |
|---|---|---|---|---|
| Schemas | `public`, `drizzle` | `public`, `drizzle` | `public`, `drizzle` | MATCH |
| Application tables | 6 | 6 | 6 | MATCH |
| Enums | 2 | 2 | 2 | MATCH |
| Enum values (order) | `offer_status` / `principal_type` | identical | identical | MATCH |
| Foreign keys | 2 | 2 | 2 | MATCH |
| Unique constraints | 2 | 2 | 2 | MATCH |
| Indexes | 10 | 10 | 10 | MATCH |
| Check constraints | 34 | 34 | 34 | MATCH |
| Extensions | `plpgsql` | `plpgsql` | `plpgsql` | MATCH |
| Migration records | n/a (generated) | 3 files | 3 rows | MATCH |

**No divergence was detected at any level.** Every column, type, default, nullability
flag, constraint, index, and enum value in the Production catalog matches the
migration chain and `db/schema.ts` exactly.

---

## 3. Table-by-Table Column Match

Classification: **MATCH** = columns, types, nullability, and defaults all agree across
`db/schema.ts`, the migration chain, and the Production catalog. **MISMATCH** = any
discrepancy found.

### 3.1 `account` — 13 columns → MATCH

| # | Column | Type | Nullable | Default | Classification |
|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | MATCH |
| 2 | `account_id` | text | NO | — | MATCH |
| 3 | `provider_id` | text | NO | — | MATCH |
| 4 | `user_id` | text | NO | — | MATCH |
| 5 | `access_token` | text | YES | — | MATCH |
| 6 | `refresh_token` | text | YES | — | MATCH |
| 7 | `access_token_expires_at` | timestamptz | YES | — | MATCH |
| 8 | `refresh_token_expires_at` | timestamptz | YES | — | MATCH |
| 9 | `scope` | text | YES | — | MATCH |
| 10 | `id_token` | text | YES | — | MATCH |
| 11 | `session_state` | text | YES | — | MATCH |
| 12 | `created_at` | timestamptz | NO | `now()` | MATCH |
| 13 | `updated_at` | timestamptz | NO | `now()` | MATCH |

**Table result: MATCH (13/13 columns).**

### 3.2 `session` — 9 columns → MATCH

| # | Column | Type | Nullable | Default | Classification |
|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | MATCH |
| 2 | `token` | text | NO | — | MATCH |
| 3 | `expires_at` | timestamptz | NO | — | MATCH |
| 4 | `ip_address` | text | YES | — | MATCH |
| 5 | `user_agent` | text | YES | — | MATCH |
| 6 | `user_id` | text | NO | — | MATCH |
| 7 | `created_at` | timestamptz | NO | `now()` | MATCH |
| 8 | `updated_at` | timestamptz | NO | `now()` | MATCH |
| 9 | `impersonated_from` | text | YES | — | MATCH |

**Table result: MATCH (9/9 columns).**

### 3.3 `user` — 14 columns → MATCH

| # | Column | Type | Nullable | Default | Classification |
|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | MATCH |
| 2 | `name` | text | YES | — | MATCH |
| 3 | `email` | text | NO | — | MATCH |
| 4 | `email_verified` | boolean | NO | `false` | MATCH |
| 5 | `image` | text | YES | — | MATCH |
| 6 | `username` | text | NO | — | MATCH |
| 7 | `principal_type` | principal_type | NO | `'ADMIN'` | MATCH |
| 8 | `role` | text | YES | — | MATCH |
| 9 | `banned` | boolean | NO | `false` | MATCH |
| 10 | `ban_reason` | text | YES | — | MATCH |
| 11 | `ban_expires` | timestamptz | YES | — | MATCH |
| 12 | `last_sign_in_at` | timestamptz | YES | — | MATCH |
| 13 | `created_at` | timestamptz | NO | `now()` | MATCH |
| 14 | `updated_at` | timestamptz | NO | `now()` | MATCH |

**Table result: MATCH (14/14 columns).**

### 3.4 `verification` — 6 columns → MATCH

| # | Column | Type | Nullable | Default | Classification |
|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | MATCH |
| 2 | `identifier` | text | NO | — | MATCH |
| 3 | `value` | text | NO | — | MATCH |
| 4 | `expires_at` | timestamptz | NO | — | MATCH |
| 5 | `created_at` | timestamptz | NO | `now()` | MATCH |
| 6 | `updated_at` | timestamptz | NO | `now()` | MATCH |

**Table result: MATCH (6/6 columns).**

### 3.5 `rateLimit` — 4 columns → MATCH

| # | Column | Type | Nullable | Default | Classification |
|---|---|---|---|---|---|
| 1 | `key` | text | NO | — | MATCH |
| 2 | `count` | integer | NO | — | MATCH |
| 3 | `last_request` | bigint | NO | `0` | MATCH |
| 4 | `expires_at` | timestamptz | YES | — | MATCH |

**Table result: MATCH (4/4 columns).**

### 3.6 `offers` — 21 columns → MATCH

| # | Column | Type | Nullable | Default | Classification |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | MATCH |
| 2 | `slug` | text | YES | — | MATCH |
| 3 | `title` | text | YES | — | MATCH |
| 4 | `summary` | text | YES | — | MATCH |
| 5 | `description` | jsonb | NO | — | MATCH |
| 6 | `status` | offer_status | NO | `'DRAFT'` | MATCH |
| 7 | `location` | text | YES | — | MATCH |
| 8 | `contract_type` | text | YES | — | MATCH |
| 9 | `work_mode` | text | YES | — | MATCH |
| 10 | `experience_level` | text | YES | — | MATCH |
| 11 | `salary_min` | integer | YES | — | MATCH |
| 12 | `salary_max` | integer | YES | — | MATCH |
| 13 | `salary_currency` | text | YES | — | MATCH |
| 14 | `published_at` | timestamptz | YES | — | MATCH |
| 15 | `starts_at` | timestamptz | YES | — | MATCH |
| 16 | `expires_at` | timestamptz | YES | — | MATCH |
| 17 | `created_by` | text | YES | — | MATCH |
| 18 | `updated_by` | text | YES | — | MATCH |
| 19 | `version` | integer | YES | — | MATCH |
| 20 | `created_at` | timestamptz | NO | `now()` | MATCH |
| 21 | `updated_at` | timestamptz | NO | `now()` | MATCH |

**Table result: MATCH (21/21 columns).**

### 3.7 `drizzle.__drizzle_migrations` — 3 columns → MATCH (tracking table)

| # | Column | Type | Nullable | Default | Classification |
|---|---|---|---|---|---|
| 1 | `id` | serial (integer) | NO | `nextval(...)` | MATCH |
| 2 | `hash` | text | NO | — | MATCH |
| 3 | `created_at` | bigint | NO | — | MATCH |

**Table result: MATCH (3/3 columns).** 3 rows present (id = 1, 2, 3).

### 3.8 Column-match totals

| Table | Columns | MATCH | MISMATCH |
|---|---|---|---|
| `account` | 13 | 13 | 0 |
| `session` | 9 | 9 | 0 |
| `user` | 14 | 14 | 0 |
| `verification` | 6 | 6 | 0 |
| `rateLimit` | 4 | 4 | 0 |
| `offers` | 21 | 21 | 0 |
| `drizzle.__drizzle_migrations` | 3 | 3 | 0 |
| **Total** | **70** | **70** | **0** |

---

## 4. Enum Verification

| Enum | Schema | Expected values (ordered) | Catalog values (ordered) | Result |
|---|---|---|---|---|
| `offer_status` | public | `DRAFT, PUBLISHED, SUSPENDED, ARCHIVED` | `DRAFT, PUBLISHED, SUSPENDED, ARCHIVED` | MATCH |
| `principal_type` | public | `ADMIN, SUPER_ADMIN, FANTOMAS` | `ADMIN, SUPER_ADMIN, FANTOMAS` | MATCH |

**Enum result: MATCH (2/2).** Value ordering (via `pg_enum.enumsortorder`) is
identical across all three sources.

---

## 5. Index Verification

| # | Name | Expected | Catalog | Result |
|---|---|---|---|---|
| 1 | `account_pkey` | UNIQUE btree on `account(id)` | UNIQUE btree on `account(id)` | MATCH |
| 2 | `offers_pkey` | UNIQUE btree on `offers(id)` | UNIQUE btree on `offers(id)` | MATCH |
| 3 | `idx_offers_status` | btree on `offers(status)` | btree on `offers(status)` | MATCH |
| 4 | `idx_offers_created_at_desc` | btree on `offers(created_at DESC)` | btree on `offers(created_at DESC)` | MATCH |
| 5 | `rateLimit_pkey` | UNIQUE btree on `rateLimit(key)` | UNIQUE btree on `rateLimit(key)` | MATCH |
| 6 | `session_pkey` | UNIQUE btree on `session(id)` | UNIQUE btree on `session(id)` | MATCH |
| 7 | `session_token_unique` | UNIQUE btree on `session(token)` | UNIQUE btree on `session(token)` | MATCH |
| 8 | `user_pkey` | UNIQUE btree on `user(id)` | UNIQUE btree on `user(id)` | MATCH |
| 9 | `user_username_unique` | UNIQUE btree on `user(username)` | UNIQUE btree on `user(username)` | MATCH |
| 10 | `verification_pkey` | UNIQUE btree on `verification(id)` | UNIQUE btree on `verification(id)` | MATCH |

**Index result: MATCH (10/10).** No additional, missing, or mis-defined indexes.

---

## 6. Foreign Key Verification

| # | FK | Expected | Catalog | Result |
|---|---|---|---|---|
| 1 | `account.user_id → user.id` | `ON DELETE CASCADE`, `ON UPDATE NO ACTION` | `ON DELETE CASCADE`, `ON UPDATE NO ACTION` | MATCH |
| 2 | `session.user_id → user.id` | `ON DELETE CASCADE`, `ON UPDATE NO ACTION` | `ON DELETE CASCADE`, `ON UPDATE NO ACTION` | MATCH |

**Foreign key result: MATCH (2/2).** Cascade action and update action both verified
via `pg_constraint.confdeltype` / `pg_constraint.confupdtype`.

---

## 7. Unique Constraint Verification

| # | Constraint | Expected | Catalog | Result |
|---|---|---|---|---|
| 1 | `session_token_unique` | UNIQUE on `session(token)` | UNIQUE on `session(token)` | MATCH |
| 2 | `user_username_unique` | UNIQUE on `user(username)` | UNIQUE on `user(username)` | MATCH |

**Unique constraint result: MATCH (2/2).**

---

## 8. Check Constraint Verification

**Total check constraints:** 34 expected vs 34 catalog → **MATCH**.

**Nature:** All 34 check constraints are `NOT NULL` column enforcement. No domain,
range, or business-rule check constraints exist. (Business invariants for `offers`
are enforced by the application — see the schema reference, §8.)

Per-table NOT NULL check counts:

| Table | Expected | Catalog | Result |
|---|---|---|---|
| `account` | 6 | 6 | MATCH |
| `session` | 6 | 6 | MATCH |
| `user` | 8 | 8 | MATCH |
| `verification` | 6 | 6 | MATCH |
| `rateLimit` | 3 | 3 | MATCH |
| `offers` | 5 | 5 | MATCH |
| **Total** | **34** | **34** | **MATCH** |

**Check constraint result: MATCH (34/34).**

---

## 9. Migration Tracking Verification

| Property | Expected | Catalog | Result |
|---|---|---|---|
| Tracking schema | `drizzle` | `drizzle` | MATCH |
| Tracking table | `__drizzle_migrations` | `__drizzle_migrations` | MATCH |
| Record count | 3 | 3 | MATCH |
| Record ids | 1, 2, 3 | 1, 2, 3 | MATCH |
| Column set | `id`, `hash`, `created_at` | `id`, `hash`, `created_at` | MATCH |

**Migration tracking result: MATCH.**

---

## 10. Extension Verification

| Extension | Expected | Catalog | Result |
|---|---|---|---|
| `plpgsql` | present (default) | present | MATCH |

**Extension result: MATCH.**

---

## 11. Final Consistency Result

| Dimension | Result |
|---|---|
| Schemas | MATCH |
| Extensions | MATCH |
| Enums (values + order) | MATCH |
| Tables (70 columns across 7 tables) | MATCH (70/70) |
| Primary keys (6) | MATCH |
| Foreign keys (2) | MATCH |
| Unique constraints (2) | MATCH |
| Check constraints (34) | MATCH |
| Indexes (10) | MATCH |
| Migration tracking (3 records) | MATCH |

### Overall audit verdict

> **MATCH — no schema divergence detected.**
>
> The Production catalog on the Neon `main` branch is byte-for-byte consistent with the
> Drizzle migration chain and `db/schema.ts` at application commit
> `eac879f9efb6092db43da42888b32dafc2f37a22`. No corrective action is required.

### Caveats (non-blocking)

1. **Business invariants on `offers`** (e.g. `salary_min ≤ salary_max`,
   `published_at` lifecycle, status transition graph, `slug` uniqueness) are enforced by
   the application, not by DB constraints. This is by design — see the schema reference,
   §8.2. The audit confirms there are **no** DB-level check constraints encoding these.
2. **`offers.created_by` / `updated_by`** are free-text principal references, **not**
   foreign keys, so the database does not guarantee they resolve to a live `user` row.
   This is intentional (audit history survives principal deletion).
3. **The independent FANTOMAS break-glass** has no DB representation; the audit cannot
   verify it via the catalog. Its existence is a runtime/env-var concern, verified
   operationally (see the rebuild runbook, §6.8).

---

## 12. Audit Metadata

| Field | Value |
|---|---|
| Audit date | 2026-09-19 |
| Auditor method | Read-only `SELECT` against Neon `main` catalog |
| Application commit | `eac879f9efb6092db43da42888b32dafc2f37a22` |
| Production URL | https://jourdain-three.vercel.app |
| Verdict | **MATCH — no schema divergence** |
| Next action | None required. Re-audit after any schema-affecting change. |

*End of audit report.*
