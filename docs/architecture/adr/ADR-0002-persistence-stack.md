# ADR-0002 — Persistence Stack: PostgreSQL Neon + Drizzle + neon-http

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-002 (MANDATED), TD-004, TD-030
RELATED REQ IDS:  DR-010, BR-020, BR-025, BR-070, NFR-001, NFR-060

CONTEXT:
Charter §10 MANDATES PostgreSQL on Neon. S6 must choose the ORM/query layer and the specific Drizzle-Neon driver binding. V1's DB operations are all short, single-statement (bootstrap user creation, session, offer CRUD, public reads). No multi-statement interactive transactions needed.

DECISION:
- Database: PostgreSQL on Neon (MANDATED per Charter §10).
- ORM: Drizzle ORM + Drizzle Kit for migrations. SQL-first, type-safe, no query-engine binary, native Neon serverless support.
- Driver binding: drizzle-orm/neon-http (HTTP-based, no interactive transactions). Underlying package: @neondatabase/serverless.
- Free-text columns for company/sector/category — no separate CRUD modules (TD-021).

ALTERNATIVES CONSIDERED:
- Prisma ORM — rejected: heavier, query-engine binary, less SQL-transparent, Edge runtime limitations historically. Drizzle is simpler for V1.
- drizzle-orm/neon-serverless (WebSocket) — rejected: supports interactive transactions via persistent WebSocket, but V1 has no interactive transactions; adds WebSocket lifecycle complexity for no benefit.
- drizzle-orm/postgres-js (TCP) — rejected: requires persistent connection/pool, fragile on Vercel serverless. Overkill for V1.
- Separate tables for companies/sectors/categories — rejected: OWNER S6 §15 explicitly forbids CRUD modules for these in V1; free-text is the simplest compatible representation.

RATIONALE:
Drizzle is the simplest SQL-first ORM compatible with Neon. neon-http is the simplest binding compatible with V1's short single-statement operations and Vercel serverless. If a future version needs interactive transactions, the binding can be switched for that code path.

CONSEQUENCES:
+ No query-engine binary, smaller bundle, closer to SQL.
+ HTTP-based driver = no WebSocket lifecycle, fastest cold-start on Vercel.
+ Free-text columns avoid premature normalization.
- No db.transaction() for multi-statement atomicity on neon-http (not needed in V1).
- If interactive transactions are needed later, the binding must be switched for that path (documented in TD-030).

VERIFICATION:
Integration tests use a real Neon preview branch (no DB mocking — TD-024). Schema matches S6 §9. pg_trgm NOT installed in V1 initial (optional optimization).

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-002, TD-004, TD-030), S6 §9 (physical data design)
