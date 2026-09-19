# JOURDAIN EMPLOI V1 — Database Object Inventory

Machine- and audit-friendly inventory of every database object in the JOURDAIN EMPLOI
V1 Production schema. Derived from a read-only audit of the Neon `main` branch catalog
on **2026-09-19** against application commit `eac879f9efb6092db43da42888b32dafc2f37a22`.

> **Consistency result:** No schema divergence detected between `db/schema.ts`, the
> Drizzle migration chain, and the Production catalog. All objects MATCH.

---

## 1. Schemas

| # | Schema | Purpose | Object count |
|---|---|---|---|
| 1 | `public` | Application tables + enums | 6 tables, 2 enums |
| 2 | `drizzle` | Drizzle migration tracking | 1 table |

## 2. Extensions

| # | Extension | Default? |
|---|---|---|
| 1 | `plpgsql` | yes (default procedural language) |

## 3. Enums

| # | Enum | Schema | Values (ordered) | Used by |
|---|---|---|---|---|
| 1 | `offer_status` | public | `DRAFT`, `PUBLISHED`, `SUSPENDED`, `ARCHIVED` | `offers.status` |
| 2 | `principal_type` | public | `ADMIN`, `SUPER_ADMIN`, `FANTOMAS` | `user.principal_type` |

## 4. Tables

| # | Table | Schema | Column count | PK | Managed by |
|---|---|---|---|---|---|
| 1 | `account` | public | 13 | `id` | Better Auth |
| 2 | `offers` | public | 21 | `id` | Jourdain application |
| 3 | `rateLimit` | public | 4 | `key` | Better Auth rate-limit |
| 4 | `session` | public | 9 | `id` | Better Auth |
| 5 | `user` | public | 14 | `id` | Better Auth + Jourdain |
| 6 | `verification` | public | 6 | `id` | Better Auth |
| 7 | `__drizzle_migrations` | drizzle | 3 | `id` | Drizzle Kit |

**Total application columns:** 13 + 21 + 4 + 9 + 14 + 6 = **67** (across the 6 `public` tables).

## 5. Indexes (10)

| # | Name | Table | Definition | Type |
|---|---|---|---|---|
| 1 | `account_pkey` | `account` | `UNIQUE btree (id)` | primary key |
| 2 | `offers_pkey` | `offers` | `UNIQUE btree (id)` | primary key |
| 3 | `idx_offers_status` | `offers` | `btree (status)` | explicit |
| 4 | `idx_offers_created_at_desc` | `offers` | `btree (created_at DESC)` | explicit |
| 5 | `rateLimit_pkey` | `rateLimit` | `UNIQUE btree (key)` | primary key |
| 6 | `session_pkey` | `session` | `UNIQUE btree (id)` | primary key |
| 7 | `session_token_unique` | `session` | `UNIQUE btree (token)` | unique constraint |
| 8 | `user_pkey` | `user` | `UNIQUE btree (id)` | primary key |
| 9 | `user_username_unique` | `user` | `UNIQUE btree (username)` | unique constraint |
| 10 | `verification_pkey` | `verification` | `UNIQUE btree (id)` | primary key |

## 6. Primary Key Constraints (6)

| # | Constraint | Table | Column(s) |
|---|---|---|---|
| 1 | `account_pkey` | `account` | `id` |
| 2 | `offers_pkey` | `offers` | `id` |
| 3 | `rateLimit_pkey` | `rateLimit` | `key` |
| 4 | `session_pkey` | `session` | `id` |
| 5 | `user_pkey` | `user` | `id` |
| 6 | `verification_pkey` | `verification` | `id` |

## 7. Foreign Key Constraints (2)

| # | From (table.column) | To (table.column) | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| 1 | `account.user_id` | `user.id` | `CASCADE` | `NO ACTION` |
| 2 | `session.user_id` | `user.id` | `CASCADE` | `NO ACTION` |

## 8. Unique Constraints (2)

| # | Constraint | Table | Column(s) |
|---|---|---|---|
| 1 | `session_token_unique` | `session` | `token` |
| 2 | `user_username_unique` | `user` | `username` |

## 9. Check Constraints (34)

All 34 check constraints are `NOT NULL` column enforcement. No domain, range, or
business-rule check constraints exist in the schema.

| # | Table | NOT NULL columns | Count |
|---|---|---|---|
| 1 | `account` | `id`, `account_id`, `provider_id`, `user_id`, `created_at`, `updated_at` | 6 |
| 2 | `session` | `id`, `token`, `expires_at`, `user_id`, `created_at`, `updated_at` | 6 |
| 3 | `user` | `id`, `email`, `email_verified`, `username`, `principal_type`, `banned`, `created_at`, `updated_at` | 8 |
| 4 | `verification` | `id`, `identifier`, `value`, `expires_at`, `created_at`, `updated_at` | 6 |
| 5 | `rateLimit` | `key`, `count`, `last_request` | 3 |
| 6 | `offers` | `id`, `description`, `status`, `created_at`, `updated_at` | 5 |
| | **Total** | | **34** |

## 10. Migration Tracking

| Property | Value |
|---|---|
| Schema | `drizzle` |
| Table | `__drizzle_migrations` |
| Columns | `id` (serial PK), `hash` (text), `created_at` (bigint) |
| Record count | **3** (id = 1, 2, 3) |
| Managed by | Drizzle Kit |

## 11. Production Verification

| Property | Value |
|---|---|
| Audit date | 2026-09-19 |
| Target | Neon `main` branch (Production) |
| Method | Read-only `SELECT` against `information_schema` / `pg_catalog` |
| Production URL | https://jourdain-three.vercel.app |
| Application commit | `eac879f9efb6092db43da42888b32dafc2f37a22` |
| Result | **MATCH** — no schema divergence |

## 12. Totals

| Object kind | Count |
|---|---|
| Schemas | 2 |
| Extensions | 1 |
| Enums | 2 |
| Application tables (public) | 6 |
| Tracking tables (drizzle) | 1 |
| Indexes | 10 |
| Primary keys | 6 |
| Foreign keys | 2 |
| Unique constraints | 2 |
| Check constraints | 34 |
| Migration records | 3 |
| Application columns (public tables) | 67 |
