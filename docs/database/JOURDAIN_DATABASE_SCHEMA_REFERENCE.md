# JOURDAIN EMPLOI V1 — Database Canonical Schema Reference

| Field | Value |
|---|---|
| Application | JOURDAIN EMPLOI (V1) |
| Application commit | `eac879f9efb6092db43da42888b32dafc2f37a22` |
| Production URL | https://jourdain-three.vercel.app |
| Production host | Neon (Postgres), `main` branch |
| Audit date | 2026-09-19 |
| Document status | CANONICAL — Reconstruction dossier |
| Schema divergence | **None detected** — `db/schema.ts`, migration chain, and Production catalog MATCH |

---

## 1. Overview

The JOURDAIN EMPLOI V1 database is a single Postgres instance hosted on Neon with two
schemas:

| Schema | Purpose | Object count |
|---|---|---|
| `public` | Application tables (Better Auth + Jourdain offers) | 6 tables, 2 enums |
| `drizzle` | Drizzle migration tracking | 1 table (`__drizzle_migrations`) |

**Application tables (`public`):** `account`, `offers`, `rateLimit`, `session`, `user`, `verification`

**Enums (`public`):** `offer_status`, `principal_type`

**Object totals:**
- 6 application tables
- 2 enums (3 values for `principal_type`, 4 values for `offer_status`)
- 2 foreign keys (both `ON DELETE CASCADE`)
- 2 unique constraints (`session.token`, `user.username`)
- 10 indexes (6 primary-key indexes + 2 unique-constraint indexes + 2 btree indexes on `offers`)
- 34 check constraints — all `NOT NULL` column enforcement
- 1 extension: `plpgsql`
- 3 migration records in `drizzle.__drizzle_migrations` (id = 1, 2, 3)

---

## 2. Authority & Drift Rules

When resolving any discrepancy between sources, the following precedence is binding.
A lower-ranked source is **wrong** if it contradicts a higher-ranked source.

| Rank | Source | Role |
|---|---|---|
| 1 | Applied migration chain (`drizzle/__drizzle_migrations` + migrated DDL on Production) | The actual schema that the database enforces. |
| 2 | `db/schema.ts` (Drizzle schema source of truth) | The intent of the schema. Must produce migrations identical to Rank 1. |
| 3 | Production DB catalog (`information_schema` / `pg_catalog` on Neon `main`) | The live state. Must equal Rank 1. |
| 4 | This document | A reconstruction of Rank 1–3. Non-binding if it conflicts with any of the above. |

**Drift handling:**
- If Rank 2 (`schema.ts`) and Rank 1 (migrations) disagree → the **migrations win**;
  `schema.ts` must be corrected to match, then a no-op regenerative check is performed.
- If Rank 3 (Production) and Rank 1 disagree → the Production DB must be reconciled
  by re-applying the migration chain; data is preserved.
- If Rank 4 (this document) disagrees with any of Rank 1–3 → this document is wrong
  and must be regenerated from the audit.

**Audit conclusion (2026-09-19):** Ranks 1, 2, and 3 are byte-for-byte consistent on
structure (columns, types, nullability, defaults, constraints, indexes, enums).
No divergence was found.

---

## 3. Enums

### 3.1 `offer_status`

Ordered values (the ordinal is meaningful for lifecycle ordering):

| # | Value | Purpose |
|---|---|---|
| 1 | `DRAFT` | Offer is being authored; not visible to public consumers. **Default** for new rows. |
| 2 | `PUBLISHED` | Offer is live and visible. `published_at` is set by the application when transitioning into this state. |
| 3 | `SUSPENDED` | Offer was published but is temporarily hidden (moderation, review). Retains `published_at`. |
| 4 | `ARCHIVED` | Offer is permanently retired; no longer visible, retained for history/audit. |

- **Used by:** `offers.status`
- **Default:** `'DRAFT'` (column-level)
- **Lifecycle direction:** `DRAFT → PUBLISHED → SUSPENDED → ARCHIVED` is the expected
  forward path, but the **database does not enforce** the transition graph (see §8).
- **Storage:** PostgreSQL `enum` type in `public` schema.

### 3.2 `principal_type`

Ordered values (the ordinal reflects the authorization tier, lowest → highest):

| # | Value | Purpose |
|---|---|---|
| 1 | `ADMIN` | Regular administrative user. **Default** for new user rows. Can manage offers. Cannot manage other principals. |
| 2 | `SUPER_ADMIN` | Elevated administrator. Can manage other admins and perform privileged bootstrap operations. `admin1` is provisioned as `SUPER_ADMIN` by the bootstrap command. |
| 3 | `FANTOMAS` | DB-backed break-glass principal. A real `user` row exists with this `principal_type`, plus matching `account`/`session` rows. Distinct from the **independent** break-glass (see §10). |

- **Used by:** `user.principal_type`
- **Default:** `'ADMIN'` (column-level)
- **Authorization model:** monotonic — a higher tier implies all permissions of the
  lower tiers, plus additional ones. See §10 for the full principal model.

---

## 4. Tables — Full Column Inventory

Notation used in the column tables:
- **Null:** `NO` = `NOT NULL` (enforced), `YES` = nullable.
- **Default:** literal SQL default expression, or `—` (em dash) for none.
- **Key:** `PK` = primary key, `FK→` = foreign key target, `UQ` = unique, blank = none.
- **Writer:** who is authorized to set/mutate the column under normal operation.
  - *Better Auth* — the Better Auth runtime writes it during auth flows.
  - *Bootstrap* — the `pnpm db:bootstrap` script writes it (one-time provisioning).
  - *Application* — Jourdain application code writes it.
  - *DB* — the database writes it via column defaults / triggers (e.g. `now()`).

### 4.1 `account` — 13 columns

Stores per-provider credential/OAuth links for a user (Better Auth `account` table).

| # | Column | PostgreSQL type | Null | Default | Key | Meaning | Writer |
|---|---|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | PK | Account-link surrogate identifier | Better Auth |
| 2 | `account_id` | text | NO | — | | Provider-specific account id (e.g. OAuth subject or, for credential auth, the user id) | Better Auth |
| 3 | `provider_id` | text | NO | — | | Authentication provider name (e.g. `credential`, `google`) | Better Auth |
| 4 | `user_id` | text | NO | — | FK→user.id (CASCADE) | Owning user | Better Auth |
| 5 | `access_token` | text | YES | — | | OAuth access token (provider-bound; null for credential auth) | Better Auth |
| 6 | `refresh_token` | text | YES | — | | OAuth refresh token | Better Auth |
| 7 | `access_token_expires_at` | timestamptz | YES | — | | Access-token expiry | Better Auth |
| 8 | `refresh_token_expires_at` | timestamptz | YES | — | | Refresh-token expiry | Better Auth |
| 9 | `scope` | text | YES | — | | OAuth scopes granted | Better Auth |
| 10 | `id_token` | text | YES | — | | OIDC id token | Better Auth |
| 11 | `session_state` | text | YES | — | | OAuth session state | Better Auth |
| 12 | `created_at` | timestamptz | NO | `now()` | | Row creation time | DB |
| 13 | `updated_at` | timestamptz | NO | `now()` | | Row last update time | DB |

**Constraints:** PK on `id`; FK `account.user_id → user.id` (`ON DELETE CASCADE`, `ON UPDATE NO ACTION`); 6 NOT NULL checks.
**Indexes:** `account_pkey` (unique btree on `id`).
**Writes:** Better Auth runtime only. The Jourdain application does not write this table directly.

### 4.2 `session` — 9 columns

Stores authenticated sessions (Better Auth `session` table).

| # | Column | PostgreSQL type | Null | Default | Key | Meaning | Writer |
|---|---|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | PK | Session surrogate identifier | Better Auth |
| 2 | `token` | text | NO | — | UQ (`session_token_unique`) | Opaque session token carried in the cookie | Better Auth |
| 3 | `expires_at` | timestamptz | NO | — | | Absolute session expiry | Better Auth |
| 4 | `ip_address` | text | YES | — | | Client IP at creation | Better Auth |
| 5 | `user_agent` | text | YES | — | | Client User-Agent | Better Auth |
| 6 | `user_id` | text | NO | — | FK→user.id (CASCADE) | Owning user | Better Auth |
| 7 | `created_at` | timestamptz | NO | `now()` | | Row creation time | DB |
| 8 | `updated_at` | timestamptz | NO | `now()` | | Row last update time | DB |
| 9 | `impersonated_from` | text | YES | — | | Originating admin session id when this session is an impersonation | Better Auth |

**Constraints:** PK on `id`; UNIQUE on `token` (`session_token_unique`); FK `session.user_id → user.id` (`ON DELETE CASCADE`, `ON UPDATE NO ACTION`); 6 NOT NULL checks.
**Indexes:** `session_pkey` (unique btree on `id`); `session_token_unique` (unique btree on `token`).
**Writes:** Better Auth runtime only.

### 4.3 `user` — 14 columns

The principal registry. Combines Better Auth core user fields, the Better Auth ban-plugin
fields, and Jourdain-specific authorization fields (`username`, `principal_type`, `role`).

| # | Column | PostgreSQL type | Null | Default | Key | Meaning | Writer |
|---|---|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | PK | User identifier (text; Better Auth default) | Better Auth / Bootstrap |
| 2 | `name` | text | YES | — | | Display name (optional; `username` is the canonical identifier) | Better Auth / Application |
| 3 | `email` | text | NO | — | | Email address | Better Auth / Application |
| 4 | `email_verified` | boolean | NO | `false` | | Whether email has been verified | Better Auth / Application |
| 5 | `image` | text | YES | — | | Avatar URL | Better Auth / Application |
| 6 | `username` | text | NO | — | UQ (`user_username_unique`) | Canonical login identifier | Bootstrap / Application |
| 7 | `principal_type` | principal_type | NO | `'ADMIN'` | | Authorization tier (`ADMIN`/`SUPER_ADMIN`/`FANTOMAS`) | Bootstrap / Application |
| 8 | `role` | text | YES | — | | Optional application role label (free text) | Application |
| 9 | `banned` | boolean | NO | `false` | | Whether the user is banned (ban plugin) | Better Auth / Application |
| 10 | `ban_reason` | text | YES | — | | Reason for the ban | Better Auth / Application |
| 11 | `ban_expires` | timestamptz | YES | — | | Ban expiry (null = indefinite) | Better Auth / Application |
| 12 | `last_sign_in_at` | timestamptz | YES | — | | Timestamp of the last successful sign-in | Better Auth / Application |
| 13 | `created_at` | timestamptz | NO | `now()` | | Row creation time | DB |
| 14 | `updated_at` | timestamptz | NO | `now()` | | Row last update time | DB |

**Constraints:** PK on `id`; UNIQUE on `username` (`user_username_unique`); 8 NOT NULL checks.
**Indexes:** `user_pkey` (unique btree on `id`); `user_username_unique` (unique btree on `username`).
**Writes:** Better Auth (auth flows), Bootstrap (`admin1`, DB-backed `fantomas`), Application (profile/role updates).

### 4.4 `verification` — 6 columns

Stores verification / reset tokens (Better Auth `verification` table).

| # | Column | PostgreSQL type | Null | Default | Key | Meaning | Writer |
|---|---|---|---|---|---|---|---|
| 1 | `id` | text | NO | — | PK | Verification record surrogate identifier | Better Auth |
| 2 | `identifier` | text | NO | — | | Email or other identifier being verified | Better Auth |
| 3 | `value` | text | NO | — | | Verification token / hash | Better Auth |
| 4 | `expires_at` | timestamptz | NO | — | | Token expiry | Better Auth |
| 5 | `created_at` | timestamptz | NO | `now()` | | Row creation time | DB |
| 6 | `updated_at` | timestamptz | NO | `now()` | | Row last update time | DB |

**Constraints:** PK on `id`; 6 NOT NULL checks.
**Indexes:** `verification_pkey` (unique btree on `id`).
**Writes:** Better Auth runtime only.

### 4.5 `rateLimit` — 4 columns

Per-key request counters for rate limiting.

| # | Column | PostgreSQL type | Null | Default | Key | Meaning | Writer |
|---|---|---|---|---|---|---|---|
| 1 | `key` | text | NO | — | PK (`rateLimit_pkey`) | Rate-limit key (composite identifier string, e.g. `sign-in:<ip>` or `sign-in:<email>`) | Better Auth / Application |
| 2 | `count` | integer | NO | — | | Request count in the current window | Better Auth / Application |
| 3 | `last_request` | bigint | NO | `0` | | Epoch milliseconds of the last request | Better Auth / Application |
| 4 | `expires_at` | timestamptz | YES | — | | Current window reset time (null = use default window) | Application |

**Constraints:** PK on `key` (`rateLimit_pkey`); 3 NOT NULL checks.
**Indexes:** `rateLimit_pkey` (unique btree on `key`).
**Writes:** Better Auth rate-limit runtime and/or Jourdain application rate-limit middleware.
**Note:** The table is keyed by the rate-limit `key` string rather than a surrogate id;
rows are upserted by key on each rate-limited request.

### 4.6 `offers` — 21 columns

The core domain table: job offers authored and curated by administrators.

| # | Column | PostgreSQL type | Null | Default | Key | Meaning | Writer |
|---|---|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` | PK | Offer identifier | DB |
| 2 | `slug` | text | YES | — | | URL slug (denormalized for routing) | Application |
| 3 | `title` | text | YES | — | | Title (denormalized from `description` for list views) | Application |
| 4 | `summary` | text | YES | — | | Short summary (denormalized) | Application |
| 5 | `description` | jsonb | NO | — | | Rich content payload (title, body, requirements, sections, media) | Application |
| 6 | `status` | offer_status | NO | `'DRAFT'` | | Lifecycle status | Application |
| 7 | `location` | text | YES | — | | Work location (free text) | Application |
| 8 | `contract_type` | text | YES | — | | Contract type (e.g. `CDI`, `CDD`, `FREELANCE`) | Application |
| 9 | `work_mode` | text | YES | — | | Work mode (`onsite`/`remote`/`hybrid`) | Application |
| 10 | `experience_level` | text | YES | — | | Experience level label | Application |
| 11 | `salary_min` | integer | YES | — | | Lower salary bound (annualized) | Application |
| 12 | `salary_max` | integer | YES | — | | Upper salary bound (annualized) | Application |
| 13 | `salary_currency` | text | YES | — | | ISO 4217 currency code | Application |
| 14 | `published_at` | timestamptz | YES | — | | Time the offer first became `PUBLISHED` | Application |
| 15 | `starts_at` | timestamptz | YES | — | | Position start date | Application |
| 16 | `expires_at` | timestamptz | YES | — | | Application deadline | Application |
| 17 | `created_by` | text | YES | — | | Principal who created the offer (username or principal id) | Application |
| 18 | `updated_by` | text | YES | — | | Principal who last updated the offer | Application |
| 19 | `version` | integer | YES | — | | Revision counter / optimistic-locking version | Application |
| 20 | `created_at` | timestamptz | NO | `now()` | | Row creation time | DB |
| 21 | `updated_at` | timestamptz | NO | `now()` | | Row last update time | DB |

**Constraints:** PK on `id`; 5 NOT NULL checks.
**Indexes:**
- `offers_pkey` (unique btree on `id`)
- `idx_offers_status` (btree on `status`) — accelerates filtering by lifecycle state
- `idx_offers_created_at_desc` (btree on `created_at DESC`) — accelerates "newest first" listing

**Writes:** Application only (via the admin UI / API). Better Auth never writes this table.

---

## 5. Constraints Summary

### 5.1 Primary keys (6)

| Table | Column(s) | Constraint name |
|---|---|---|
| `account` | `id` | `account_pkey` |
| `offers` | `id` | `offers_pkey` |
| `rateLimit` | `key` | `rateLimit_pkey` |
| `session` | `id` | `session_pkey` |
| `user` | `id` | `user_pkey` |
| `verification` | `id` | `verification_pkey` |

### 5.2 Foreign keys (2)

| Name | From | To | ON DELETE | ON UPDATE |
|---|---|---|---|---|
| (account → user) | `account.user_id` | `user.id` | `CASCADE` | `NO ACTION` |
| (session → user) | `session.user_id` | `user.id` | `CASCADE` | `NO ACTION` |

> Both foreign keys cascade on delete: removing a `user` row removes all of that
> user's `account` and `session` rows automatically. `ON UPDATE NO ACTION` means a
> change to `user.id` is **not** propagated; since `user.id` is the PK and is never
> updated after creation, this is the correct and safe default.

### 5.3 Unique constraints (2)

| Name | Table | Column(s) |
|---|---|---|
| `session_token_unique` | `session` | `token` |
| `user_username_unique` | `user` | `username` |

### 5.4 Check constraints (34)

All 34 check constraints are `NOT NULL` column enforcement. There are **no**
domain/range/business-rule check constraints in the schema — business invariants
are enforced by the application (see §8).

Per-table NOT NULL counts:

| Table | NOT NULL columns | Count |
|---|---|---|
| `account` | `id`, `account_id`, `provider_id`, `user_id`, `created_at`, `updated_at` | 6 |
| `session` | `id`, `token`, `expires_at`, `user_id`, `created_at`, `updated_at` | 6 |
| `user` | `id`, `email`, `email_verified`, `username`, `principal_type`, `banned`, `created_at`, `updated_at` | 8 |
| `verification` | `id`, `identifier`, `value`, `expires_at`, `created_at`, `updated_at` | 6 |
| `rateLimit` | `key`, `count`, `last_request` | 3 |
| `offers` | `id`, `description`, `status`, `created_at`, `updated_at` | 5 |
| **Total** | | **34** |

---

## 6. Indexes

| # | Name | Table | Columns | Type | Purpose |
|---|---|---|---|---|---|
| 1 | `account_pkey` | `account` | `id` | unique btree | Primary key |
| 2 | `offers_pkey` | `offers` | `id` | unique btree | Primary key |
| 3 | `idx_offers_status` | `offers` | `status` | btree | Filter offers by lifecycle state |
| 4 | `idx_offers_created_at_desc` | `offers` | `created_at` DESC | btree | Newest-first listing |
| 5 | `rateLimit_pkey` | `rateLimit` | `key` | unique btree | Primary key |
| 6 | `session_pkey` | `session` | `id` | unique btree | Primary key |
| 7 | `session_token_unique` | `session` | `token` | unique btree | Unique constraint + session lookup by token |
| 8 | `user_pkey` | `user` | `id` | unique btree | Primary key |
| 9 | `user_username_unique` | `user` | `username` | unique btree | Unique constraint + login lookup by username |
| 10 | `verification_pkey` | `verification` | `id` | unique btree | Primary key |

> The 6 primary-key indexes and 2 unique-constraint indexes are created automatically
> by PostgreSQL. The 2 `idx_offers_*` indexes are **explicit** application indexes.

---

## 7. Relationships — ER (text model)

```
                          ┌──────────────────────────┐
                          │          user            │
                          │  PK: id (text)           │
                          │  UQ: username            │
                          │  principal_type (enum)   │
                          └─────────────┬────────────┘
                                        │ 1
                       ┌────────────────┼────────────────┐
                       │ N              │ N               │ N
                  ┌────▼─────┐    ┌─────▼──────┐   ┌─────▼─────────┐
                  │  account │    │  session   │   │  (offers     │
                  │          │    │            │   │   created_by │
                  │ FK:      │    │ FK:        │   │   is a free  │
                  │ user_id  │    │ user_id    │   │   text ref,  │
                  │ CASCADE  │    │ CASCADE    │   │   NOT an FK) │
                  └──────────┘    └────────────┘   └─────────────┘

  ┌────────────────┐         ┌──────────────────────┐
  │  verification  │         │       offers         │
  │  PK: id        │         │  PK: id (uuid)       │
  │  (no FK)       │         │  status: offer_status│
  └────────────────┘         │  description: jsonb │
                             │  indexes:           │
                             │   idx_offers_status │
                             │   idx_offers_       │
                             │    created_at_desc │
                             └──────────────────────┘

  ┌────────────────┐         ┌────────────────────────────────┐
  │   rateLimit    │         │  drizzle.__drizzle_migrations   │
  │  PK: key       │         │  id (serial), hash (text),      │
  │  (standalone)  │         │  created_at (bigint) — 3 rows   │
  └────────────────┘         └────────────────────────────────┘

  Enums:
    offer_status    : DRAFT, PUBLISHED, SUSPENDED, ARCHIVED   → used by offers.status
    principal_type   : ADMIN, SUPER_ADMIN, FANTOMAS            → used by user.principal_type
```

**Referential integrity notes:**
- `account.user_id` and `session.user_id` are the **only** enforced referential
  relationships in the schema. Both cascade on delete.
- `offers.created_by` / `offers.updated_by` are **free-text principal references**
  (typically a username). They are deliberately **not** foreign keys, so that offer
  audit history survives even if the authoring principal is later deleted or renamed.
- `verification`, `rateLimit`, and `offers` have no foreign keys.

---

## 8. Offers — Business Semantics

The `offers` table is the core domain object. Its invariants split into two layers:

### 8.1 DATABASE-ENFORCED rules

These are guaranteed by the schema itself; no application code is needed to uphold them.

| Rule | Enforcement |
|---|---|
| `id` is always present and unique. | PK + `DEFAULT gen_random_uuid()`. |
| `description` is always present (non-null). | `NOT NULL` on `description`. |
| `status` is one of `DRAFT`, `PUBLISHED`, `SUSPENDED`, `ARCHIVED`. | `offer_status` enum type. |
| New offers start as `DRAFT`. | `status DEFAULT 'DRAFT'`. |
| `created_at` / `updated_at` are always present and set automatically on insert. | `NOT NULL DEFAULT now()`. |
| The set of indexed query patterns (by status, newest-first) is supported by `idx_offers_status` and `idx_offers_created_at_desc`. | Explicit btree indexes. |

### 8.2 APPLICATION-ENFORCED rules

These invariants are **not** expressed in the schema and must be upheld by the
application. A direct SQL write could violate them; the application API is the
guardian.

| Rule | Why it is application-only |
|---|---|
| `published_at` is set when `status` first transitions to `PUBLISHED`, and is not reset on subsequent transitions (to `SUSPENDED` / `ARCHIVED`). | There is no DB trigger linking `published_at` to `status` changes. |
| `status` transitions follow the lifecycle graph `DRAFT → PUBLISHED → SUSPENDED → ARCHIVED` (with `SUSPENDED ↔ PUBLISHED` re-publish allowed). | No DB constraint forbids e.g. `ARCHIVED → DRAFT`; the application must validate. |
| `salary_min ≤ salary_max` when both are set. | No check constraint; application must validate. |
| `expires_at` (application deadline), when set, is in the future at publish time. | No check constraint; application must validate. |
| `created_by` / `updated_by` are set to the acting principal (an `ADMIN`, `SUPER_ADMIN`, or DB-backed `FANTOMAS`). | Free-text columns, no FK; application must populate correctly. |
| `slug` is unique among published offers (and URL-safe). | No unique constraint on `slug`; application must enforce / generate. |
| `description` (jsonb) conforms to the application's content schema (required keys, types). | jsonb is schemaless at the DB level; application validates the payload shape. |
| On `ARCHIVE`, the offer is hidden from public listing but retained (no hard delete by the application). | The DB allows `DELETE`; the application policy is soft-delete via `ARCHIVED`. |

### 8.3 Lifecycle of `published_at`

```
  DRAFT  ──publish──▶  PUBLISHED  ──suspend──▶  SUSPENDED
   (null)              published_at = T1          (published_at unchanged)
                          │
                          └──archive──▶  ARCHIVED
                                          (published_at unchanged)
```

- `published_at` is `NULL` while the offer has never been published.
- `published_at` is set exactly once, at the first `DRAFT → PUBLISHED` transition.
- Re-publishing after a `SUSPENDED → PUBLISHED` transition does **not** overwrite
  `published_at` (the original publication date is preserved).
- Moving to `ARCHIVED` preserves `published_at` for historical accuracy.

---

## 9. Auth Tables Documentation (Better Auth)

The five Better Auth-managed tables — `user`, `account`, `session`, `verification`,
`rateLimit` — are generated and maintained by the Better Auth runtime. The Jourdain
application interacts with them **only** through Better Auth's APIs and the bootstrap
script (for the two seeded principals).

### 9.1 Authentication model

- **Credential auth** is the primary method. A `user` row is linked to a `credential`
  `account` row (`provider_id = 'credential'`); the password hash is stored in
  `account`-adjacent storage managed by Better Auth.
- **Sessions** are token-based. The opaque `session.token` is carried in an
  HTTP-only cookie; `session.expires_at` bounds the session.
- **Verification** rows are short-lived tokens used for email verification and
  password-reset flows; they expire per `verification.expires_at`.
- **Rate limiting** is keyed by a composite string (`rateLimit.key`) and tracked with
  a monotonic `count` and `last_request` timestamp.

### 9.2 Ban plugin

The `user` table carries the Better Auth ban-plugin columns: `banned`, `ban_reason`,
`ban_expires`. When `banned = true`, the application/Better Auth middleware must reject
new sessions for that user. `ban_expires = NULL` means an indefinite ban.

### 9.3 Cascade behavior

Deleting a `user` row cascades to its `account` and `session` rows. The application
does **not** perform cascade deletes manually; the FK definitions handle it.

---

## 10. User / Principal Model

### 10.1 The `principal_type` hierarchy

```
  ┌──────────────────────────────────────────────────────────────┐
  │ Tier 3 — FANTOMAS                                            │
  │  • Break-glass principal.                                    │
  │  • Two flavors: DB-backed (user row) and Independent (no row).│
  │  • Full administrative authority, including emergency access. │
  ├──────────────────────────────────────────────────────────────┤
  │ Tier 2 — SUPER_ADMIN                                         │
  │  • Elevated administrator.                                   │
  │  • Can manage other ADMINs and offers.                       │
  │  • Provisioned by bootstrap as `admin1`.                     │
  ├──────────────────────────────────────────────────────────────┤
  │ Tier 1 — ADMIN  (default)                                    │
  │  • Regular administrator.                                     │
  │  • Can author and manage offers.                             │
  │  • Cannot manage other principals.                            │
  └──────────────────────────────────────────────────────────────┘
```

The tiers are **monotonic**: a higher tier holds all permissions of the lower tiers
plus additional capabilities.

### 10.2 The two FANTOMAS flavors (critical distinction)

| Property | DB-backed FANTOMAS | Independent FANTOMAS (break-glass) |
|---|---|---|
| `user` row exists? | Yes — `principal_type = 'FANTOMAS'` | **No** |
| `account` row exists? | Yes | **No** |
| `session` row exists? | Yes (created on login) | **No** |
| Authentication | Better Auth (credential) | `FANTOMAS_SESSION_SECRET` env var |
| Secret source | Stored as a hashed credential in Better Auth | Environment variable only |
| Use case | Normal DB-backed break-glass that goes through the standard auth pipeline | Emergency access when the DB is unavailable or unreachable |
| Bootstrapped by | `pnpm db:bootstrap` | Nothing — DB-independent |

The independent FANTOMAS is a **last-resort, DB-independent break-glass**: its
existence does not depend on any row in the database, and it authenticates purely
via a shared secret in the environment (`FANTOMAS_SESSION_SECRET`). It is the
mechanism used when the database itself is the failure mode (e.g. the `user` table
is corrupted, the connection is down, or all normal principals are locked out).

### 10.3 Bootstrap-provisioned principals

The `pnpm db:bootstrap` command provisions exactly two DB-backed principals:

| Username | `principal_type` | Purpose |
|---|---|---|
| `admin1` | `SUPER_ADMIN` | Primary elevated administrator. |
| `fantomas` | `FANTOMAS` | DB-backed break-glass principal (uses Better Auth). |

The independent FANTOMAS break-glass is **not** provisioned by bootstrap — it is a
runtime concept backed only by `FANTOMAS_SESSION_SECRET` in the environment.

### 10.4 Authorization enforcement location

- **`principal_type` value validity** is enforced by the enum (DB).
- **`principal_type` default** is `ADMIN` (DB).
- **Tier-based authorization decisions** (what an `ADMIN` vs `SUPER_ADMIN` vs
  `FANTOMAS` may do) are enforced by the **application** middleware; the database
  does not encode permission rules.
- The independent FANTOMAS bypasses the `user` table entirely; its authorization is
  recognized by the application when `FANTOMAS_SESSION_SECRET` matches.

---

## 11. Migration Tracking (`drizzle` schema)

Drizzle records applied migrations in a dedicated schema:

| Property | Value |
|---|---|
| Schema | `drizzle` |
| Table | `__drizzle_migrations` |
| Columns | `id` (serial PK), `hash` (text), `created_at` (bigint) |
| Rows present | 3 (id = 1, 2, 3) |
| Extension used | `plpgsql` |

The three migration records correspond to the three migration files applied to
reach the V1 schema. The `hash` column stores the content hash of each migration
file; Drizzle uses these to detect tampering or partial application.

---

## 12. Appendix — Object Cross-Reference

| Object | Schema | Kind | Notes |
|---|---|---|---|
| `account` | public | table | 13 cols; Better Auth |
| `offers` | public | table | 21 cols; Jourdain domain |
| `rateLimit` | public | table | 4 cols; Better Auth rate-limit |
| `session` | public | table | 9 cols; Better Auth |
| `user` | public | table | 14 cols; Better Auth + Jourdain |
| `verification` | public | table | 6 cols; Better Auth |
| `offer_status` | public | enum | 4 values |
| `principal_type` | public | enum | 3 values |
| `__drizzle_migrations` | drizzle | table | migration tracking, 3 rows |
| `plpgsql` | (extension) | extension | default procedural language |

---

*End of canonical schema reference. Authoritative source: Production catalog on Neon
`main`, audited 2026-09-19 against application commit `eac879f9efb6092db43da42888b32dafc2f37a22`.
No schema divergence detected.*
