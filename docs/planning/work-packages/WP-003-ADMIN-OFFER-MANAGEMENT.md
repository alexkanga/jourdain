# WP-003 — Admin Offer Management

## 1. Contract Status

| Field | Value |
|---|---|
| WP ID | WP-003 |
| Name | Admin Offer Management |
| Source Milestone | MS-003 — Admin Offer Management (DELIVERY_ROADMAP §7, line 208) |
| Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| Canonical dev SHA (at S9 start) | `e86db99bc513e4f8289a08325ef996f9f10317b2` |
| Canonical main SHA (at S9 start) | `0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d` |
| Source Charter (S4) | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Source Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| Source Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` at `7c85323` |
| Source Project Manifest (S7) | `docs/architecture/PROJECT_MANIFEST.md` at `0b8b436` |
| Source Delivery Roadmap (S8) | `docs/planning/DELIVERY_ROADMAP.md` at `2796c2d` |
| Previous WP | WP-002 — CLOSED / PASS (impl commit `6d0027a`, S11 verdict PASS) |
| WP-002 S11 verdict | PASS (owner-accepted) |
| Milestones complete at S9 start | 2 / 7 (MS-001, MS-002) |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED (requires OWNER APPROVE + AUTHORIZE) |
| S10 Started | NO |
| WP-004 Started | NO |

---

## 2. Purpose

Deliver a genuinely usable administrative workflow for JOURDAIN EMPLOI: an authorized ADMIN (or FANTOMAS, who inherits ADMIN capabilities) can login, view the offer list, create an offer, save it as DRAFT, find it again, edit it, publish it, suspend it, republish it, and archive it — with server-side authorization, server-side validation, correct lifecycle enforcement, a Tiptap rich-text editor for the description, and no public portal implementation.

This WP builds entirely on the verified foundations from WP-002 (Database + Auth Foundation). It does NOT redesign the database, Better Auth, principalType, Fantomas, the authorization architecture, the migration doctrine, or environment naming. It reuses `can()` / `requireCapability()` from `lib/server/auth/authorization.ts` and the capability model from `lib/server/auth/capabilities.ts` as-is.

---

## 3. Requirements Covered

**REQUIREMENTS COVERED NOW (this WP):**

| Requirement | Priority | Coverage | Notes |
|---|---|---|---|
| FR-001 (admin login) | MUST | COMPLETES | Login UI page (Better Auth route handler exists from WP-002; WP-003 adds the styled login form + loginAction Server Action) |
| FR-002 (admin logout) | MUST | PRIMARY | logoutAction Server Action |
| FR-003 (back-office denied to unauthenticated) | MUST | PRIMARY | middleware.ts (NEW in WP-003) protects /admin/* — first line of defense (authentication only) |
| FR-010 (admin offer list view) | MUST | PRIMARY | app/admin/offres/page.tsx (Server Component) |
| FR-011 (admin list status visibility) | MUST | PRIMARY | StatusBadge in admin list |
| FR-012 (admin list status filter — MUST) | MUST | PRIMARY | URL searchParams ?status=… |
| FR-013 (admin list title search — SHOULD) | SHOULD | PRIMARY | URL searchParams ?q=… with ILIKE on title; implement unless S6 reveals disproportionate complexity (defer to V2 with OWNER approval if disproportionate) |
| FR-020 (new offer creation) | MUST | PRIMARY | createOfferAction + app/admin/offres/nouvelles/page.tsx |
| FR-021 (offer editing) | MUST | PRIMARY | updateOfferAction + app/admin/offres/[id]/page.tsx |
| FR-022 (save without publishing) | MUST | PRIMARY | New offer saves as DRAFT; edit saves preserve status |
| FR-023 (required-field validation) | MUST | PRIMARY | Zod offerSchema (title + description required) |
| FR-024 (URL/email format validation) | MUST | PRIMARY | Zod offerSchema validates application_email, application_url, source_url when provided |
| FR-025 (PUBLISHED modification stays PUBLISHED) | MUST | PRIMARY | updateOfferAction preserves status; only explicit lifecycle actions change status |
| FR-030 (publish) | MUST | PRIMARY | publishOfferAction (DRAFT → PUBLISHED) |
| FR-031 (suspend) | MUST | PRIMARY | suspendOfferAction (PUBLISHED → SUSPENDED) |
| FR-032 (republish) | MUST | PRIMARY | republishOfferAction (SUSPENDED → PUBLISHED) |
| FR-033 (archive) | MUST | PRIMARY | archiveOfferAction (any active → ARCHIVED) |
| FR-034 (no automatic deletion) | MUST | PRIMARY | No physical delete action exists; ARCHIVED offers remain indefinitely |
| FR-035 (no automated expiration) | MUST | PRIMARY | No scheduler, no cron, no automatic status change from dates |
| FR-061 (empty admin state) | MUST | PRIMARY | Empty state UI in admin list when no offers |
| BR-020 (lifecycle states) | MUST | PRIMARY | 4-state enum enforced by DB + server-side transition validation |
| BR-021 (publication is explicit) | MUST | PRIMARY | Save ≠ publish enforced; DRAFT is default new offer status |
| BR-022 (published_at semantics) | MUST | PRIMARY | First publication sets published_at; republication preserves it; system-managed |
| BR-023 (suspension preserves content) | MUST | PRIMARY | Suspend changes status only; content + published_at preserved |
| BR-024 (archiving preserves content; ARCHIVED terminal) | MUST | PRIMARY | Archive changes status only; no V1 action transitions out of ARCHIVED |
| BR-026 (no automatic status transitions from dates) | MUST | PRIMARY | application_deadline does NOT auto-change status |
| BR-030 (required fields) | MUST | PRIMARY | title + description required (Zod) |
| BR-031 (optional fields don't block) | MUST | PRIMARY | All 14 optional fields nullable; absent optional does not block save/publish |
| BR-032 (never invent) | MUST | PRIMARY | No fabricated values; absent fields stored as NULL |
| BR-034 (description formatting) | MUST | PRIMARY | Tiptap JSON preserves paragraphs, lists, headings, links, emphasis |
| BR-040 (application modalities informational) | MUST | PRIMARY | Text/email/URL stored; no Apply button, no application workflow |
| BR-050 (source optional) | MUST | PRIMARY | source_name + source_url optional; no automated import |
| BR-060 (date categorization) | MUST | PRIMARY | published_at/created_at/updated_at system-managed; ADMIN enters source_publication_date + application_deadline only |
| BR-061 (source_publication_date vs published_at distinct) | MUST | PRIMARY | Two distinct dates; never conflated |
| BR-062 (application_deadline informational) | MUST | PRIMARY | No auto-expiration from application_deadline |
| BR-063 (no expiration_date) | MUST | PRIMARY | No expiration_date field (schema already correct from WP-002) |
| BR-080 (URL/email validation) | MUST | PRIMARY | Zod validation for application_email, application_url, source_url when provided |
| PERM-002 (ADMIN full offer lifecycle) | MUST | PRIMARY | All lifecycle actions authorized for ADMIN |
| PERM-003 (back-office restricted) | MUST | PRIMARY | middleware.ts + layout guard enforce authentication |
| PERM-004 (Fantomas inherits ADMIN) | MUST | PRIMARY | Fantomas inherits all ADMIN capabilities; can() abstraction already enforces this |
| NFR-040 (French only — admin UI strings) | MUST | PRIMARY | All admin UI strings in French |
| NFR-050 (minimal audit — created_at, updated_at, published_at) | MUST | PRIMARY | System-managed fields set correctly on each mutation |
| NFR-060 (offer integrity — transitions preserve content) | MUST | PRIMARY | Lifecycle transitions preserve content fields; only status + updated_at change |
| NFR-012 (session protection) | MUST | SECONDARY | Better Auth httpOnly cookie (from WP-002); WP-003 middleware enforces /admin/* session check |

**MILESTONE REQUIREMENTS NOT IN THIS WP:**

FR-004 (no public registration — already satisfied by WP-002 disableSignUp), FR-040–FR-061 (public portal — MS-004 / WP-004), TD-029 (SEO — sitemap, robots — MS-004), Playwright E2E (MS-005), Vercel + CI (MS-006).

**ORPHAN SCOPE: 0**

All covered requirements are traced to MS-003 in DELIVERY_ROADMAP §7 (line 208–268) and to S5/S6 canonical documents.

---

## 4. Entry Conditions

| Condition | Status |
|---|---|
| MS-001 / WP-001 CLOSED / PASS | YES (impl commit `45fa8b7`) |
| MS-002 / WP-002 CLOSED / PASS | YES (impl commit `6d0027a`, S11 verdict PASS, owner-accepted) |
| MS-003 selected as next milestone | YES (DELIVERY_ROADMAP §7 line 208) |
| MS-003 entry conditions: "MS-002 CLOSED / PASS" | YES |
| BLOCKING PRODUCT AMBIGUITIES | 0 (all S5 requirements CONFIRMED; published_at semantics defined in BR-022 + S6 §7.1) |
| BLOCKING TECHNICAL AMBIGUITIES | 0 (all S6 TDs DECIDED; ADRs ACCEPTED; capability model from WP-002 sufficient) |
| Technical baseline (S6/S7) | APPROVED |
| Database schema (offers table + enums + indexes) | EXISTS from WP-002; no migration needed for WP-003 |
| Auth foundation (Better Auth + principalType + can()) | EXISTS from WP-002; reuse as-is |
| Validation schemas (offerSchema, loginSchema) | EXISTS from WP-002; extend only where WP-003 requires |
| Bootstrap (Fantomas + initial ADMIN) | EXISTS from WP-002; idempotent; no changes |

---

## 5. In Scope

### Admin Authentication UI

- `app/admin/login/page.tsx` — styled login form (username + password), French labels, error feedback for invalid credentials, redirect to `/admin/offres` on success (FR-001)
- `loginAction` Server Action — calls `auth.api.signInUsername({ body: { username, password } })` server-side; returns `{ ok: boolean, error?: string }`; on success redirect to `/admin/offres`; on failure re-render login page with error (no information leak about which field was wrong)
- `app/admin/layout.tsx` — admin layout with auth guard (double-check session via `getPrincipal()`; if null → redirect to `/admin/login`); renders logout button
- `logoutAction` Server Action — calls `auth.api.signOut({ headers })`; redirects to `/admin/login` (FR-002)
- `app/admin/page.tsx` — redirect to `/admin/offres`

### Server-Side Access Control

- `middleware.ts` (root-level, NEW) — protects `/admin/*` routes; calls Better Auth session check; if no valid session → redirect to `/admin/login`. This is the first line of defense (authentication only — no capability check here, since middleware runs on every request and capability checks are per-action per S6 §13.4)
- Every admin Server Action calls `requireCapability(capability)` first (from `lib/server/auth/authorization.ts`), where `capability` is the action's required capability (e.g., `offer:create`, `offer:publish`)
- No client-side authorization decisions; the server is the authority (NFR-012)
- Better Auth `role` is NOT the business authorization source; `can()` reads `principalType` (NOT role) — this is already implemented in WP-002 and reused as-is

### Admin Offer List

- `app/admin/offres/page.tsx` (Server Component) — displays all offers regardless of status, sorted by `created_at DESC` (default admin sort), with:
  - Title (always displayed)
  - Company (displayed when available; omitted when absent — no placeholder per BR-031/BR-033)
  - Status badge (DRAFT / PUBLISHED / SUSPENDED / ARCHIVED — FR-011)
  - JOURDAIN publication date (`published_at` formatted, displayed when available)
  - Application deadline (displayed when available)
  - Updated timestamp (displayed for management context)
  - Actions appropriate to current status (Edit link always; Publish button for DRAFT; Suspend button for PUBLISHED; Republish button for SUSPENDED; Archive button for any active status; no action for ARCHIVED except View)
  - "New offer" button (links to `/admin/offres/nouvelles`)
- Status filter (FR-012 MUST): URL searchParams `?status=DRAFT|PUBLISHED|SUSPENDED|ARCHIVED`; clearing the filter restores the full list
- Title search (FR-013 SHOULD): URL searchParams `?q=term`; ILIKE on title (case-insensitive); implement unless S6 reveals disproportionate complexity (defer to V2 with OWNER approval if disproportionate). Combined with status filter: `?status=DRAFT&q=term`
- Empty state (FR-061): French message "Aucune offre disponible" when no offers exist (or no offers match the current filter/search)
- Pagination: simple page-based pagination when the number of offers exceeds a single page (FR-010 acceptance: "the list is navigable when the number of offers exceeds a single page")

### Offer Form (Create + Edit)

- `app/admin/offres/nouvelles/page.tsx` — new offer form (FR-020); saves as DRAFT by default
- `app/admin/offres/[id]/page.tsx` — edit form (FR-021); loads existing offer; saves changes without forcing status change (FR-022, FR-025)
- Form fields grouped logically per S6 §25 (Informations principales, Caractéristiques, Dates, Description, Candidature, Source):
  - **Informations principales:** title (required), company (optional), sector (optional), category (optional)
  - **Caractéristiques:** contract_type (optional), education_level (optional), experience (optional), location (optional)
  - **Dates:** source_publication_date (optional, date input), application_deadline (optional, date input)
  - **Description:** Tiptap rich-text editor (required)
  - **Candidature:** application_modalities (optional, textarea), application_email (optional, email input), application_url (optional, URL input)
  - **Source:** source_name (optional, text), source_url (optional, URL input)
- System-managed fields NOT exposed as ordinary editable inputs:
  - `id` — system-generated UUID (per DR-010)
  - `status` — system-managed; displayed as read-only badge in edit form; changed only via explicit lifecycle action buttons
  - `published_at` — system-managed; displayed as read-only in edit form (if set); ADMIN cannot edit directly (BR-022, BR-060)
  - `created_at` — system-managed; displayed as read-only in edit form
  - `updated_at` — system-managed; not displayed in form (updated on every save)
- `createOfferAction` Server Action (FR-020): validates via Zod offerSchema; inserts new offer with `status='DRAFT'`, `published_at=NULL`, `created_at=now()`, `updated_at=now()`; returns `{ ok, id?, error? }`
- `updateOfferAction` Server Action (FR-021, FR-025): validates via Zod offerSchema; updates offer fields; preserves `status` and `published_at` (only `updated_at` is set to `now()`); returns `{ ok, error? }`

### Rich Text Editor (Tiptap)

- Tiptap editor for the `description` field (Client Component)
- Canonical representation: Tiptap structured JSON → PostgreSQL JSONB (schema already jsonb from WP-002)
- V1 subset of Tiptap nodes (per brief §7):
  - Paragraphs (paragraph)
  - Headings (heading, levels 1–3)
  - Bullet lists (bulletList)
  - Ordered lists (orderedList)
  - Links (link extension)
  - Basic emphasis (bold, italic — included in starter-kit)
- Avoid an oversized CMS editor; no images, no tables, no code blocks, no embeds in V1
- Do NOT store HTML as the canonical source; Tiptap JSON is the source of truth
- Do NOT introduce unsafe raw HTML rendering; the public detail renderer (WP-004) will use Tiptap's server-side renderer, not `dangerouslySetInnerHTML`
- The editor saves Tiptap JSON to the `description` jsonb column on form submit

### Offer Lifecycle Actions

- `publishOfferAction` (FR-030): DRAFT → PUBLISHED; sets `published_at = now()` (first publication only; preserved on republication); sets `updated_at = now()`; requires `offer:publish` capability
- `suspendOfferAction` (FR-031): PUBLISHED → SUSPENDED; preserves content + `published_at`; sets `updated_at = now()`; requires `offer:suspend` capability
- `republishOfferAction` (FR-032): SUSPENDED → PUBLISHED; preserves `published_at` (NOT overwritten); sets `updated_at = now()`; requires `offer:republish` capability
- `archiveOfferAction` (FR-033): any active status (DRAFT, PUBLISHED, SUSPENDED) → ARCHIVED; preserves content + `published_at`; sets `updated_at = now()`; requires `offer:archive` capability; ARCHIVED is terminal — no V1 action transitions out

### Server-Side Validation

- Zod `offerSchema` in `lib/server/validation/schemas.ts` is the authoritative validation (server-side)
- Client-side validation via React Hook Form + `@hookform/resolvers/zod` mirrors server validation for UX only
- Rules (per BR-030, BR-031, BR-080, FR-023, FR-024):
  - `title` required (non-empty after whitespace trimming)
  - `description` required (non-empty Tiptap JSON — at minimum `{ type: "doc", content: [] }`)
  - `application_email` valid email format if provided (empty accepted)
  - `application_url` valid URL format if provided (empty accepted)
  - `source_url` valid URL format if provided (empty accepted)
  - All 14 optional fields accept empty/NULL; absent optional does not block save/publish
  - Unknown source data is never invented (no auto-fill of absent fields)

### Concurrency / State Validation (Server-Side)

- Every lifecycle action validates the current database state server-side BEFORE applying the transition:
  - `publishOfferAction`: load offer; if `status !== 'DRAFT'` → reject with "L'offre n'est pas en brouillon" (only DRAFT can be published)
  - `suspendOfferAction`: load offer; if `status !== 'PUBLISHED'` → reject with "L'offre n'est pas publiée" (only PUBLISHED can be suspended)
  - `republishOfferAction`: load offer; if `status !== 'SUSPENDED'` → reject with "L'offre n'est pas suspendue" (only SUSPENDED can be republished)
  - `archiveOfferAction`: load offer; if `status === 'ARCHIVED'` → reject with "L'offre est déjà archivée" (ARCHIVED is terminal — no transition out); if `status` is DRAFT/PUBLISHED/SUSPENDED → allow
  - `updateOfferAction`: load offer; if not found → reject with "Offre introuvable"; preserve `status` regardless of input (status is NOT a form field)
- Do NOT rely only on disabled UI buttons; the server is the authority
- Use atomic UPDATE … WHERE … RETURNING or equivalent to handle concurrent requests (optimistic concurrency via `updated_at` check is allowed but not required for V1's small admin team)

### Error Handling

- Invalid form: return field-specific error messages in French (FR-023-ERR, FR-024-ERR); preserve entered form values
- Unauthorized (no session): middleware redirects to `/admin/login` before the Server Action runs
- Forbidden (authenticated but lacks capability): Server Action returns `{ ok: false, error: 'Action non autorisée' }`; UI shows the error
- Unauthenticated mutation attempt: Server Action's `requireCapability()` throws/returns authorization error; no DB write
- Offer not found: return `{ ok: false, error: 'Offre introuvable' }`; UI shows the error or 404 page
- Invalid lifecycle transition: return `{ ok: false, error: '<transition-specific message>' }` per the rules above
- Database failure: return `{ ok: false, error: 'Erreur technique' }`; log server-side; do NOT expose internal stack traces or secrets to the browser

### Tests

- Unit tests (Vitest):
  - Lifecycle state machine: all allowed transitions (DRAFT→PUBLISHED, DRAFT→ARCHIVED, PUBLISHED→SUSPENDED, PUBLISHED→ARCHIVED, SUSPENDED→PUBLISHED, SUSPENDED→ARCHIVED)
  - Forbidden transitions rejected (DRAFT→SUSPENDED, ARCHIVED→any, PUBLISHED→PUBLISHED via "publish" action)
  - Zod offerSchema validation (required fields, optional fields, email/URL format, empty accepted)
  - `can()` checks for offer capabilities (ADMIN + FANTOMAS both ALLOW for all offer:* capabilities)
- Integration tests (Vitest against real TEST_DATABASE_URL — NOT Production, NOT Preview, no DB mocks):
  - Unauthenticated admin access rejected (middleware redirect)
  - ADMIN can perform all authorized operations
  - FANTOMAS can perform all ADMIN operations (inheritance verified)
  - Invalid input rejected (missing title, missing description, invalid email, invalid URL)
  - DRAFT creation (new offer saves as DRAFT, published_at NULL)
  - DRAFT edit (save preserves DRAFT status, published_at stays NULL, updated_at changes)
  - DRAFT → PUBLISHED (publish sets published_at to now(), updated_at changes)
  - PUBLISHED edit (save preserves PUBLISHED status, published_at preserved, updated_at changes — FR-025)
  - PUBLISHED → SUSPENDED (suspend changes status only, published_at preserved, updated_at changes — BR-023)
  - SUSPENDED → PUBLISHED (republish preserves published_at, updated_at changes — BR-022 republication)
  - DRAFT → ARCHIVED (archive changes status, published_at stays NULL, updated_at changes)
  - PUBLISHED → ARCHIVED (archive changes status, published_at preserved, updated_at changes — BR-024)
  - SUSPENDED → ARCHIVED (archive changes status, published_at preserved, updated_at changes)
  - ARCHIVED terminal (no V1 action transitions out of ARCHIVED; publish/suspend/republish/archive all rejected for ARCHIVED)
  - Physical delete absent (no deleteOfferAction exists; no DELETE query on offers table)
  - application_deadline does NOT automatically mutate status (set past deadline; verify status unchanged — FR-035, BR-026)
  - Tiptap JSON persisted (create offer with Tiptap description, reload edit form, verify description JSON round-trips)

### Quality Gates

The future S10 must finish with all of the following PASS:
- `pnpm lint` (eslint exit 0)
- `pnpm typecheck` (tsc --noEmit exit 0)
- `pnpm test` (vitest run exit 0 — all unit + integration tests pass)
- `pnpm build` (next build exit 0)
- WP-003 integration/functional verification defined in this contract (the integration tests above + manual functional verification per brief §23)

---

## 6. Out of Scope

### Public Portal (MS-004 / WP-004)
- Public offer list at `/` (root page remains minimal from WP-001) — EXCLUDED
- Public offer detail at `/offres/{id}` — EXCLUDED
- Public search — EXCLUDED
- Public SEO implementation (generateMetadata, sitemap.ts, robots.ts) — EXCLUDED
- Tiptap React server-side renderer (for public detail display) — EXCLUDED (WP-003 has the Tiptap client-side editor for the admin form only; the public renderer belongs to WP-004)

### Candidate Features
- Candidate account — EXCLUDED
- CV upload — EXCLUDED
- Application submission — EXCLUDED
- Favorites — EXCLUDED
- Messaging — EXCLUDED
- Apply button — EXCLUDED (BR-040: application modalities are informational only)

### Recruiter
- Recruiter self-service — EXCLUDED
- Recruiter account — EXCLUDED

### Other
- Payments — EXCLUDED
- AI matching — EXCLUDED
- Notifications — EXCLUDED
- Mobile app — EXCLUDED
- Multilingual — EXCLUDED (NFR-040: French only for V1)
- Multi-tenant — EXCLUDED
- Public API — EXCLUDED (INT-001, OOS-015)
- Complex RBAC — EXCLUDED (only ADMIN + FANTOMAS; no SUPER_ADMIN per DR-051 deferred)
- SUPER_ADMIN — EXCLUDED (not in V1; `can()` abstraction supports future extension but no SUPER_ADMIN created in WP-003)
- Social sharing — EXCLUDED
- Logos — EXCLUDED
- Duplicate-offer action — EXCLUDED
- Dedicated preview mode — EXCLUDED
- Physical delete — EXCLUDED (FR-034; no deleteOfferAction)
- Automatic expiration — EXCLUDED (FR-035, BR-026, BR-062, BR-063; no scheduler, no cron)

### Delivery (MS-006 / WP-006)
- Vercel Production deployment — EXCLUDED
- Vercel Preview setup — EXCLUDED
- GitHub Actions CI — EXCLUDED
- Production migration — EXCLUDED
- Neon Production/Preview environment — EXCLUDED

### E2E (MS-005 / WP-005)
- Full Playwright E2E journey — EXCLUDED (assigned to later milestone per roadmap)

### Forgot-Password / User Management
- Forgot-password workflow — EXCLUDED unless already explicitly required by S5 (S5 does NOT require it in V1 — DR-050 deferred)
- User registration — EXCLUDED (FR-004: no public registration)
- User management UI — EXCLUDED (admin plugin is server-side only from WP-002)
- Candidate login — EXCLUDED
- Recruiter login — EXCLUDED

### Database / Auth Changes
- Schema changes — EXCLUDED (WP-003 uses the Offer schema already established by WP-002; if a real schema gap is discovered, STOP and report CONTRACT DIVERGENCE / SCHEMA GAP per brief §21)
- Better Auth replacement — EXCLUDED (CONTRACT DIVERGENCE if needed)
- Drizzle replacement — EXCLUDED (CONTRACT DIVERGENCE if needed)
- Change from `drizzle-orm/neon-http` — EXCLUDED (CONTRACT DIVERGENCE if needed)
- Modification of `principalType` doctrine — EXCLUDED (CONTRACT DIVERGENCE if needed)
- New capabilities beyond the existing canonical set — EXCLUDED (reuse existing `offer:create`, `offer:edit`, `offer:save`, `offer:publish`, `offer:suspend`, `offer:republish`, `offer:archive`, `admin:login`)

---

## 7. Intended Behavior

### Admin Login Flow (FR-001)
```
ADMIN navigates to /admin/login
  → Login form displays (French labels: "Nom d'utilisateur", "Mot de passe", "Se connecter")
  → ADMIN enters username + password, submits
  → loginAction Server Action:
    → Zod validates { username, password } (non-empty)
    → Calls auth.api.signInUsername({ body: { username, password } })
    → Better Auth: checks rate limiter (DB-backed, from WP-002); verifies credentials (scrypt); creates DB session; sets httpOnly cookie
    → On success: redirect to /admin/offres
    → On failure: re-render login page with error "Identifiants invalides" (no information leak about which field was wrong)
  → Unauthenticated visitor at /admin/* → middleware redirects to /admin/login (FR-003)
```

### Admin Logout Flow (FR-002)
```
Authenticated ADMIN at /admin/* clicks "Déconnexion"
  → logoutAction Server Action:
    → Calls auth.api.signOut({ headers })
    → Better Auth: deletes session record in DB, clears cookie
    → Redirect to /admin/login
```

### Admin Offer List Flow (FR-010, FR-011, FR-012, FR-013, FR-061)
```
Authenticated ADMIN at /admin/offres
  → Server Component loads all offers (sorted by created_at DESC)
  → Optional URL searchParams:
    → ?status=DRAFT|PUBLISHED|SUSPENDED|ARCHIVED → filter by status (FR-012 MUST)
    → ?q=term → ILIKE on title (FR-013 SHOULD, case-insensitive)
    → ?page=N → pagination
  → Each offer row displays: title, company (if present), status badge, published_at (if set), application_deadline (if set), updated_at, action buttons
  → Action buttons depend on current status:
    → DRAFT: Edit, Publish, Archive
    → PUBLISHED: Edit, Suspend, Archive
    → SUSPENDED: Edit, Republish, Archive
    → ARCHIVED: View (read-only; no lifecycle actions)
  → "Nouvelle offre" button → /admin/offres/nouvelles
  → Empty state: "Aucune offre disponible" (FR-061) or "Aucune offre ne correspond à votre filtre" (filtered empty)
```

### New Offer Creation Flow (FR-020, FR-022, BR-021)
```
Authenticated ADMIN at /admin/offres clicks "Nouvelle offre"
  → /admin/offres/nouvelles displays the offer form (empty)
  → ADMIN fills form (title + description required; 14 optional fields)
  → Submits "Enregistrer" (Save)
  → createOfferAction Server Action:
    → requireCapability('offer:create') — rejects if not ADMIN/FANTOMAS
    → Zod offerSchema validates input (title + description required; email/URL format if provided)
    → INSERT into offers with status='DRAFT', published_at=NULL, created_at=now(), updated_at=now()
    → revalidatePath('/admin/offres')
    → Redirect to /admin/offres (or /admin/offres/[id])
  → New offer is visible in admin list as DRAFT; NOT visible publicly
```

### Offer Edit Flow (FR-021, FR-022, FR-025)
```
Authenticated ADMIN at /admin/offres clicks "Modifier" on an offer
  → /admin/offres/[id] displays the offer form (pre-filled with existing values)
  → Status displayed as read-only badge (NOT an editable input)
  → published_at, created_at displayed as read-only (if set)
  → ADMIN modifies one or more fields, submits "Enregistrer"
  → updateOfferAction Server Action:
    → requireCapability('offer:edit') + requireCapability('offer:save')
    → Zod offerSchema validates input
    → Load existing offer (concurrency check: verify offer exists)
    → UPDATE offers SET ...fields..., updated_at=now() WHERE id=? (status and published_at are NOT in the SET clause — they are preserved)
    → revalidatePath('/admin/offres') + revalidatePath('/admin/offres/[id]')
    → Redirect to /admin/offres
  → Offer status is NOT changed as a side effect of saving edits (FR-025)
```

### Publish Flow (FR-030, BR-021, BR-022)
```
Authenticated ADMIN at /admin/offres clicks "Publier" on a DRAFT offer
  → publishOfferAction Server Action:
    → requireCapability('offer:publish')
    → Load offer; verify status === 'DRAFT' (reject if not — "L'offre n'est pas en brouillon")
    → UPDATE offers SET status='PUBLISHED', published_at=now(), updated_at=now() WHERE id=? AND status='DRAFT'
    → revalidatePath('/admin/offres')
    → Redirect to /admin/offres
  → Offer is now PUBLISHED; published_at is set to current timestamp (first publication)
```

### Suspend Flow (FR-031, BR-023)
```
Authenticated ADMIN at /admin/offres clicks "Suspendre" on a PUBLISHED offer
  → suspendOfferAction Server Action:
    → requireCapability('offer:suspend')
    → Load offer; verify status === 'PUBLISHED' (reject if not — "L'offre n'est pas publiée")
    → UPDATE offers SET status='SUSPENDED', updated_at=now() WHERE id=? AND status='PUBLISHED'
    → (published_at is NOT in the SET clause — preserved)
    → revalidatePath('/admin/offres')
    → Redirect to /admin/offres
  → Offer is now SUSPENDED; content + published_at preserved
```

### Republish Flow (FR-032, BR-022)
```
Authenticated ADMIN at /admin/offres clicks "Republicaliser" on a SUSPENDED offer
  → republishOfferAction Server Action:
    → requireCapability('offer:republish')
    → Load offer; verify status === 'SUSPENDED' (reject if not — "L'offre n'est pas suspendue")
    → UPDATE offers SET status='PUBLISHED', updated_at=now() WHERE id=? AND status='SUSPENDED'
    → (published_at is NOT in the SET clause — preserved, NOT overwritten)
    → revalidatePath('/admin/offres')
    → Redirect to /admin/offres
  → Offer is now PUBLISHED; published_at preserved (set during original first publication)
```

### Archive Flow (FR-033, BR-024)
```
Authenticated ADMIN at /admin/offres clicks "Archiver" on any active offer (DRAFT, PUBLISHED, or SUSPENDED)
  → archiveOfferAction Server Action:
    → requireCapability('offer:archive')
    → Load offer; verify status !== 'ARCHIVED' (reject if ARCHIVED — "L'offre est déjà archivée")
    → UPDATE offers SET status='ARCHIVED', updated_at=now() WHERE id=? AND status IN ('DRAFT', 'PUBLISHED', 'SUSPENDED')
    → (published_at is NOT in the SET clause — preserved)
    → revalidatePath('/admin/offres')
    → Redirect to /admin/offres
  → Offer is now ARCHIVED (terminal); content + published_at preserved; no V1 action transitions out of ARCHIVED
```

### ARCHIVED Terminal Enforcement
```
Any lifecycle action on an ARCHIVED offer:
  → publishOfferAction: reject (status !== 'DRAFT')
  → suspendOfferAction: reject (status !== 'PUBLISHED')
  → republishOfferAction: reject (status !== 'SUSPENDED')
  → archiveOfferAction: reject (status === 'ARCHIVED' — "L'offre est déjà archivée")
  → updateOfferAction: ALLOWED (editing an ARCHIVED offer preserves ARCHIVED status — FR-021 "edit any existing offer regardless of status")
```

Note: editing an ARCHIVED offer is allowed (FR-021 covers "any existing offer regardless of status"), but the status stays ARCHIVED (updateOfferAction preserves status). No lifecycle action transitions out of ARCHIVED.

### application_deadline Non-Auto-Expiration (FR-035, BR-026, BR-062)
```
A PUBLISHED offer has application_deadline = '2025-01-01' (past date)
  → No scheduler, no cron, no background job checks application_deadline
  → Offer remains PUBLISHED indefinitely until ADMIN explicitly suspends or archives
  → Integration test: set past application_deadline; verify status unchanged after time passes (no automatic transition)
```

---

## 8. Business Rules

This section restates only the rules required for WP-003, referencing the authoritative S5 source. If a restatement would change meaning, that would be CONTRACT DIVERGENCE — no meaning is changed here.

| Rule | Source | Restatement for WP-003 |
|---|---|---|
| BR-020 | S5 §6.1 | Offer has exactly one status: DRAFT, PUBLISHED, SUSPENDED, ARCHIVED. Enforced by DB enum + server-side transition validation. |
| BR-021 | S5 §6.1 | An offer is PUBLISHED only by an explicit ADMIN action. Saving an offer does NOT publish it. DRAFT is the default new offer status. |
| BR-022 | S5 §6.1 | published_at is set on first publication (DRAFT → PUBLISHED). On republication (SUSPENDED → PUBLISHED), published_at is preserved (NOT overwritten). published_at is system-managed; ADMIN cannot edit directly. |
| BR-023 | S5 §6.1 | Suspension preserves content; only status changes; published_at preserved. |
| BR-024 | S5 §6.1 | Archiving preserves content; only status changes; published_at preserved; ARCHIVED is terminal in V1 — no transition out. |
| BR-026 | S5 §6.1 | No automatic status transitions from any date (source_publication_date, application_deadline, published_at). All transitions require explicit ADMIN action. Consistent with S0 §23 (zero scheduled work). |
| BR-030 | S5 §6.2 | Required fields: title, description. An offer cannot be saved without both required fields present and non-empty (after whitespace trimming). |
| BR-031 | S5 §6.2 | Optional fields do not block save or publish. Absent optional fields are stored as NULL; no placeholder defaulting. |
| BR-032 | S5 §6.2 | Never invent absent information. No fabricated values. |
| BR-033 | S5 §6.2 | Unknown company: omitted on public card (WP-004); in admin list, omitted when absent (no placeholder). (WP-003 admin list omits company when absent.) |
| BR-034 | S5 §6.2 | Description formatting preserved (paragraphs, lists, headings, links, emphasis). Tiptap JSON is the canonical source. |
| BR-040 | S5 §6.3 | Application modalities are informational only. No Apply button, no application form, no CV upload, no internal application workflow. |
| BR-050 | S5 §6.4 | Source is optional. No automated import or syndication from source_url. |
| BR-060 | S5 §6.5 | Date categorization: ADMIN-entered (source_publication_date, application_deadline); system-generated (published_at, created_at, updated_at). ADMIN never enters published_at, created_at, or updated_at. |
| BR-061 | S5 §6.5 | source_publication_date and published_at are distinct; never conflated. |
| BR-062 | S5 §6.5 | application_deadline is informational in V1; no auto-expiration. |
| BR-063 | S5 §6.5 | No expiration_date concept in V1. (Schema already correct from WP-002.) |
| BR-080 | S5 §6.7 | When provided (non-empty), application_email (valid email), application_url (valid URL), source_url (valid URL) are validated for format. Empty values accepted. Invalid non-empty values rejected at save. |

### published_at Semantics (per brief §10 — inspected, reproduced from approved documents)

The approved documents (S5 BR-022 + S6 §7.1 side effects table) explicitly define published_at behavior on every transition. No new semantics are invented. Reproduced exactly:

| Transition | published_at behavior | updated_at | Source |
|---|---|---|---|
| First publication (DRAFT → PUBLISHED) | SET to current timestamp (now()) | SET to now() | BR-022, S6 §7.1 |
| Republication (SUSPENDED → PUBLISHED) | PRESERVED (NOT overwritten) | SET to now() | BR-022, S6 §7.1 |
| Suspension (PUBLISHED → SUSPENDED) | PRESERVED | SET to now() | BR-023, S6 §7.1 |
| Archive (any active → ARCHIVED) | PRESERVED | SET to now() | BR-024, S6 §7.1 |
| Edit + save (any status) | PRESERVED | SET to now() | FR-025, S6 §7.1 |
| DRAFT creation | NULL (not yet published) | SET to now() (via created_at + updated_at) | BR-022, S6 §7.1 |

No OWNER resolution needed for published_at semantics — they are fully defined in the approved documents.

---

## 9. Data Semantics

### Offers Table (db/schema.ts — EXISTS from WP-002, no changes)

The offers table is already established by WP-002 with all 21 fields per S6 §9.3.1. WP-003 does NOT modify the schema. The fields used by WP-003:

**Required (ADMIN-entered):**
- `title` (text, NOT NULL) — required by BR-030
- `description` (jsonb, NOT NULL) — Tiptap JSON, required by BR-030, BR-034

**Optional (ADMIN-entered):**
- `company`, `sector`, `category`, `contract_type`, `education_level`, `experience`, `location` (text, NULL)
- `source_publication_date`, `application_deadline` (date, NULL)
- `source_name`, `source_url` (text, NULL)
- `application_modalities` (text, NULL)
- `application_email` (text, NULL)
- `application_url` (text, NULL)

**System-managed (NOT entered by ADMIN):**
- `id` (uuid, NOT NULL, default gen_random_uuid())
- `status` (offer_status enum, NOT NULL, default 'DRAFT')
- `published_at` (timestamptz, NULL — set on first publication, preserved on republication)
- `created_at` (timestamptz, NOT NULL, default now())
- `updated_at` (timestamptz, NOT NULL, default now())

**Indexes (already exist from WP-002):**
- `idx_offers_status` (btree on status) — used by admin status filter (FR-012)
- `idx_offers_created_at_desc` (btree on created_at) — used by admin default sort

No new indexes needed for WP-003. The admin title search (FR-013 SHOULD) uses ILIKE on title — for V1's small admin team, a sequential scan is acceptable; no trigram index required. If performance becomes an issue in the future, a trigram index (pg_trgm extension) could be added in a separate WP — but that is out of scope for WP-003.

### Lifecycle State Machine

Canonical states (BR-020): DRAFT, PUBLISHED, SUSPENDED, ARCHIVED.

Allowed transitions:
```
DRAFT      → PUBLISHED  (publish — FR-030)
DRAFT      → ARCHIVED   (archive — FR-033)
PUBLISHED  → SUSPENDED  (suspend — FR-031)
PUBLISHED  → ARCHIVED   (archive — FR-033)
SUSPENDED  → PUBLISHED  (republish — FR-032)
SUSPENDED  → ARCHIVED   (archive — FR-033)
ARCHIVED   → (terminal — no transition out in V1)
```

Forbidden transitions (rejected server-side):
```
DRAFT      → SUSPENDED  (must be published at least once before suspension)
ARCHIVED   → any       (ARCHIVED is terminal in V1)
PUBLISHED  → PUBLISHED via "publish" (publish is only for DRAFT; use republish for SUSPENDED)
```

Edit + save (FR-021, FR-025): preserves current status; does NOT trigger a lifecycle transition.

### MIGRATION REQUIRED: NO

WP-003 uses the Offer schema already established by WP-002. No schema changes are required:
- All 21 offer fields exist with correct types
- offer_status enum has the 4 required values (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED)
- Indexes (idx_offers_status, idx_offers_created_at_desc) are sufficient for admin list + status filter + default sort
- No new tables, no new columns, no new indexes, no new enums

If a real schema gap is discovered during S10 implementation that prevents the authorized outcome:
- STOP and report `CONTRACT DIVERGENCE / SCHEMA GAP DETECTED` per brief §21
- Do NOT create a migration outside the WP contract
- Do NOT modify db/schema.ts or db/migrations/

### Tiptap JSON Storage

- `description` column is `jsonb` (from WP-002)
- Tiptap editor saves structured JSON (e.g., `{ "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Hello" }] }] }`)
- The jsonb column stores this JSON directly; no serialization/deserialization beyond what Drizzle/PostgreSQL does natively
- No raw HTML is stored; no `dangerouslySetInnerHTML` with user content
- The public detail renderer (WP-004) will use Tiptap's server-side renderer to convert JSON to safe React elements

---

## 10. Permission / Actor Semantics

### Principals (from WP-002 — reused as-is)

| Actor | principalType | Capabilities relevant to WP-003 |
|---|---|---|
| ADMIN | `'ADMIN'` | offer:create, offer:edit, offer:save, offer:publish, offer:suspend, offer:republish, offer:archive, admin:login |
| FANTOMAS | `'FANTOMAS'` | All ADMIN capabilities + system:bootstrap, system:recovery (Fantomas-specific; not surfaced in V1 daily UI per S6 §13.6) |

FANTOMAS inherits ALL ADMIN capabilities (PERM-004). Both ADMIN and FANTOMAS can perform every WP-003 admin action. No SUPER_ADMIN is created in V1.

### Capability Mapping (reusing canonical identifiers from WP-002)

The brief §17 mentions `offer:read` and `offer:update` as example capabilities. However, the canonical capability model from WP-002 (per ADR-0004 and S6 §13.3) uses `offer:edit`, `offer:save`, and admin list access is governed by authentication (not a separate capability). Per the brief's own instruction: "Use the canonical capability identifiers already present when they exist. Do not silently rename or duplicate capabilities."

| Admin Action | Canonical Capability | FR |
|---|---|---|
| Login to admin area | `admin:login` | FR-001 |
| View admin offer list | (authentication only — middleware + layout guard per S6 §13.4; no separate `offer:read` capability exists in the canonical model) | FR-010 |
| Create new offer | `offer:create` | FR-020 |
| Save new offer as DRAFT | `offer:create` + `offer:save` | FR-020, FR-022 |
| Edit existing offer (modify fields) | `offer:edit` + `offer:save` | FR-021, FR-022 |
| Publish offer (DRAFT → PUBLISHED) | `offer:publish` | FR-030 |
| Suspend offer (PUBLISHED → SUSPENDED) | `offer:suspend` | FR-031 |
| Republish offer (SUSPENDED → PUBLISHED) | `offer:republish` | FR-032 |
| Archive offer (any active → ARCHIVED) | `offer:archive` | FR-033 |
| Logout | (authentication — no capability; signOut endpoint) | FR-002 |

Note on `offer:edit` vs `offer:save`: the canonical model distinguishes "edit an existing offer's fields" (`offer:edit`) from "save without publishing" (`offer:save`). In practice, `updateOfferAction` requires both `offer:edit` (authorization to modify) and `offer:save` (authorization to persist without status change). Both are in ADMIN_CAPABILITIES, so both ADMIN and FANTOMAS have them.

Note on `offer:read` (brief §17): this capability does NOT exist in the canonical model from WP-002. Admin list access is governed by authentication (middleware + layout guard per S6 §13.4) — any authenticated ADMIN/FANTOMAS can view the admin list. No separate `offer:read` capability is created or used. This is the canonical decision; WP-003 does NOT add `offer:read`.

Note on `offer:update` (brief §17): this name does NOT exist in the canonical model. The canonical identifiers are `offer:edit` (FR-021) and `offer:save` (FR-022). WP-003 reuses `offer:edit` + `offer:save` as already defined. No `offer:update` capability is created or used.

### Enforcement (per S6 §13.4 — reproduced)

- **Middleware** (`middleware.ts`, NEW root-level): protects `/admin/*` routes; calls Better Auth session check; if no valid session → redirect to `/admin/login`. Authentication only — no capability check here (middleware runs on every request; capability checks are per-action).
- **Layout guard** (`app/admin/layout.tsx`): double-checks session via `getPrincipal()`; if null → redirect to `/admin/login` (defense in depth).
- **Each Server Action**: calls `requireCapability(capability)` first, where `capability` is the action's required capability. `requireCapability` internally calls `getPrincipal()` (which calls Better Auth's `getSession()`) and `can()`. If either fails, the action returns an authorization error.
- **No client-side authorization**: client components render based on session info passed from the server, but all mutations are validated server-side. The server is the authority (NFR-012).

---

## 11. Technical Boundaries (S6/S7 architecture constraints)

- **ADR-0001 (modular monolith):** All WP-003 code is server-side within the Next.js monolith. No separate backend service. Admin UI and admin Server Actions are part of the same Next.js app.
- **ADR-0002 (persistence):** PostgreSQL Neon + Drizzle ORM + `drizzle-orm/neon-http`. No Prisma, no other ORM. WP-003 reuses the existing `db` client from `db/index.ts` (WP-002).
- **ADR-0003 (authentication):** Better Auth + Username plugin + Admin plugin + emailAndPassword { disableSignUp: true } + database sessions + database-backed rate limiting + scrypt hashing. WP-003 reuses the existing `auth` from `lib/server/auth/auth.ts` (WP-002) — no changes to auth config.
- **ADR-0004 (authorization):** principalType + `can()` / `requireCapability()`. Better Auth `role` is NOT the business authorization source. WP-003 reuses the existing `can()` / `requireCapability()` / `getPrincipal()` from `lib/server/auth/authorization.ts` (WP-002) — no changes to the authorization layer.
- **ADR-0005 (rich text):** Tiptap structured JSON → PostgreSQL JSONB. No raw HTML in DB. No `dangerouslySetInnerHTML` with user content. WP-003 introduces the Tiptap client-side editor (admin form); the Tiptap server-side renderer for public display belongs to WP-004.
- **ADR-0006 (environment isolation):** Production ≠ Preview ≠ Local. WP-003 targets Local dev/test DB only (DEV_DATABASE_URL, TEST_DATABASE_URL from WP-002). No Production DB access.
- **ADR-0007 (migrations):** Drizzle Kit + forward corrective doctrine. WP-003 does NOT create migrations (no schema changes).
- **ADR-0008 (testing):** Vitest + real DB in integration tests (no DB mocking). WP-003 integration tests run against TEST_DATABASE_URL.
- **TD-006 (data-fetching / mutation):** Server Components for reads + Server Actions for mutations. Admin list is a Server Component; admin mutations are Server Actions. No TanStack Query in V1.
- **TD-007 (form management):** React Hook Form + `@hookform/resolvers/zod`. Client validation mirrors server Zod schemas for UX.
- **TD-008 (validation):** Zod. Server-side Zod is authoritative; client-side Zod (via zodResolver) is UX-only.
- **TD-009 (rich text):** Tiptap. JSON canonical. scrypt for passwords (not relevant to WP-003 directly — already handled by WP-002).
- **TD-011 (UI components):** Tailwind CSS + shadcn/ui (Radix primitives). Only install/use shadcn components required by the actually implemented admin screens. Do NOT mass-generate shadcn components.
- **TD-030 (neon-http):** `drizzle-orm/neon-http` (HTTP-based). No neon-serverless WebSocket, no postgres-js.
- **S0 §13:** No secrets in repository. `.env.local` gitignored (from WP-002). No new secrets introduced by WP-003.
- **S0 §23 (zero scheduled work):** No cron, no scheduled tasks, no background monitoring. WP-003 has no scheduler (consistent with FR-035, BR-026).
- **S0 §25 (target verification):** Before any DB write in S10, the DB target must be POSITIVELY verified as DEV/TEST (not Production, not Preview). WP-003 reuses the target verification from WP-002 (DEV_DATABASE_URL, TEST_DATABASE_URL).

---

## 12. Interfaces / Integration Boundaries

### Server Actions (Internal — Next.js App Router native)

Per S6 §10.1, Server Actions are TypeScript functions invoked from client components via form actions or `useTransition`. They are NOT HTTP endpoints in the REST sense.

| Server Action | Route / location | Input | Output | Auth (capability) |
|---|---|---|---|---|
| `loginAction` | app/admin/login/page.tsx | `{ username, password }` (Zod loginSchema) | `{ ok: boolean, error?: string }` | None (public — no capability check; delegates to Better Auth signInUsername) |
| `logoutAction` | app/admin/layout.tsx | — | `{ ok: boolean }` | Authenticated (ADMIN or FANTOMAS — middleware + layout guard) |
| `createOfferAction` | app/admin/offres/nouvelles/page.tsx | `OfferInput` (Zod offerSchema) | `{ ok: boolean, id?: uuid, error?: string }` | `offer:create` + `offer:save` |
| `updateOfferAction` | app/admin/offres/[id]/page.tsx | `{ id, ...OfferInput }` (Zod) | `{ ok: boolean, error?: string }` | `offer:edit` + `offer:save` |
| `publishOfferAction` | components/admin/PublishButton.tsx (or app/admin/offres page) | `{ id }` | `{ ok: boolean, error?: string }` | `offer:publish` |
| `suspendOfferAction` | components/admin/SuspendButton.tsx (or app/admin/offres page) | `{ id }` | `{ ok: boolean, error?: string }` | `offer:suspend` |
| `republishOfferAction` | components/admin/RepublishButton.tsx (or app/admin/offres page) | `{ id }` | `{ ok: boolean, error?: string }` | `offer:republish` |
| `archiveOfferAction` | components/admin/ArchiveButton.tsx (or app/admin/offres page) | `{ id }` | `{ ok: boolean, error?: string }` | `offer:archive` |

Note: The S6 §10.1 table specifies `loginAction` input as `{ login, password }`, but the existing `loginSchema` (WP-002) and the Better Auth `signInUsername` endpoint use `{ username, password }`. WP-003 uses `{ username, password }` to match the existing schema and the Better Auth endpoint (S6 §12.3 confirms: `auth.api.signInUsername({ body: { username, password } })`). The S6 §10.1 table's "login" is a label inconsistency; the canonical field name is `username`.

Each Server Action:
1. Calls `requireCapability(capability)` first (except `loginAction` which is public).
2. Validates input via Zod schema from `lib/server/validation/`.
3. Calls the corresponding service in `lib/server/services/offers.ts` (NEW — offer CRUD + lifecycle transitions).
4. Returns a structured result `{ ok, error? }` without throwing (Server Actions that throw leak stack traces; we return error objects).
5. Calls `revalidatePath` to refresh the relevant page cache (Next.js App Router).

### No External API

WP-003 introduces NO external API (INT-001, OOS-015). All Server Actions are internal Next.js endpoints. No webhook, no OAuth callback, no third-party integration.

### Admin Routes (per S6 §6.1 — reproduced exactly)

| Route | Component | Purpose | FR |
|---|---|---|---|
| `/admin/login` | app/admin/login/page.tsx (Client or Server Component with form) | Login form | FR-001 |
| `/admin` | app/admin/page.tsx | Redirect to `/admin/offres` | (navigation) |
| `/admin/offres` | app/admin/offres/page.tsx (Server Component) | Admin offer list | FR-010, FR-011, FR-012, FR-013, FR-061 |
| `/admin/offres/nouvelles` | app/admin/offres/nouvelles/page.tsx (Client Component with form) | New offer form | FR-020 |
| `/admin/offres/[id]` | app/admin/offres/[id]/page.tsx (Client Component with form) | Edit form | FR-021 |
| (layout) | app/admin/layout.tsx | Auth guard (defense in depth) + logout button | FR-002, FR-003 |
| (middleware) | middleware.ts (root-level) | Protect `/admin/*` (authentication only) | FR-003 |

Note on route naming: S6 §6.1 uses `nouvelles` (feminine plural, agreeing with "offres") and `[id]` (no `/modifier` suffix). The brief §14 mentions alternative names (`nouveau`, `{id}/modifier`) but says "first inspect the canonical documents. If routes are already decided there, use them exactly." The canonical S6 routes are used exactly.

---

## 13. Error / Edge Semantics

| Error / Edge | Expected Behavior | Source |
|---|---|---|
| Unauthenticated access to `/admin/*` | middleware redirects to `/admin/login`; no admin content rendered | FR-003, S6 §13.4 |
| Invalid credentials on login | Re-render login page with error "Identifiants invalides" (no information leak about which field was wrong) | FR-001 acceptance |
| Rate limit exceeded on login | Better Auth returns "too many attempts" error (DB-backed rate limiter from WP-002); login page shows the error | TD-031, S6 §12.3 |
| Missing title on save | Reject with field-specific error "Le titre est requis"; preserve entered form values | FR-023, BR-030 |
| Missing description on save | Reject with field-specific error "La description est requise"; preserve entered form values | FR-023, BR-030 |
| Invalid email in application_email | Reject with "L'email doit être valide"; preserve form values | FR-024, BR-080 |
| Invalid URL in application_url | Reject with "L'URL de candidature doit être valide"; preserve form values | FR-024, BR-080 |
| Invalid URL in source_url | Reject with "L'URL source doit être valide"; preserve form values | FR-024, BR-080 |
| Publish action on non-DRAFT offer | Reject with "L'offre n'est pas en brouillon" (server-side state validation; do NOT rely on disabled UI button) | brief §18 |
| Suspend action on non-PUBLISHED offer | Reject with "L'offre n'est pas publiée" | brief §18 |
| Republish action on non-SUSPENDED offer | Reject with "L'offre n'est pas suspendue" | brief §18 |
| Archive action on ARCHIVED offer | Reject with "L'offre est déjà archivée" (ARCHIVED is terminal) | BR-024, brief §18 |
| Any lifecycle action on ARCHIVED offer | Reject (ARCHIVED is terminal — no transition out in V1) | BR-024 |
| Offer not found (edit/action on non-existent id) | Reject with "Offre introuvable"; UI shows error or 404 | brief §19 |
| Database failure | Return `{ ok: false, error: 'Erreur technique' }`; log server-side; do NOT expose stack traces or secrets to the browser | brief §19 |
| Unauthorized (authenticated but lacks capability) | Server Action returns `{ ok: false, error: 'Action non autorisée' }`; UI shows the error | S6 §13.4 |
| Concurrent modification (two admins edit same offer) | Last write wins (V1 small admin team; no optimistic concurrency required). If `updateOfferAction` loads an offer that was deleted between load and update, the UPDATE affects 0 rows → return "Offre introuvable" | brief §18 (allowed implementation freedom) |
| Empty admin list | Display "Aucune offre disponible" (FR-061) | FR-061 |
| Filtered empty list | Display "Aucune offre ne correspond à votre filtre" | FR-061 (adapted) |

---

## 14. Acceptance Contract

Acceptance criteria must be observable, testable, traceable, and specific enough to determine PASS/FAIL (per S9 §23).

| # | Condition | Observable Evidence |
|---|---|---|
| AC-001 | Admin login UI functional | app/admin/login/page.tsx exists; login form renders with French labels; loginAction Server Action exists; successful login redirects to /admin/offres |
| AC-002 | Logout functional | logoutAction Server Action exists; successful logout redirects to /admin/login; session record deleted in DB |
| AC-003 | Unauthorized admin access denied | Unauthenticated request to /admin/offres → middleware redirects to /admin/login (integration test) |
| AC-004 | ADMIN accepted | ADMIN login PASS; ADMIN can access /admin/offres; ADMIN can perform all admin actions |
| AC-005 | FANTOMAS accepted for ADMIN capabilities | FANTOMAS login PASS; FANTOMAS can access /admin/offres; FANTOMAS can perform all admin actions (PERM-004 inheritance) |
| AC-006 | Admin offer list functional | app/admin/offres/page.tsx exists; displays all offers (regardless of status) sorted by created_at DESC; each row shows title, status badge, actions |
| AC-007 | Status filtering functional | ?status=DRAFT narrows list to DRAFT offers; ?status=PUBLISHED narrows to PUBLISHED; etc.; clearing filter restores full list (FR-012 MUST) |
| AC-008 | Admin title search functional (if implemented) | ?q=term narrows list to offers whose title ILIKE %term% (case-insensitive); clearing search restores full list (FR-013 SHOULD — if S10 implements it; if descoped to V2, OWNER approval required and AC-008 marked DEFERRED) |
| AC-009 | Create offer | createOfferAction creates a new offer with status='DRAFT', published_at=NULL; redirect to /admin/offres; new offer visible in admin list (integration test) |
| AC-010 | Title required | Zod offerSchema rejects empty title with "Le titre est requis"; no offer persisted (unit + integration test) |
| AC-011 | Description required | Zod offerSchema rejects empty description with "La description est requise"; no offer persisted (unit + integration test) |
| AC-012 | Optional fields truly optional | All 14 optional fields accept empty/NULL; absent optional does not block save/publish (integration test — create offer with only title + description succeeds) |
| AC-013 | Tiptap JSON persisted | Create offer with Tiptap description JSON; reload edit form; verify description JSON round-trips (integration test) |
| AC-014 | Save as DRAFT | New offer saves as DRAFT (status='DRAFT', published_at=NULL); offer NOT visible publicly (integration test) |
| AC-015 | Edit DRAFT | updateOfferAction on DRAFT offer preserves DRAFT status, published_at stays NULL, updated_at changes (integration test) |
| AC-016 | Publish explicitly | publishOfferAction on DRAFT → PUBLISHED; published_at set to now(); updated_at changes (integration test) |
| AC-017 | Edit PUBLISHED without implicit status change | updateOfferAction on PUBLISHED offer preserves PUBLISHED status, published_at preserved, updated_at changes (FR-025) (integration test) |
| AC-018 | Suspend PUBLISHED | suspendOfferAction on PUBLISHED → SUSPENDED; content + published_at preserved; updated_at changes (BR-023) (integration test) |
| AC-019 | Republish SUSPENDED | republishOfferAction on SUSPENDED → PUBLISHED; published_at preserved (NOT overwritten); updated_at changes (BR-022) (integration test) |
| AC-020 | Archive allowed states | archiveOfferAction succeeds on DRAFT, PUBLISHED, SUSPENDED; each → ARCHIVED; content + published_at preserved; updated_at changes (BR-024) (integration test for each starting state) |
| AC-021 | ARCHIVED terminal | No V1 action transitions out of ARCHIVED; publish/suspend/republish/archive all rejected for ARCHIVED with appropriate error message (integration test) |
| AC-022 | No physical delete | No deleteOfferAction exists; no DELETE query on offers table in WP-003 code; ARCHIVED offers remain indefinitely (FR-034) (code inspection + integration test) |
| AC-023 | No automatic expiration | No scheduler, no cron, no background job; application_deadline in the past does NOT change status (FR-035, BR-026, BR-062) (integration test — set past deadline, verify status unchanged) |
| AC-024 | Invalid lifecycle transitions rejected server-side | publishOfferAction on non-DRAFT → reject; suspendOfferAction on non-PUBLISHED → reject; republishOfferAction on non-SUSPENDED → reject; archiveOfferAction on ARCHIVED → reject (integration test for each) |
| AC-025 | Application fields supported | application_modalities (text), application_email (email), application_url (URL) accepted in form; saved to DB; validated when provided (BR-040, BR-080) (integration test) |
| AC-026 | Source fields supported | source_name (text), source_url (URL), source_publication_date (date) accepted in form; saved to DB; source_url validated when provided (BR-050, BR-061, BR-080) (integration test) |
| AC-027 | Server validation authoritative | Server Action validates via Zod BEFORE DB write; invalid input rejected with field-specific error; client-side validation is UX-only (integration test — bypass client validation, verify server still rejects) |
| AC-028 | Authz checked server-side | Each admin Server Action calls requireCapability() first; unauthenticated or unauthorized mutation rejected before DB write (integration test) |
| AC-029 | middleware.ts created | middleware.ts exists at root; protects /admin/* routes; redirects unauthenticated to /admin/login (integration test) |
| AC-030 | No public portal implementation | No app/(public)/offres/ directory; no public offer list; no public offer detail; app/page.tsx remains minimal from WP-001 (code inspection) |
| AC-031 | No WP-004 work | No sitemap.ts, no robots.ts, no public Tiptap server-side renderer (code inspection) |
| AC-032 | No new capabilities | lib/server/auth/capabilities.ts unchanged from WP-002; no offer:read, no offer:update, no SUPER_ADMIN (code inspection) |
| AC-033 | No schema changes | db/schema.ts unchanged from WP-002; no new migration files in db/migrations/ (code inspection) |
| AC-034 | No auth core changes | lib/server/auth/auth.ts, lib/server/auth/authorization.ts, lib/server/auth/capabilities.ts unchanged from WP-002 (code inspection) |
| AC-035 | lint PASS | pnpm lint exit 0 |
| AC-036 | typecheck PASS | pnpm typecheck exit 0 |
| AC-037 | tests PASS | pnpm test exit 0 (all unit + integration tests pass) |
| AC-038 | build PASS | pnpm build exit 0 |
| AC-039 | No secret committed | grep for password patterns in tracked files returns only .env.example placeholders; .env.local gitignored (from WP-002) (code inspection) |
| AC-040 | No Production DB touched | All integration tests run against TEST_DATABASE_URL (positively verified); no Production DB writes (integration test config inspection) |
| AC-041 | Diff within contract | No changes to forbidden files (PROJECT_CHARTER, PRODUCT_REQUIREMENTS, TECHNICAL_SPECIFICATION, PROJECT_MANIFEST, ADRs, DELIVERY_ROADMAP); no replacement of Better Auth / Drizzle / neon-http; no principalType doctrine modification; no main branch development; no WP-004 code (diff review) |
| AC-042 | Tiptap scope bounded | Tiptap editor supports only V1 subset (paragraphs, headings, bullet lists, ordered lists, links, basic emphasis); no images, tables, code blocks, embeds; no raw HTML storage (code inspection) |
| AC-043 | Empty admin state | Admin list displays "Aucune offre disponible" when no offers exist (FR-061) (integration or component test) |
| AC-044 | French UI strings | All admin UI strings in French (NFR-040) (code inspection) |
| AC-045 | System-managed fields not editable | id, status, published_at, created_at, updated_at are NOT exposed as ordinary editable inputs in the form; status displayed as read-only badge; published_at/created_at displayed as read-only (code inspection) |
| AC-046 | No empty directories | All created directories contain real files |

---

## 15. Verification Expectations (S11 evidence)

S11 must independently verify:

- **Unit tests (Vitest):** lifecycle state machine (all allowed + forbidden transitions), Zod offerSchema validation, `can()` checks for offer capabilities
- **Integration tests (Vitest against real TEST_DATABASE_URL — no DB mocks):** every AC from AC-003 to AC-028 that involves a DB read/write; each lifecycle transition; ARCHIVED terminal; no physical delete; no auto-expiration; Tiptap JSON round-trip
- **Quality gates:** lint, typecheck, test, build all PASS (AC-035 to AC-038)
- **Manual functional verification (per brief §23):** ADMIN login → offers list → create offer → save DRAFT → reopen/edit → publish → suspend → republish → archive; UI clearly reflects status changes. This is manual evidence (not automated); S11 may verify by running the dev server and walking the flow, or by reviewing S10's manual verification evidence.
- **Code inspection:** AC-029 to AC-034, AC-041 to AC-046 (diff review, no forbidden changes)
- **No DB mocks:** integration tests must use the real TEST_DATABASE_URL (per ADR-0008); S11 verifies by inspecting test setup (no `vi.mock` for DB, no in-memory DB substitute)

S11 does NOT need to perform Playwright E2E (that's MS-005 / WP-005, out of scope for WP-003).

---

## 16. Forbidden Expansion

S10 MUST NOT:

- Start WP-004 (public portal): no app/(public)/offres/, no public offer list, no public offer detail, no sitemap.ts, no robots.ts, no public Tiptap server-side renderer
- Start S12 (closure) — S10 only implements; S11 verifies; S12 closes
- Install Playwright or configure E2E tests (MS-005)
- Configure Vercel or GitHub Actions CI (MS-006)
- Touch Neon Production / main branch
- Merge dev into main
- Modify db/schema.ts (no schema changes — reuse WP-002 schema)
- Create new migration files in db/migrations/ (no migration needed)
- Modify lib/server/auth/auth.ts (Better Auth config — reuse from WP-002)
- Modify lib/server/auth/authorization.ts (can/requireCapability/getPrincipal — reuse from WP-002)
- Modify lib/server/auth/capabilities.ts (capability model — reuse from WP-002; no new capabilities, no rename, no duplication)
- Modify app/api/auth/[...all]/route.ts (Better Auth route handler — reuse from WP-002)
- Modify app/page.tsx or app/layout.tsx (root page/layout — remain from WP-001)
- Add new capabilities (e.g., `offer:read`, `offer:update`, `SUPER_ADMIN`) — reuse existing canonical identifiers
- Replace Better Auth, Drizzle, or change from `drizzle-orm/neon-http` (CONTRACT DIVERGENCE if needed — STOP and report)
- Modify principalType doctrine (CONTRACT DIVERGENCE if needed — STOP and report)
- Add a `deleteOfferAction` or any physical delete query (FR-034 — physical delete out of scope V1)
- Add a scheduler, cron, background job, or automatic status transition (FR-035, BR-026, S0 §23)
- Add an Apply button, application form, CV upload, or internal application workflow (BR-040)
- Add candidate accounts, recruiter accounts, or public registration (FR-004)
- Add social sharing, logos, duplicate-offer action, dedicated preview mode
- Add multilingual support (NFR-040: French only for V1)
- Add a public API (INT-001, OOS-015)
- Add complex RBAC or SUPER_ADMIN (DR-051 deferred)
- Mass-generate shadcn components (only install/use components required by the actually implemented admin screens)
- Add Tiptap nodes beyond the V1 subset (paragraphs, headings, bullet lists, ordered lists, links, basic emphasis — no images, tables, code blocks, embeds)
- Store HTML as the canonical description source (Tiptap JSON is the source of truth — ADR-0005)
- Use `dangerouslySetInnerHTML` with user content (CONTRACT DIVERGENCE — ADR-0005)
- Add packages not listed in Authorized Dependencies (Section below)
- Modify the Charter, Product Requirements, Technical Specification, ADRs, Project Manifest, or Delivery Roadmap
- Apply migrations to Production or Preview DB
- Use "not obviously Production" as sufficient target verification (must positively verify DEV/TEST)
- Bypass server-side validation or authorization
- Expose internal stack traces or secrets to the browser

---

## 17. Known Risks / Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| Tiptap React editor compatibility with Next.js App Router (Client Component editor in a Server Component route) | Medium | Test the Tiptap editor early in S10; verify it saves JSON correctly and loads existing JSON for re-editing. The Tiptap client-side editor is well-supported in Next.js Client Components; the risk is low but should be validated early. |
| Form complexity (16 editable fields) | Low | Group fields logically per S6 §25 (Informations principales, Caractéristiques, Dates, Description, Candidature, Source). Use React Hook Form (TD-007) for form state management. |
| Tiptap JSON validation (description field) | Low | The existing offerSchema uses `z.any()` for description. S10 MAY tighten this to validate that description is a non-empty Tiptap JSON object (at minimum `{ type: "doc", content: [] }`). This is an allowed implementation freedom, not a blocker. |
| Admin title search (FR-013 SHOULD) performance with large offer count | Low | For V1's small admin team, ILIKE without a trigram index is acceptable. If performance becomes an issue, a trigram index (pg_trgm) could be added in a future WP — but that requires a migration, which is out of scope for WP-003. If S10 finds ILIKE performance disproportionate, defer FR-013 to V2 with OWNER approval (per FR-013 NOTE). |
| middleware.ts session check performance | Low | Better Auth session check is DB-backed (one query per request). For V1's small admin team, this is acceptable. Middleware runs on every /admin/* request; no caching of session in V1. |
| Concurrency (two admins edit same offer simultaneously) | Low | V1 uses last-write-wins (no optimistic concurrency). For a small admin team, this is acceptable. If concurrency becomes an issue, optimistic concurrency via `updated_at` check could be added in a future WP — but that is out of scope for WP-003. |

No CRITICAL or HIGH blockers identified. All risks are Medium or Low with clear mitigations.

---

## 18. Allowed Implementation Freedom

Per S9 §30, S10 may choose freely in these areas (provided behavior remains correct, architecture conformant, no scope expansion, quality gates intact):

- Local helper naming, internal refactoring within the authorized boundary
- Test file organization (which test files to create, how to group tests)
- Minor component decomposition (e.g., StatusBadge as a separate component vs inline)
- Exact shadcn/ui components to install (only those actually used by the implemented screens)
- Exact Tiptap extension set within the V1 subset (e.g., whether to include `@tiptap/extension-text-align` — no, that's outside the V1 subset; but whether to use `Bold` and `Italic` from starter-kit or as separate extensions — S10's choice)
- Whether to implement admin title search (FR-013 SHOULD) or defer to V2 with OWNER approval
- Whether to use optimistic concurrency (via `updated_at` check) or simple last-write-wins
- Whether to tighten description validation beyond `z.any()` (e.g., validate Tiptap JSON structure)
- Exact pagination implementation (page-based vs infinite scroll — page-based is simpler and sufficient for V1)
- Exact French wording of UI strings (provided they are French and clear)
- Whether action buttons are in the offer list row or in the edit page (S6 §10.1 places publish/suspend/republish/archive actions in components/admin/*Button.tsx, suggesting they're in the list row; S10 may follow this or place them in the edit page — both are valid as long as the actions work)

---

## 19. S10 Handoff

| Field | Value |
|---|---|
| WP ID | WP-003 |
| Authorized Purpose | Admin Offer Management (MS-003) — admin login, offer list, create/edit form with Tiptap, full lifecycle (publish/suspend/republish/archive), server-side authz + validation, no public portal |
| Requirements Covered | FR-001, FR-002, FR-003, FR-010, FR-011, FR-012, FR-013 (SHOULD), FR-020–FR-025, FR-030–FR-035, FR-061, BR-020–BR-080 (relevant), PERM-002/003/004, NFR-040/050/060/012 |
| Verified Baseline | dev `e86db99bc513e4f8289a08325ef996f9f10317b2`; main `0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d` (unchanged) |
| In Scope | Admin login UI, logout, middleware.ts, admin offer list (with status filter + optional title search), new/edit offer form with Tiptap, lifecycle Server Actions, server-side validation, integration tests |
| Out of Scope | Public portal (WP-004), E2E (WP-005), Vercel/CI (WP-006), forgot-password, user management, candidate/recruiter features, physical delete, automatic expiration, schema changes, auth core changes |
| Technical Constraints | ADR-0001–0008, TD-006/007/008/009/011/030, S0 §13/§23/§25, NFR-040 (French), NFR-012 (session protection) |
| Acceptance Contract | 46 conditions (AC-001 through AC-046) |
| Forbidden Expansion | See Section 16 |
| Migration Required | NO (reuse WP-002 schema) |
| Next WP | WP-004 — Public Job Portal (NOT YET AUTHORIZED) |

**S10 must implement only this bounded unit. No other WP is authorized.**

---

## 20. Approval / Authorization

| Field | Value |
|---|---|
| WP Status | DRAFT — PENDING OWNER APPROVAL + AUTHORIZATION |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED (requires OWNER APPROVE + AUTHORIZE) |
| Next WP | WP-004 — Public Job Portal (NOT YET AUTHORIZED) |

### Authorized Dependencies

New packages to install in S10 (in addition to WP-001 + WP-002 packages):

| Package | Justification | Source |
|---|---|---|
| `@tiptap/react` | Tiptap React editor for the admin offer form (description field) | ADR-0005, TD-009, brief §7 |
| `@tiptap/starter-kit` | Basic Tiptap nodes (paragraph, heading, bulletList, orderedList, bold, italic) | brief §7 (V1 subset) |
| `@tiptap/extension-link` | Link support in the description editor | brief §7 |
| `@tiptap/pm` | ProseMirror peer dependency (required by Tiptap) | Tiptap runtime requirement |
| `react-hook-form` | Form state management for the admin offer form | TD-007 |
| `@hookform/resolvers` | zodResolver for React Hook Form + Zod integration | TD-007, TD-008 |
| shadcn/ui components (minimal) | Only components required by the actually implemented admin screens (e.g., button, input, label, form, badge, card, select — exact list determined by S10 based on actual usage) | TD-011, brief §15 |
| `lucide-react` | Icons for action buttons (Publish, Suspend, Republish, Archive, etc.) — only if icons are genuinely used | brief §15 |

**Packages that MUST NOT be installed:**

- `@playwright/test` (MS-005)
- `@tanstack/react-query`, `@tanstack/react-table` (TD-006: not needed in V1)
- Tiptap extensions beyond the V1 subset (e.g., `@tiptap/extension-image`, `@tiptap/extension-table`, `@tiptap/extension-code-block-lowlight`)
- Any package not justified by this WP

Versions: exact versions resolved and locked by package.json + pnpm-lock.yaml at S10 time. No invented versions in this contract. Do NOT install dependencies during S9 — installation happens in S10 only.

### Allowed Change Surface

| File/Directory | Action | Notes |
|---|---|---|
| `app/admin/` | CREATE | Admin route group: login/page.tsx, layout.tsx, page.tsx (redirect), offres/page.tsx, offres/nouvelles/page.tsx, offres/[id]/page.tsx |
| `middleware.ts` | CREATE | Root-level middleware; protects /admin/* (authentication only — redirects to /admin/login if no session) |
| `components/admin/` | CREATE | Admin-only components: OfferForm, OfferList (or inline in page), StatusBadge, action buttons (PublishButton, SuspendButton, RepublishButton, ArchiveButton), TiptapEditor |
| `components/ui/` | CREATE (minimal) | shadcn/ui copies — only components actually used by the implemented admin screens |
| `lib/server/services/offers.ts` | CREATE | Offer CRUD + lifecycle transitions service (create, update, publish, suspend, republish, archive, list, getById) |
| `lib/server/validation/schemas.ts` | MODIFY (extend) | Extend existing offerSchema if WP-003 requires (e.g., tighten description validation); do NOT remove existing schemas |
| `package.json` | MODIFY | Add Tiptap, react-hook-form, @hookform/resolvers, lucide-react (if used), shadcn/ui deps |
| `pnpm-lock.yaml` | MODIFY | Lockfile updated |
| Test files (e.g., `__tests__/lifecycle.test.ts`, `__tests__/offers-integration.test.ts`) | CREATE | Unit tests (lifecycle state machine, Zod) + integration tests (against TEST_DATABASE_URL) |

**Files that MUST NOT be created or modified:**

- `db/schema.ts` (no schema changes)
- `db/migrations/` (no new migrations)
- `lib/server/auth/auth.ts` (Better Auth config — reuse from WP-002)
- `lib/server/auth/authorization.ts` (can/requireCapability/getPrincipal — reuse from WP-002)
- `lib/server/auth/capabilities.ts` (capability model — reuse from WP-002; no new capabilities)
- `app/api/auth/[...all]/route.ts` (Better Auth route handler — reuse from WP-002)
- `app/page.tsx`, `app/layout.tsx` (root page/layout — remain from WP-001)
- `app/(public)/` (public portal — WP-004)
- `app/sitemap.ts`, `app/robots.ts` (SEO — WP-004)
- `docs/planning/PROJECT_CHARTER.md`
- `docs/product/PRODUCT_REQUIREMENTS.md`
- `docs/architecture/TECHNICAL_SPECIFICATION.md`
- `docs/architecture/PROJECT_MANIFEST.md`
- `docs/architecture/adr/` (all ADRs)
- `docs/planning/DELIVERY_ROADMAP.md`
- `docs/engineering/` (all AISE protocol files)

### Branch Strategy

Per S10 implementation execution protocol §6: "branch and HEAD (must be origin/main or authorized base)." The canonical development branch is `dev` (per PROJECT_STATE). WP-001 and WP-002 were both implemented directly on `dev` (no dedicated work-package branch). The current canonical policy is: implement on `dev` directly.

WP-003 follows the exact canonical policy: S10 implements on `dev` directly. No dedicated `wp/003-admin-offers` branch is created (the brief §28 allows a dedicated branch only "if the now-approved workflow requires it" — the current workflow does not require it).

- Active branch for S10: `dev`
- Do NOT develop on `main` (DISALLOWED per branch cutover)
- Do NOT merge `dev` into `main` during S10
- `main` remains release-only at `0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d`

### Verification Commands (per brief §29)

The future S10 must finish with all of the following PASS:

```
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Plus WP-003 integration/functional verification defined in this contract (Section 5 — Tests, and Section 14 — Acceptance Contract).

### Quality Gate Self-Check (per S9 §46)

| Check | Result |
|---|---|
| Source milestone valid | YES (MS-003 — DELIVERY_ROADMAP §7 line 208) |
| Requirement traceability complete | YES (38 requirements covered — FR/BR/PERM/NFR traced to S5) |
| Orphan scope | 0 |
| Blocking ambiguities | 0 (published_at semantics defined in BR-022 + S6 §7.1) |
| In scope explicit | YES (Section 5) |
| Out of scope explicit | YES (Section 6) |
| Intended behavior unambiguous | YES (Section 7 — every flow defined) |
| Business rule contradictions | 0 (Section 8 — restated from S5, no meaning changed) |
| S6/S7 architecture contradictions | 0 (Section 11 — reproduced from ADRs) |
| Acceptance criteria too vague | 0 (46 observable conditions) |
| Forbidden expansion defined | YES (Section 16) |
| Target environment safety defined | YES (DEV/TEST only — reuse WP-002 target verification) |
| Unauthorized automation | 0 (no cron, no scheduled work) |
| Unauthorized production action | 0 (no Production DB, no Vercel, no main branch) |
| OWNER approval + authorization | REQUIRED (PENDING) |

**Verdict: QUALITY GATE PASS. WP-003 is READY FOR OWNER APPROVAL + AUTHORIZATION.**

---

## 21. S9 Closure

S9 only. Do NOT start S10. Do NOT install Tiptap. Do NOT create admin pages. Do NOT execute DB writes. Do NOT start WP-004.

At S9 closure, the state must be:

- Exactly 1 WP contract created (this file)
- Scope = MS-003 only
- No application code modified
- No dependencies installed
- No DB migration executed
- No Production access
- No WP-004 prepared
- Offer lifecycle complete (all 4 states + all allowed transitions defined)
- Tiptap scope bounded (V1 subset)
- Authz server-side (middleware + requireCapability)
- Fantomas inheritance preserved (no new capabilities; reuse existing)
- Physical delete absent (no deleteOfferAction)
- Automatic expiration absent (no scheduler)
- Public portal excluded (no app/(public)/offres/)
- Allowed change surface explicit (Section 20 — Allowed Change Surface)
- Tests and exit criteria measurable (46 acceptance criteria)

**S9 STATUS: COMPLETE. AWAITING OWNER APPROVAL + AUTHORIZATION.**
