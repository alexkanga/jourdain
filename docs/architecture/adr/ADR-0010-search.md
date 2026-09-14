# ADR-0010 — Search: PostgreSQL ILIKE + searchParams, No Elasticsearch/API

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-016
RELATED REQ IDS:  FR-050

CONTEXT:
S5 FR-050 is a SHOULD requirement for simple text search on title, company, and location. The search must not require a public API (OOS-015). No Elasticsearch (OWNER S6 §9). The search must remain usable even without a query.

DECISION:
- Query: PostgreSQL `ILIKE` (case-insensitive LIKE) with OR conditions on title, company, location columns.
- Exposure: Server Component reading the `?q=` URL search parameter (`/offres?q=term`). Server-rendered, indexable. No public API route handler.
- pg_trgm: NOT installed in V1 initial. Optional performance optimization; added via a forward migration only if production profiling proves ILIKE needs it.
- No Elasticsearch. No dedicated search service. No public search API endpoint.

ALTERNATIVES CONSIDERED:
- PostgreSQL full-text search (tsvector + GIN index) — rejected: overkill for V1 (adds tsvector column, trigger maintenance, query syntax); ILIKE is sufficient for editorial-scale volumetry.
- Elasticsearch — rejected: OWNER S6 §9 explicitly excludes it for V1; distributed search engine is disproportionate.
- Public API route handler returning JSON — rejected: creates a "public API" that V1 explicitly excludes (INT-001, OOS-015); the search is server-rendered via searchParams.
- pg_trgm in initial migration — rejected: premature optimization; V1 ships without it; added only if profiling proves the need.

RATIONALE:
ILIKE is the simplest query mechanism for "contains" semantics on text columns. Server Component + searchParams is the simplest exposure that remains server-rendered and indexable without creating a public API. For editorial-scale volumetry (single-digit to low-thousands of offers), ILIKE performance is fine without pg_trgm.

CONSEQUENCES:
+ No search infrastructure (no Elasticsearch, no separate service).
+ No public API created solely for search.
+ Search is server-rendered and indexable.
+ pg_trgm is a measured optimization, not an initial dependency.
- ILIKE without pg_trgm may be slow for very large datasets (acceptable for V1; mitigated by adding pg_trgm via forward migration if needed).

VERIFICATION:
Integration test: search for a term present in title → offer appears; search for a term in company → offer appears; search for a term in location → offer appears; empty search → full list. No public API route handler exists for search.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-016 revised), S6 §10.2 (internal route handlers)
