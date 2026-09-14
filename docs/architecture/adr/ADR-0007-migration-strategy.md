# ADR-0007 — Migration Strategy: Drizzle Kit + Forward Corrective Doctrine

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-018
RELATED REQ IDS:  OWNER S6 §14

CONTEXT:
V1 needs versioned, reproducible, controlled schema migrations. The bootstrap of system principals (Fantomas + initial ADMIN) must be distinct from demo data seed. No manual modification of the Production schema should occur silently.

DECISION:
- Schema source-controlled in `db/schema.ts` (Drizzle schema-as-code).
- Migrations generated via `drizzle-kit generate`, code-reviewed before merge.
- Applied via `drizzle-kit migrate` (versioned .sql files in `db/migrations/`). Drizzle tracks applied migrations in a meta table.
- NEVER run `drizzle-kit push` against Production or Preview — `push` bypasses the versioned migration record. Only for local dev experimentation.
- NO silent manual modification of the Production schema.
- Rollback: forward corrective migrations preferred over automatic down migrations. If a migration breaks production: (a) Vercel rollback to previous build; (b) write a new forward corrective migration; (c) apply via the normal controlled path. Down migrations retained only for purely additive reversible migrations (add column/table/index). Neon PITR is the ultimate data rollback.
- Bootstrap ≠ seed: `db/bootstrap/` for system principals (Fantomas + initial ADMIN, idempotent, controlled). `db/seed/` for demo data (dev-only, never Production).

ALTERNATIVES CONSIDERED:
- Prisma Migrate — rejected: coupled to Prisma ORM choice (TD-004 chose Drizzle).
- Raw SQL migrations without a tool — rejected: no tracking of applied migrations, no idempotency, error-prone.
- Automatic down migrations as the primary rollback — rejected: down migrations can lose data (dropping a column added by the up migration loses data written to it); forward correction is safer.

RATIONALE:
Drizzle Kit is the official Drizzle migration tool. Forward corrective migrations are safer than down migrations for data integrity. The bootstrap-vs-seed distinction prevents accidental contamination of Production with demo data and ensures system principals are not coupled to demo data being loaded.

CONSEQUENCES:
+ Migrations are versioned, reproducible, and code-reviewed.
+ Forward corrective doctrine preserves data integrity during rollback.
+ Bootstrap is idempotent and separate from demo seed.
- Operator must manually verify target before applying migrations to Production (documented in ADR-0006).

VERIFICATION:
CI: `drizzle-kit generate` on PR verifies schema changes produce a valid migration. Integration tests apply migrations to a real Neon preview branch before running. E2E: verify schema state after migration.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-018 revised), S6 §22 (deployment ordering), ADR-0006 (environment isolation)
