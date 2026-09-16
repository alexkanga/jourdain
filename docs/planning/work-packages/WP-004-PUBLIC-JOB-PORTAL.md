# WP-004 — Public Job Portal

## 1. Contract Status

| Field | Value |
|---|---|
| WP ID | WP-004 |
| Name | Public Job Portal |
| Source Milestone | MS-004 — Public Job Portal (DELIVERY_ROADMAP §7) |
| Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| Canonical dev SHA (at S9 start) | `9342d9a3e6e0d35e729fc2bf9d9c0e574f83bf69` |
| Canonical main SHA (at S9 start) | `0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d` |
| Source Charter (S4) | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Source Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| Source Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` at `7c85323` |
| Source Project Manifest (S7) | `docs/architecture/PROJECT_MANIFEST.md` at `0b8b436` |
| Source Delivery Roadmap (S8) | `docs/planning/DELIVERY_ROADMAP.md` at `2796c2d` |
| Previous WP | WP-003 — CLOSED / PASS WITH NON-BLOCKING FINDINGS (impl head `35f80b3`) |
| AISE S0 Version | 0.2 (§26 REMOTE RUNTIME COST & QUOTA SAFETY active) |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED (requires OWNER APPROVE + AUTHORIZE) |
| S10 Started | NO |
| WP-005 Started | NO |

---

## 2. Purpose

Deliver the public job-offer browsing experience: any anonymous visitor can browse PUBLISHED offers at the root URL, open an offer's detail page, read its formatted description, and (SHOULD) search by title/company/location — with no authentication required, no admin controls visible, and no candidate/application features.

This WP builds entirely on the verified foundations from WP-001 through WP-003. It does NOT modify the database schema, the Better Auth foundation, the admin offer management system, or the authorization architecture. It adds public read-only routes that query the existing offers table with server-side PUBLISHED-only filtering.

---

## 3. Requirements Covered

**REQUIREMENTS COVERED NOW (this WP):**

| Requirement | Priority | Coverage | Notes |
|---|---|---|---|
| FR-040 (public offer list at root URL) | MUST | PRIMARY | Root URL `/` = PUBLISHED offers list, sorted by published_at DESC |
| FR-041 (public offer detail) | MUST | PRIMARY | `/offres/{id}` — full detail of PUBLISHED offer (per ADR-0009) |
| FR-042 (non-published returns not-found) | MUST | PRIMARY | DRAFT/SUSPENDED/ARCHIVED → 404; no status/existence leak |
| FR-050 (public simple text search — SHOULD) | SHOULD | PRIMARY | ILIKE on title + company + location via `?q=` searchParams (per ADR-0010) |
| FR-060 (empty public offer list state) | MUST | PRIMARY | "Aucune offre disponible actuellement" when no PUBLISHED offers |
| BR-025 (public visibility — PUBLISHED only) | MUST | PRIMARY | Server-side filter `WHERE status = 'PUBLISHED'` |
| BR-033 (unknown company presentation) | MUST | PRIMARY | Card: omit company if absent; Detail: "Entreprise non communiquée" |
| BR-034 (description formatting) | MUST | PRIMARY | Tiptap JSON → React server-side renderer (per ADR-0005) |
| BR-040 (application modalities informational) | MUST | PRIMARY | Display as text/links; NO Apply button, NO application workflow |
| BR-050 (source optional) | MUST | PRIMARY | Display source_name/source_url if present |
| BR-070 (public sort: published_at DESC) | MUST | PRIMARY | Default sort by published_at DESC |
| BR-071 (tie-breaker: created_at DESC) | SHOULD | PRIMARY | Deterministic tie-breaker when published_at equal |
| PERM-001 (public read access) | MUST | PRIMARY | Any visitor can browse without authentication |
| NFR-040 (French only) | MUST | PRIMARY | All public UI strings in French |
| TD-029 (SEO — sitemap + robots + metadata) | MUST | PRIMARY | app/sitemap.ts, app/robots.ts, generateMetadata per route |

**MILESTONE REQUIREMENTS NOT IN THIS WP:**

Full Playwright E2E suite (MS-005), Vercel/Neon deployment configuration (MS-006), accessibility audit (MS-005), security hardening (MS-005), performance optimization (MS-005).

**ORPHAN SCOPE: 0**

---

## 4. Entry Conditions

| Condition | Status |
|---|---|
| MS-001 / WP-001 CLOSED / PASS | YES (impl commit `45fa8b7`) |
| MS-002 / WP-002 CLOSED / PASS | YES (impl commit `6d0027a`) |
| MS-003 / WP-003 CLOSED / PASS WITH NON-BLOCKING FINDINGS | YES (impl head `35f80b3`) |
| MS-004 selected as next milestone | YES (DELIVERY_ROADMAP §7) |
| MS-004 entry conditions: "MS-003 CLOSED / PASS" | YES |
| AISE S0 v0.2 §26 QUOTA-SAFETY active | YES |
| BLOCKING PRODUCT AMBIGUITIES | 0 |
| BLOCKING TECHNICAL AMBIGUITIES | 0 |
| Technical baseline (S6/S7) | APPROVED |
| Database schema (offers table + indexes) | EXISTS from WP-002; no migration needed |
| Admin offer management | EXISTS from WP-003; no modification needed |

---

## 5. In Scope

### Public Offer List (Root URL `/`)

- `app/(public)/page.tsx` (Server Component) — root URL `/` displays PUBLISHED offers as cards per S5 §10.1. This is the SINGLE canonical root route. The existing WP-001 placeholder `app/page.tsx` MUST be removed by S10 so there is exactly ONE page resolving to `/`.
- Server-side query: `SELECT ... FROM offers WHERE status = 'PUBLISHED' ORDER BY published_at DESC, created_at DESC` (BR-070, BR-071)
- Cards show: title (always), company (if present — omit if absent per BR-033), location (if present), contract_type (if present), published_at (always — formatted as French date), application_deadline (if present), "Voir l'offre" link to `/offres/{id}` (always)
- Pagination: simple page-based server-side pagination (FR-040 acceptance: "list is navigable when the number of offers exceeds a single page")
- Empty state: "Aucune offre disponible actuellement" (FR-060)

### Public Offer Detail (`/offres/{id}`)

- `app/(public)/offres/[id]/page.tsx` (Server Component) — displays full detail of a PUBLISHED offer per S5 §10.2. Canonical route: `/offres/{uuid}` (ADR-0009). No competing detail route.
- Server-side query: `SELECT ... FROM offers WHERE id = ? AND status = 'PUBLISHED'` — non-PUBLISHED or nonexistent → `notFound()` (FR-042, ADR-0009)
- Detail shows: title, company (if absent: "Entreprise non communiquée" per BR-033), sector, category, contract_type, education_level, experience, location, dates (source_publication_date, published_at, application_deadline — if present), full description (Tiptap rendered), application modalities block (if any present — text/email/URL as links, NO Apply button per BR-040), source block (if source_name or source_url present)
- Malformed UUID → controlled not-found (no DB query)
- `generateMetadata` per route for SEO (TD-029)

### Public Search (SHOULD — FR-050)

- Search via URL searchParams `?q=term` on the root URL (Server Component reads searchParams, passes to query)
- ILIKE on title + company + location (case-insensitive, OR conditions) per ADR-0010
- Only searches PUBLISHED offers (combined with status filter)
- Empty search → full list
- No public API endpoint, no Elasticsearch, no external search service

### Tiptap Public Rendering (Server Component — server-side, read-only)

- `components/public/OfferDescription.tsx` (or equivalent) — renders Tiptap JSON to safe React elements in a Server Component.
- Required behavior: Tiptap JSON → safe React element rendering → no raw HTML source → no dangerouslySetInnerHTML → no arbitrary HTML injection.
- Supports V1 subset: paragraphs, headings (1-3), bullet lists, ordered lists, links, bold, italic (same subset as admin editor).
- No editor instance in public page. No unnecessary client JavaScript. No raw HTML roundtrip.
- The public detail page must remain Server Component / server-first unless a genuine technical requirement proves otherwise. Do NOT convert the public detail page into a Client Component merely to reuse admin editor tooling.
- S10 may use the simplest technically valid option: a small deterministic JSON-to-React renderer is acceptable if it satisfies ADR-0005 semantics. Do NOT create a generalized rich-text framework.
- If S10 discovers that the canonical rendering requirement cannot be safely implemented with existing dependencies: STOP and report `TIPTAP PUBLIC RENDERING DEPENDENCY GAP`. Do NOT silently install @tiptap/static-renderer, another rich text renderer, HTML sanitizer library, or any new package. OWNER authorization is required before adding a new dependency.

### SEO (canonically required by TD-029, ADR-0009, S8 MS-004 roadmap)

- `app/sitemap.ts` — generates sitemap.xml listing all PUBLISHED offers with their `/offres/{id}` URLs (TD-029, ADR-0009 verification)
- `app/robots.ts` — allows indexing of public pages, disallows `/admin/*` (TD-029)
- `generateMetadata` on each public page (list + detail) for title/description (TD-029)
- Canonical: S6 TD-029 states `SELECTED: Next.js metadata API (generateMetadata per route) + sitemap.xml route + robots.txt route`. ADR-0009 verification requires `Verify sitemap.ts lists all PUBLISHED offers`. S8 MS-04 roadmap lists `app/sitemap.ts, app/robots.ts` in TECHNICAL AREAS.

### Public Route Group (frozen topology)

- Route group: `app/(public)/` — route groups do NOT change URLs.
- `app/(public)/page.tsx` — root URL `/` = PUBLISHED offers list (FR-040). SINGLE canonical root route.
- `app/(public)/offres/[id]/page.tsx` — detail at `/offres/{uuid}` (FR-041, FR-042, ADR-0009).
- `app/(public)/layout.tsx` — minimal public layout (no auth, no admin controls). ONLY if genuinely useful; do not create unnecessary nested routing.
- `app/page.tsx` (existing WP-001 placeholder) MUST be removed by S10. There must be exactly ONE page resolving to `/`. Do NOT create `/` and `/offres` as competing public list pages. Canonical list route = `/`. Canonical detail route = `/offres/[id]`.

### Tests

- Integration tests against TEST_DATABASE_URL (per AISE S0 v0.2 §26):
  - PUBLISHED offers visible in public list
  - DRAFT/SUSPENDED/ARCHIVED offers NOT visible
  - published_at DESC ordering verified
  - Detail page shows PUBLISHED offer
  - Detail page returns not-found for DRAFT/SUSPENDED/ARCHIVED/nonexistent
  - Malformed UUID returns not-found (no DB query)
  - Tiptap JSON renders correctly
  - Search by title/company/location (if implemented)
  - Empty state when no PUBLISHED offers
  - Tiptap JSON rendering preserves formatting (paragraphs, lists, headings, links)

---

## 6. Out of Scope

### MS-005 / WP-005
- Full Playwright E2E suite
- Browser matrix testing
- CI E2E pipeline
- Accessibility audit
- Security hardening
- Performance optimization

### MS-006 / WP-006
- Vercel configuration
- Neon Production/Preview environment
- GitHub Actions CI
- Production deployment
- Environment variables configuration

### Candidate/Application Features
- Candidate accounts — EXCLUDED
- CV upload — EXCLUDED
- Application submission — EXCLUDED
- Favorites — EXCLUDED
- Messaging — EXCLUDED
- Apply button — EXCLUDED (BR-040)

### Recruiter
- Recruiter self-service — EXCLUDED

### Other
- Payments, AI matching, notifications, mobile app — EXCLUDED
- Multilingual, multi-tenant — EXCLUDED (NFR-040: French only)
- Public API — EXCLUDED (INT-001, OOS-015)
- Complex RBAC, SUPER_ADMIN — EXCLUDED
- Social sharing, logos — EXCLUDED
- Duplicate-offer action — EXCLUDED
- Physical delete — EXCLUDED
- Automatic expiration — EXCLUDED
- Public filters beyond search — EXCLUDED (no location/contract_type/sector filter widgets in V1)

### Database / Auth Changes
- Schema changes — EXCLUDED (read-only queries on existing offers table)
- Better Auth changes — EXCLUDED (public routes have NO auth)
- Migration — EXCLUDED (no schema changes needed)
- New capabilities — EXCLUDED

### Admin Changes
- Any modification to admin routes, components, Server Actions — EXCLUDED (admin non-regression)

---

## 7. Intended Behavior

### Public Offer List Flow (FR-040, BR-025, BR-070, BR-071)
```
Anonymous visitor opens root URL /
  → Server Component queries: SELECT * FROM offers WHERE status='PUBLISHED' ORDER BY published_at DESC, created_at DESC
  → Each PUBLISHED offer displayed as card per S5 §10.1:
    - Title (always)
    - Company (if present; omitted if absent — no placeholder per BR-033)
    - Location (if present; omitted if absent)
    - Contract type (if present; omitted if absent)
    - published_at (always — formatted as French date)
    - application_deadline (if present; omitted if absent)
    - "Voir l'offre" link → /offres/{id}
  → Pagination if offers exceed one page
  → Empty state: "Aucune offre disponible actuellement" (FR-060) if no PUBLISHED offers
  → Optional search via ?q=term: ILIKE on title + company + location (FR-050 SHOULD)
```

### Public Offer Detail Flow (FR-041, FR-042, ADR-0009)
```
Anonymous visitor opens /offres/{uuid}
  → Server Component validates UUID format (malformed → notFound(), no DB query)
  → Server Component queries: SELECT * FROM offers WHERE id={uuid} AND status='PUBLISHED'
  → If no row (nonexistent OR non-PUBLISHED) → notFound() (FR-042: no status/existence leak)
  → If PUBLISHED → render full detail per S5 §10.2:
    - Title (always)
    - Company (if present; "Entreprise non communiquée" if absent — BR-033)
    - Sector, Category (if present; omitted if absent)
    - Contract type, Education level, Experience (if present; omitted if absent)
    - Location (if present; omitted if absent)
    - Dates: source_publication_date (if present), published_at (always), application_deadline (if present)
    - Full description (Tiptap JSON → React server-side renderer — BR-034, ADR-0005)
    - Application modalities block (if any present — text/email/URL as links; NO Apply button — BR-040)
    - Source block (if source_name or source_url present — URL as link)
  → generateMetadata for SEO (TD-029)
```

### Public Search Flow (FR-050 SHOULD, ADR-0010)
```
Anonymous visitor opens /?q=term
  → Server Component reads searchParams.q
  → Query: SELECT * FROM offers WHERE status='PUBLISHED' AND (title ILIKE '%term%' OR company ILIKE '%term%' OR location ILIKE '%term%') ORDER BY published_at DESC, created_at DESC
  → Results displayed as cards (same as list)
  → Empty search (?q= or no ?q=) → full PUBLISHED list
  → No results for search term → "Aucune offre ne correspond à votre recherche"
```

---

## 8. Business Rules

| Rule | Source | Restatement for WP-004 |
|---|---|---|
| BR-025 | S5 §6.1 | Only PUBLISHED offers are publicly visible. Server-side filter `WHERE status = 'PUBLISHED'`. |
| BR-033 | S5 §6.2 | Card: omit company if absent. Detail: "Entreprise non communiquée" if absent. Never fabricate. |
| BR-034 | S5 §6.2 | Description formatting preserved via Tiptap JSON → React renderer. |
| BR-040 | S5 §6.3 | Application modalities are informational only. No Apply button, no application workflow. |
| BR-050 | S5 §6.4 | Source is optional. Display if present. No automated import. |
| BR-070 | S5 §6.6 | Public sort: published_at DESC (MUST). |
| BR-071 | S5 §6.6 | Tie-breaker: created_at DESC (SHOULD — deterministic). |
| BR-080 | S5 §6.7 | URL/email validation already enforced at admin save time. Public pages display valid values. |

---

## 9. Data Semantics

### Offers Table (db/schema.ts — EXISTS from WP-002, no changes)

WP-004 reads from the existing offers table. No schema changes, no migrations.

### Public Query Layer

A new `lib/server/services/public-offers.ts` (or extension of existing `offers.ts`) provides:
- `listPublishedOffers(opts?: { q?: string; page?: number })` — queries PUBLISHED offers with optional search and pagination, sorted by published_at DESC, created_at DESC
- `getPublishedOfferById(id: string)` — queries a single offer with `WHERE id = ? AND status = 'PUBLISHED'`, returns null if not found or not PUBLISHED

### MIGRATION REQUIRED: NO

WP-004 uses the existing Offer schema. No schema changes are required.

---

## 10. Permission / Actor Semantics

| Actor | Auth Required | Access |
|---|---|---|
| PUBLIC (anonymous visitor) | NO | Read PUBLISHED offers only. No admin controls visible. No mutations. |

Public routes have NO authentication middleware. No Better Auth session check on public routes. The admin area remains protected by `app/admin/(protected)/layout.tsx` (server-side getPrincipal guard from WP-003).

---

## 11. Technical Boundaries

- **ADR-0001 (modular monolith):** Public routes are part of the same Next.js app. No separate frontend/backend.
- **ADR-0005 (rich text):** Tiptap JSON → React server-side renderer for public description. No dangerouslySetInnerHTML.
- **ADR-0009 (offer URL):** `/offres/{uuid}` for public detail. UUID v4. Non-PUBLISHED → 404.
- **ADR-0010 (search):** PostgreSQL ILIKE on title + company + location. Server Component + searchParams. No Elasticsearch, no public API.
- **TD-029 (SEO):** Next.js metadata API + sitemap.ts + robots.ts.
- **S0 §26 (quota safety):** LOCAL app runtime for automated UI tests. TEST_DATABASE_URL for integration tests. No Vercel, no remote E2E, no Production access.

---

## 12. Security Contract

- **Server-side PUBLISHED-only enforcement:** All public queries filter `WHERE status = 'PUBLISHED'`. Not just UI hiding — the data layer enforces visibility.
- **Malformed UUID handling:** Validate UUID format before DB query; malformed → notFound() (no DB query, no error leak).
- **Hidden-status isolation:** DRAFT, SUSPENDED, ARCHIVED offers return the same not-found behavior as nonexistent offers (FR-042). No status/existence leak.
- **Safe Tiptap rendering:** React server-side renderer produces safe React elements from JSON. No dangerouslySetInnerHTML, no raw HTML.
- **Safe external links:** application_url and source_url rendered as `<a href>` with `rel="noopener noreferrer" target="_blank"`. Already validated at admin save time.
- **No privileged mutation exposure:** Public routes are read-only. No Server Actions. No admin capabilities accessible.
- **No authentication requirement:** Public read operations do not call Better Auth, do not check sessions, do not use requireCapability.
- **Admin data leakage prevention:** Admin-only fields (role, banned, principalType, email) are NOT displayed on public pages. Only offer business fields (per S5 §10) are shown.

---

## 13. Admin Non-Regression

WP-004 must NOT modify any WP-003 admin code:

- `app/admin/` — NO CHANGES
- `components/admin/` — NO CHANGES
- `lib/server/auth/` — NO CHANGES
- `lib/server/services/offers.ts` — MAY be extended with read-only public query functions, OR a new `lib/server/services/public-offers.ts` MAY be created to avoid modifying the admin service file. S10 implementation freedom.
- `middleware.ts` — NO CHANGES (matcher is `/admin/:path*` only; public routes are not affected)
- `lib/auth-client.ts` — NO CHANGES

---

## 14. Acceptance Contract

| # | Condition | Observable Evidence |
|---|---|---|
| AC-001 | Public list at root URL | `/` renders PUBLISHED offers as cards; title, company (if present), location (if present), contract_type (if present), published_at, "Voir l'offre" link visible |
| AC-002 | PUBLISHED-only visibility | DRAFT, SUSPENDED, ARCHIVED offers NOT visible in public list (integration test) |
| AC-003 | published_at DESC ordering | Offers ordered by published_at descending; created_at DESC tie-breaker (integration test) |
| AC-004 | Public detail at /offres/{uuid} | Detail page renders full offer content for PUBLISHED offer (integration test) |
| AC-005 | Non-published returns not-found | DRAFT/SUSPENDED/ARCHIVED offer UUID → 404 not-found (integration test) |
| AC-006 | Nonexistent returns not-found | Valid but nonexistent UUID → 404 not-found (integration test) |
| AC-007 | Malformed UUID returns not-found | Non-UUID string → 404 without DB query (integration test) |
| AC-008 | No status/existence leak | Not-found response is identical for nonexistent and non-PUBLISHED (FR-042) |
| AC-009 | Optional fields omitted gracefully | Absent company: omitted on card; "Entreprise non communiquée" on detail (BR-033). Absent optional fields: omitted (no placeholder) |
| AC-010 | Tiptap description rendered | Tiptap JSON renders as safe React elements: paragraphs, headings, lists, links, bold, italic (integration test) |
| AC-011 | No dangerouslySetInnerHTML | No `dangerouslySetInnerHTML` in public rendering code (code inspection) |
| AC-012 | Application modalities informational | Modalities displayed as text/links; NO Apply button (BR-040) (code inspection) |
| AC-013 | Source block displayed if present | source_name and source_url displayed as text/link if present (integration test) |
| AC-014 | Empty state | "Aucune offre disponible actuellement" when no PUBLISHED offers (FR-060) |
| AC-015 | Search (SHOULD) | `?q=term` narrows list by ILIKE on title + company + location; empty search → full list (integration test — if implemented; if descoped, OWNER approval required) |
| AC-016 | Pagination | List is navigable when offers exceed one page (FR-040) |
| AC-017 | French UI | All public UI strings in French (NFR-040) (code inspection) |
| AC-018 | No auth required | Public pages accessible without session cookie (integration test) |
| AC-019 | No admin controls visible | No admin links, buttons, or controls on public pages (code inspection) |
| AC-020 | Admin non-regression | Admin routes still work after WP-004 (admin login, offer list, lifecycle — integration tests still pass) |
| AC-021 | Sitemap | app/sitemap.ts generates valid sitemap.xml with PUBLISHED offer URLs (integration test) |
| AC-022 | Robots | app/robots.ts allows public pages, disallows /admin/* (code inspection) |
| AC-023 | generateMetadata | Public pages export generateMetadata with title/description (code inspection) |
| AC-024 | Root page served by route group | `app/(public)/page.tsx` is the root URL `/`; `app/page.tsx` placeholder removed; exactly ONE page resolves to `/` |
| AC-025 | No schema changes | db/schema.ts unchanged; no new migrations (code inspection) |
| AC-026 | No auth core changes | lib/server/auth/* unchanged (code inspection) |
| AC-027 | lint PASS | pnpm lint exit 0 |
| AC-028 | typecheck PASS | pnpm typecheck exit 0 |
| AC-029 | tests PASS | pnpm test exit 0 (all existing + new tests) |
| AC-030 | build PASS | pnpm build exit 0 |
| AC-031 | No secret committed | .env.local not tracked; no secrets in code (code inspection) |
| AC-032 | Quota safety | Tests use TEST_DATABASE_URL; no Vercel; no Production access; no remote E2E (per S0 v0.2 §26) |
| AC-033 | No WP-005 work | No Playwright suite, no CI E2E pipeline (code inspection) |
| AC-034 | No Vercel config | No vercel.json, no .vercel (code inspection) |
| AC-035 | No empty directories | All created directories contain real files |

---

## 15. Verification Expectations (S11)

S11 must independently verify:

- **Integration tests (Vitest against real TEST_DATABASE_URL):** all lifecycle visibility rules, ordering, detail, not-found, search, Tiptap rendering
- **Quality gates:** lint, typecheck, test, build all PASS
- **Code inspection:** no dangerouslySetInnerHTML, no admin controls on public pages, no schema changes, no auth core changes, French UI strings, sitemap/robots present
- **Real browser verification (Playwright, localhost only):** open `/` → see PUBLISHED offers → open detail → verify Tiptap rendering → search (if implemented) → verify empty state. Per AISE S0 v0.2 §26: localhost app + TEST database only. No Vercel, no remote E2E.

S11 does NOT need to perform full Playwright E2E (that's MS-005).

---

## 16. Forbidden Expansion

S10 MUST NOT:
- Start WP-005 (full Playwright E2E suite)
- Configure Vercel or any cloud deployment
- Modify db/schema.ts or create migrations
- Modify lib/server/auth/* (auth.ts, authorization.ts, capabilities.ts)
- Modify app/api/auth/[...all]/route.ts
- Modify app/admin/* (admin routes, components, Server Actions)
- Modify middleware.ts (matcher is /admin/:path* only)
- Add authentication to public routes
- Add candidate accounts, application workflow, CV upload, favorites, messaging
- Add recruiter self-service, payments, AI matching, notifications, mobile app
- Add multilingual support, multi-tenant, public API, complex RBAC, SUPER_ADMIN
- Add social sharing, logos, duplicate-offer, preview mode, physical delete, automatic expiration
- Add public filters beyond search (no location/contract_type/sector filter widgets)
- Add Elasticsearch, Meilisearch, Algolia, Typesense, or any external search service
- Add Redis, CDN, background indexing, event bus, microservice, GraphQL
- Add new major dependencies (use existing @tiptap/react for public rendering)
- Remove the 10 unused dependencies from WP-003 (NON-BLOCKING — handle separately)
- Modify governance documents (Charter, Product Requirements, Tech Spec, ADRs, Roadmap)

---

## 17. Known Risks / Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| Tiptap React server-side renderer in Server Component | Medium | @tiptap/react is already installed. S10 should test server-side rendering early. ADR-0005 confirms this is supported. |
| Root page replacement conflicts with existing placeholder | Low | app/page.tsx will be replaced. Route group (public) ensures clean separation from admin. |
| Search performance with ILIKE on large datasets | Low | V1 editorial-scale. pg_trgm can be added later if needed (ADR-0010). |

No CRITICAL or HIGH blockers identified.

---

## 18. Allowed Implementation Freedom

- Whether to extend `lib/server/services/offers.ts` with public query functions or create a new `lib/server/services/public-offers.ts` — S10's choice
- Whether to implement search (FR-050 SHOULD) or defer to V2 with OWNER approval — S10's choice
- Exact pagination implementation (page-based, simple)
- Exact French wording of UI strings (provided they are French and clear)
- Component decomposition (separate OfferCard component vs inline)
- Whether to use a route group `(public)` or place public routes directly

---

## 19. S10 Handoff

| Field | Value |
|---|---|
| WP ID | WP-004 |
| Authorized Purpose | Public Job Portal (MS-004) — public offer list, detail, search, SEO |
| Requirements Covered | FR-040, FR-041, FR-042, FR-050 (SHOULD), FR-060, BR-025, BR-033, BR-034, BR-040, BR-050, BR-070, BR-071, PERM-001, NFR-040, TD-029 |
| Verified Baseline | dev `9342d9a3e6e0d35e729fc2bf9d9c0e574f83bf69`; main `0bc77a7` (unchanged) |
| In Scope | Public offer list, detail, Tiptap rendering, search (SHOULD), SEO (sitemap/robots/metadata), tests |
| Out of Scope | E2E suite (WP-005), Vercel/CI (WP-006), candidate features, admin changes, schema changes |
| Technical Constraints | ADR-0001, ADR-0005, ADR-0009, ADR-0010, TD-029, S0 v0.2 §26 |
| Acceptance Contract | 35 conditions (AC-001 through AC-035) |
| Forbidden Expansion | See Section 16 |
| Migration Required | NO |
| Next WP | WP-005 — E2E Integration + Hardening (NOT YET AUTHORIZED) |

---

## 20. Approval / Authorization

| Field | Value |
|---|---|
| WP Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED |
| Next WP | WP-005 — E2E Integration + Hardening (NOT YET AUTHORIZED) |

### Authorized Dependencies

**NEW DEPENDENCIES: NONE EXPECTED.**

S10 must first verify whether the already-installed stack can safely render the approved Tiptap JSON subset in a Server Component. The already-installed `@tiptap/react` (from WP-003) MAY be usable for server-side rendering, but S10 must verify this at implementation time. A small deterministic JSON-to-React renderer using only existing dependencies is also acceptable if it satisfies ADR-0005 semantics.

If S10 discovers that the canonical rendering requirement cannot be safely implemented with existing dependencies: STOP and report `TIPTAP PUBLIC RENDERING DEPENDENCY GAP`. Do NOT silently install any new package. OWNER authorization is required before adding a new dependency.

### Allowed Change Surface

| File/Directory | Action | Notes |
|---|---|---|
| `app/(public)/` | CREATE | Public route group: page.tsx (root = offer list), offres/[id]/page.tsx (detail), optionally layout.tsx |
| `app/page.tsx` | DELETE | Remove existing WP-001 placeholder. The root URL `/` is served by `app/(public)/page.tsx`. There must be exactly ONE page resolving to `/`. |
| `app/sitemap.ts` | CREATE | Sitemap for PUBLISHED offers (TD-029, ADR-0009) |
| `app/robots.ts` | CREATE | Allow public, disallow /admin/* (TD-029) |
| `components/public/` | CREATE | Public-only components: OfferCard, OfferDetail, TiptapRenderer |
| `lib/server/services/public-offers.ts` (or extend offers.ts) | CREATE | Public read-only query functions (listPublishedOffers, getPublishedOfferById) |
| Test files | CREATE | Integration tests against TEST_DATABASE_URL |

**Files that MUST NOT be created or modified:**
- `db/schema.ts`, `db/migrations/` — no schema changes
- `lib/server/auth/*` — no auth core changes
- `app/api/auth/[...all]/route.ts` — no Better Auth route handler changes
- `app/admin/*` — no admin changes (admin non-regression)
- `components/admin/*` — no admin component changes
- `middleware.ts` — no middleware changes
- `lib/auth-client.ts` — no auth client changes
- `lib/server/auth/capabilities.ts` — no capability model changes
- All governance docs

### Branch Strategy

Dedicated work branch from approved dev HEAD:
```
wp/004-public-job-portal
```

Flow: dev → wp/004-public-job-portal → S10 → S11 → OWNER closure → controlled merge to dev. No merge to main.

### Verification Commands

```
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Plus WP-004 integration tests against TEST_DATABASE_URL.

### Quality Gate Self-Check (per S9 §46)

| Check | Result |
|---|---|
| Source milestone valid | YES (MS-004) |
| Requirement traceability complete | YES (15 requirements covered) |
| Orphan scope | 0 |
| Blocking ambiguities | 0 |
| In scope explicit | YES (Section 5) |
| Out of scope explicit | YES (Section 6) |
| Intended behavior unambiguous | YES (Section 7) |
| S6/S7 contradictions | 0 |
| Acceptance criteria too vague | 0 (35 observable conditions) |
| Forbidden expansion defined | YES (Section 16) |
| Target environment safety defined | YES (S0 v0.2 §26: LOCAL + TEST only) |
| Unauthorized automation | 0 |
| Unauthorized production action | 0 |
| OWNER approval + authorization | REQUIRED (PENDING) |

**Verdict: QUALITY GATE PASS. WP-004 is READY FOR OWNER APPROVAL + AUTHORIZATION.**

---

## 21. S9 Closure

S9 only. Do NOT start S10. Do NOT install packages. Do NOT create public pages. Do NOT execute DB writes. Do NOT start WP-005.

**S9 STATUS: COMPLETE. AWAITING OWNER APPROVAL + AUTHORIZATION.**
