# ADR-0009 — Offer Public Identity: UUID v4 + /offres/{id}

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-014, TD-015
RELATED REQ IDS:  FR-040, FR-041, FR-042, DR-010

CONTEXT:
S5 requires a public offer detail page at a stable URL. The URL must be durable (no breakage when the title changes), unique, and not leak offer counts (no sequential IDs). S5 does not require SEO-optimized keyword URLs (Charter §13 — success is functional).

DECISION:
- Offer ID: UUID v4 (PostgreSQL native `uuid` type, `gen_random_uuid()` default).
- Public URL: `/offres/{id}` where `{id}` is the UUID v4.
- No slug. No slug-based URL. No redirect table.
- Non-PUBLISHED offers return 404 on the public detail URL (FR-042 — no distinction between "not found" and "not published").
- SEO handled via Next.js metadata API (generateMetadata per route) + sitemap.ts + robots.ts (TD-029).

ALTERNATIVES CONSIDERED:
- /offres/{slug} — rejected: titles can change, requiring slug history or redirect logic; slug uniqueness management adds complexity disproportionate for V1.
- /offres/{id}-{slug} — rejected: adds a slug field to the DB, slug extraction logic, and redirect-on-slug-change behavior; overkill for V1.
- BIGSERIAL (auto-increment integer) — rejected: exposes offer count via URL (/offres/1, /offres/2...); makes ID prediction possible; UUID is safer long-term.

RATIONALE:
`/offres/{id}` with UUID v4 is the simplest durable choice. URLs never break (id is immutable). No collision risk. No slug drift. No redirect table. SEO is handled via metadata, not via the URL path. If SEO becomes a priority in V2, slug-based URLs with redirects can be added without breaking existing UUID URLs.

CONSEQUENCES:
+ URLs are stable and durable.
+ No slug management, no redirect table, no slug-drift problem.
+ UUID prevents count leakage and ID prediction.
- URLs are not keyword-rich (acceptable for V1 — Charter §13).
- Slightly longer URLs (36 chars for UUID vs ~10 for serial; negligible).

VERIFICATION:
E2E: verify public detail page renders for a PUBLISHED offer at /offres/{uuid}. Verify 404 for DRAFT, SUSPENDED, ARCHIVED offers at the same URL pattern. Verify sitemap.ts lists all PUBLISHED offers with their UUID URLs.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-014, TD-015), S6 §10.1 (public API routes)
