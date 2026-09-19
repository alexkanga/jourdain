# JOURDAIN EMPLOI V1 — Database Rebuild Runbook

Step-by-step procedure to reconstruct the JOURDAIN EMPLOI V1 Production database from
zero. This runbook provisions an empty Neon database, applies the migration chain,
bootstraps the two DB-backed principals, verifies the result, and ships.

> **Authoritative scope:** Application commit `eac879f9efb6092db43da42888b32dafc2f37a22`.
> Production target: https://jourdain-three.vercel.app.
> Canonical schema: see `JOURDAIN_DATABASE_SCHEMA_REFERENCE.md`.

> **No real credentials are used in this document.** All values below are placeholders.

---

## 0. Safety & Scope

- This runbook **rebuilds the database only**. It does not migrate application data.
- The rebuild is **idempotent against an empty database**: re-running migration on a
  non-empty database may fail or produce drift — see §8 (STOP conditions).
- All operations are performed by a human operator with access to the Neon console and
  the application repository at the target commit.

---

## 1. Prerequisites

| # | Requirement | How to verify |
|---|---|---|
| 1 | Application repository checked out at commit `eac879f9efb6092db43da42888b32dafc2f37a22` | `git rev-parse HEAD` matches |
| 2 | Node.js / pnpm toolchain installed | `pnpm --version` |
| 3 | Drizzle Kit present (`pnpm db:migrate` resolves) | `pnpm exec drizzle-kit --version` |
| 4 | A Neon account / project with permission to create branches | Console access |
| 5 | A secure channel to set environment variables (`.env` / Vercel project env) | — |
| 6 | Two strong, randomly-generated secrets available (see §3) | `openssl rand -base64 32` |

---

## 2. Create an Empty Neon Database

1. In the Neon console, create a **new project** (or a new `main` branch in an existing
   project) that will host the rebuild.
2. The new database must be **completely empty** — no application tables, no enums,
   no `drizzle` schema. (Neon creates the default `public` schema and the `plpgsql`
   extension automatically; this is expected.)
3. Copy the **connection string** for the new database. It has the form:
   `postgresql://<user>:<password>@<host>/<dbname>?sslmode=require`
4. This value will be used as `PROD_DATABASE_URL` (and aliased as `DATABASE_URL` for the
   migration command).

---

## 3. Environment Variables

### 3.1 Runtime / deployment variables

These must be set in the deployment environment (Vercel project → Settings →
Environment Variables) and locally for the bootstrap step.

| Variable | Purpose | Example (placeholder) |
|---|---|---|
| `PROD_DATABASE_URL` | Connection string for the Production Neon database | `postgresql://USER:PASS@HOST/DB?sslmode=require` |
| `BETTER_AUTH_SECRET` | Secret used to sign Better Auth sessions/tokens | `__GENERATE_WITH_OPENSSL_RAND_BASE64_32__` |
| `BETTER_AUTH_URL` | Canonical base URL of the deployed app (Better Auth issuer) | `https://jourdain-three.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL exposed to the browser | `https://jourdain-three.vercel.app` |
| `FANTOMAS_SESSION_SECRET` | Shared secret for the **independent** DB-less FANTOMAS break-glass | `__GENERATE_WITH_OPENSSL_RAND_BASE64_32__` |

> `BETTER_AUTH_SECRET` and `FANTOMAS_SESSION_SECRET` must be **independent** random
> values. Do not reuse one for the other. Generate with:
> `openssl rand -base64 32`

### 3.2 Bootstrap-only variables

These are required **only** for the `pnpm db:bootstrap` step (§5) and need not be
present in the long-term deployment environment. They provide the credentials for the
two DB-backed principals created by bootstrap.

| Variable | Purpose | Example (placeholder) |
|---|---|---|
| `BOOTSTRAP_ADMIN_USERNAME` | Username for the SUPER_ADMIN principal | `admin1` |
| `BOOTSTRAP_ADMIN_PASSWORD` | Initial password for `admin1` | `__STRONG_PASSWORD__` |
| `BOOTSTRAP_FANTOMAS_USERNAME` | Username for the DB-backed FANTOMAS principal | `fantomas` |
| `BOOTSTRAP_FANTOMAS_PASSWORD` | Initial password for DB-backed `fantomas` | `__STRONG_PASSWORD__` |
| `DATABASE_URL` | Alias of `PROD_DATABASE_URL` used by the bootstrap script | (same as `PROD_DATABASE_URL`) |

> After bootstrap completes, the bootstrap-only variables can be removed from the
> environment. The two principals already exist in the `user`/`account` tables.

---

## 4. Apply the Migration Chain

The migration chain creates the `public` tables, enums, constraints, indexes, and the
`drizzle.__drizzle_migrations` tracking table. It is the **single source of truth** for
structure (see Authority Rules in the schema reference).

### 4.1 Command

```bash
# Set DATABASE_URL to the empty Neon database connection string
export DATABASE_URL="postgresql://USER:PASS@HOST/DB?sslmode=require"

# Apply all pending migrations
pnpm db:migrate
```

> `pnpm db:migrate` is a thin wrapper over `drizzle-kit migrate` and uses `DATABASE_URL`
> to connect. It must point at the **empty** Neon database from §2.

### 4.2 Expected outcome

- 6 application tables created in `public`: `account`, `offers`, `rateLimit`,
  `session`, `user`, `verification`.
- 2 enums created in `public`: `offer_status`, `principal_type`.
- 10 indexes created (6 PK + 2 unique + 2 explicit on `offers`).
- 2 foreign keys created (both `ON DELETE CASCADE`).
- 34 NOT NULL check constraints created.
- The `drizzle` schema and `drizzle.__drizzle_migrations` table created.
- **3 migration records** inserted into `drizzle.__drizzle_migrations` (id = 1, 2, 3).

### 4.3 STOP conditions for this step

- The command exits non-zero → **STOP**, inspect the migration output, do not run
  bootstrap. A partial migration leaves the database in an inconsistent state; restore
  the empty Neon branch from snapshot and re-run.
- `drizzle.__drizzle_migrations` already contains rows before this step → the database
  was not empty. **STOP**, recreate the empty branch, re-run.

---

## 5. Bootstrap the DB-Backed Principals

The bootstrap script provisions the two DB-backed principals: `admin1` (SUPER_ADMIN)
and `fantomas` (DB-backed FANTOMAS).

### 5.1 Command

```bash
# Runtime variables required by bootstrap
export PROD_DATABASE_URL="postgresql://USER:PASS@HOST/DB?sslmode=require"
export DATABASE_URL="$PROD_DATABASE_URL"
export BETTER_AUTH_SECRET="__GENERATE_WITH_OPENSSL_RAND_BASE64_32__"
export BETTER_AUTH_URL="https://jourdain-three.vercel.app"
export NEXT_PUBLIC_SITE_URL="https://jourdain-three.vercel.app"
export FANTOMAS_SESSION_SECRET="__GENERATE_WITH_OPENSSL_RAND_BASE64_32__"

# Bootstrap-only variables
export BOOTSTRAP_ADMIN_USERNAME="admin1"
export BOOTSTRAP_ADMIN_PASSWORD="__STRONG_PASSWORD__"
export BOOTSTRAP_FANTOMAS_USERNAME="fantomas"
export BOOTSTRAP_FANTOMAS_PASSWORD="__STRONG_PASSWORD__"

# Run the bootstrap
pnpm db:bootstrap
```

### 5.2 Expected outcome

| Principal | `username` | `principal_type` | `user` row | `account` row | Notes |
|---|---|---|---|---|---|
| Elevated admin | `admin1` | `SUPER_ADMIN` | created | created (`credential`) | Primary administrator |
| DB-backed break-glass | `fantomas` | `FANTOMAS` | created | created (`credential`) | DB-backed FANTOMAS |

The **independent FANTOMAS break-glass** is **not** created by bootstrap — it has no
database representation. It is recognized at runtime solely by matching
`FANTOMAS_SESSION_SECRET` in the environment.

### 5.3 STOP conditions for this step

- Bootstrap exits non-zero → **STOP**. Do not deploy. Inspect which principal failed
  to provision. A partial bootstrap (one principal created, the other not) must be
  corrected before continuing — re-run bootstrap (it should be idempotent for missing
  principals and skip already-present ones).
- The `user` table already contains a row with `username = 'admin1'` or
  `username = 'fantomas'` from a prior run → bootstrap should skip re-creating it;
  if it errors instead, **STOP** and reconcile manually.

---

## 6. Verification Procedure

Run each check below against the rebuilt database. **All must pass** before deployment.

### 6.1 Tables present

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('public','drizzle')
ORDER BY table_schema, table_name;
```
**Expected:** 6 rows in `public` (`account`, `offers`, `rateLimit`, `session`, `user`,
`verification`) and 1 row in `drizzle` (`__drizzle_migrations`).

### 6.2 Enums present

```sql
SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
```
**Expected:**
- `offer_status` → `{DRAFT, PUBLISHED, SUSPENDED, ARCHIVED}`
- `principal_type` → `{ADMIN, SUPER_ADMIN, FANTOMAS}`

### 6.3 Migration records

```sql
SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id;
```
**Expected:** exactly **3 rows** with id = 1, 2, 3.

### 6.4 Foreign keys

```sql
SELECT conname, conrelid::regclass AS "table", confrelid::regclass AS "references"
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'public'::regnamespace
ORDER BY conname;
```
**Expected:** 2 rows:
- `account` → `user`
- `session` → `user`

Both with `ON DELETE CASCADE` (verify via `pg_constraint.confdeltype = 'c'`).

### 6.5 Unique constraints

```sql
SELECT conname, conrelid::regclass AS "table"
FROM pg_constraint
WHERE contype = 'u' AND connamespace = 'public'::regnamespace;
```
**Expected:** 2 rows: `session_token_unique` on `session`, `user_username_unique` on `user`.

### 6.6 Indexes

```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
**Expected:** 10 indexes (see `JOURDAIN_DATABASE_OBJECT_INVENTORY.md` §5), including
`idx_offers_status` and `idx_offers_created_at_desc`.

### 6.7 Bootstrapped principals

```sql
SELECT username, principal_type, banned, email_verified
FROM "user"
WHERE username IN ('admin1','fantomas')
ORDER BY username;
```
**Expected:** exactly 2 rows:
- `admin1` with `principal_type = 'SUPER_ADMIN'`
- `fantomas` with `principal_type = 'FANTOMAS'`

```sql
SELECT a.provider_id, u.username
FROM account a
JOIN "user" u ON u.id = a.user_id
WHERE u.username IN ('admin1','fantomas')
ORDER BY u.username;
```
**Expected:** 2 rows, one `credential` account per principal.

### 6.8 Independent FANTOMAS secret set

```bash
# Confirm the environment variable is set in the deployment target (Vercel):
#   FANTOMAS_SESSION_SECRET  ->  non-empty, matches the value used locally.
```
**Expected:** the variable is present and non-empty. (It is not stored in the DB and
cannot be verified via SQL.)

---

## 7. Deployment Procedure

1. Confirm all verification checks in §6 pass.
2. In the Vercel project for https://jourdain-three.vercel.app, set the **runtime**
   environment variables from §3.1:
   - `PROD_DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `FANTOMAS_SESSION_SECRET`
3. Do **not** set the bootstrap-only variables (§3.2) in the long-term deployment
   environment — they are not needed after bootstrap and should be removed.
4. Trigger a redeploy of the application at commit
   `eac879f9efb6092db43da42888b32dafc2f37a22`.
5. After deploy, smoke-test:
   - Sign in as `admin1` → lands in the admin UI.
   - Sign in as DB-backed `fantomas` → lands in the admin UI with FANTOMAS authority.
   - Trigger the independent FANTOMAS break-glass with `FANTOMAS_SESSION_SECRET` →
     granted FANTOMAS authority without any DB-backed session row.

---

## 8. STOP / Rollback Conditions

**STOP immediately** if any of the following occur:

| # | Condition | Action |
|---|---|---|
| 1 | `pnpm db:migrate` exits non-zero | Restore the empty Neon branch from snapshot; fix the migration source; re-run from §4. Do not run bootstrap. |
| 2 | `drizzle.__drizzle_migrations` is non-empty before migration | Database was not empty. Recreate the empty branch; re-run. |
| 3 | `pnpm db:bootstrap` exits non-zero | Do not deploy. Inspect output. If one principal was created and the other not, re-run bootstrap (idempotent for missing principals). |
| 4 | Verification §6.1–6.6 fails (structure) | Schema drift. Restore empty branch; re-run migration. Do not deploy. |
| 5 | Verification §6.7 fails (principals) | Bootstrap did not provision correctly. Re-run bootstrap; if it still fails, restore empty branch and re-run from §4. |
| 6 | Verification §6.8 fails (FANTOMAS secret) | Set `FANTOMAS_SESSION_SECRET` in the deployment environment before deploying. |
| 7 | The migration count is not exactly 3 after `db:migrate` | A migration was skipped or an extra one applied. Reconcile the migration chain against the canonical source; do not deploy. |

### Rollback (full)

To roll back the entire rebuild:

1. In the Neon console, restore the `main` branch to the snapshot taken before §4
   (the empty database state), or delete the rebuilt branch if it is disposable.
2. No application data is lost — the rebuild never imported production data.
3. Reset/rotate the secrets used (`BETTER_AUTH_SECRET`, `FANTOMAS_SESSION_SECRET`) if
   they were exposed during the failed attempt.

---

## 9. Appendix — Command Quick Reference

```bash
# Migrate
export DATABASE_URL="postgresql://USER:PASS@HOST/DB?sslmode=require"
pnpm db:migrate

# Bootstrap (set all §3.1 and §3.2 variables first)
pnpm db:bootstrap

# Verify migration count
psql "$DATABASE_URL" -c "SELECT count(*) FROM drizzle.__drizzle_migrations;"

# Verify principals
psql "$DATABASE_URL" -c \
  "SELECT username, principal_type FROM \"user\" ORDER BY username;"
```

*End of rebuild runbook. No real credentials appear in this document.*
