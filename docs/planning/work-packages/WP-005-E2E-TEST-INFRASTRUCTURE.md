# WP-005 — E2E Test Infrastructure

## 1. Contract Status

| Field | Value |
|---|---|
| WP ID | WP-005 |
| Name | E2E Test Infrastructure |
| Source Milestone | MS-005 — E2E Integration + Hardening (DELIVERY_ROADMAP §7) |
| Status | DRAFT (FINAL PATCHED) — PENDING OWNER APPROVAL + AUTHORIZATION |
| Canonical dev SHA (at S9 start) | `484898e5b513d1313f458880a6fc6b32175aa990` |
| Canonical dev SHA (after initial S9 contract) | `6278315929868210ed9ac96a80748e6f471b0c25` (HISTORICAL PRE-PATCH — not the S10 branch base) |
| Canonical dev SHA (after S9 hardening patch) | `6dd5b337449f266b436b46420061d887cd51c0b1` (HISTORICAL PRE-FINAL-PATCH — not the S10 branch base) |
| FINAL S10 BRANCH BASE (frozen) | `6dd5b337449f266b436b46420061d887cd51c0b1` (the dev head AFTER this final S9 patch — S10 MUST branch from this exact SHA, including BOTH the original S9 contract AND the final target-verification hardening) |
| S9 patch operations | 2 (patch 1: harden E2E target verification contract; patch 2: freeze S10 baseline and test fingerprint — this patch) |
| Canonical main SHA (at S9 start) | `0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d` |
| Source Charter (S4) | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Source Product Requirements (S5) | `docs/product/PRODUCT_REQUIREMENTS.md` at `9ec4a08` |
| Source Technical Specification (S6) | `docs/architecture/TECHNICAL_SPECIFICATION.md` at `7c85323` |
| Source Project Manifest (S7) | `docs/architecture/PROJECT_MANIFEST.md` at `0b8b436` |
| Source Delivery Roadmap (S8) | `docs/planning/DELIVERY_ROADMAP.md` at `2796c2d` |
| Previous WP | WP-004 — CLOSED / PASS (impl head `a7b3833`, closure commit `484898e`) |
| AISE S0 Version | 0.2 (§26 REMOTE RUNTIME COST & QUOTA SAFETY active) |
| OWNER Approval | PENDING |
| S10 Authorization | NOT GRANTED (requires OWNER APPROVE + AUTHORIZE) |
| S10 Started | NO |
| WP-006 Started | NO |

---

## 2. Purpose

Establish a permanent, deterministic, quota-safe browser E2E verification capability for JOURDAIN EMPLOI. A REAL browser proves the critical user journeys (public + admin + Fantomas) end-to-end, while strictly preserving the quota-safety doctrine activated in S0 v0.2 §26: local application runtime, TEST database target only, no Vercel, no remote E2E by default, no production mutation, no DEV mutation.

This WP delivers the E2E infrastructure (config + fixtures + specs + local Next.js orchestration + fail-closed guards). It does NOT deliver new business features, does NOT modify the database schema, does NOT modify the application code, does NOT configure Vercel, does NOT create the CI workflow (CI is MS-006 scope per S8 §7 and S6 TD-025), and does NOT close the project.

The E2E infrastructure is additive to the existing 149-test Vitest suite (11 files). It MUST NOT replace unit or integration coverage.

---

## 3. Requirements Covered

**REQUIREMENTS COVERED NOW (this WP):**

| Requirement | Priority | Coverage | Notes |
|---|---|---|---|
| NFR-001 (public page response time — SHOULD) | SHOULD | PRIMARY | Local E2E verifies page loads without error under normal conditions |
| NFR-030 (accessibility — SHOULD) | SHOULD | PRIMARY | axe-core scan in E2E on public + admin pages; keyboard navigation test |
| NFR-060 (offer integrity across lifecycle) | MUST | PRIMARY | E2E critical journey verifies content preserved across all lifecycle transitions |
| FR-001 (admin login) | MUST | PRIMARY | E2E step 1 — ADMIN login via real browser |
| FR-002 (admin logout) | MUST | PRIMARY | E2E step 15 — ADMIN logout, session invalidated |
| FR-004 (no public registration) | MUST | PRIMARY | E2E: verify no /register route reachable; no /sign-up UI |
| FR-010 / FR-011 (admin offer list + status visibility) | MUST | PRIMARY | E2E step 2 — admin list visible, status badges correct |
| FR-020 (new offer creation) | MUST | PRIMARY | E2E step 2 — create DRAFT via real UI |
| FR-021 (offer editing) | MUST | PRIMARY | E2E step 3 — edit DRAFT, content persisted |
| FR-025 (edit PUBLISHED preserves published_at) | MUST | PRIMARY | E2E step 11 — republish preserves published_at |
| FR-030 / FR-031 / FR-032 / FR-033 (publish/suspend/republish/archive) | MUST | PRIMARY | E2E steps 4, 7, 9, 12 — full lifecycle via real UI |
| FR-040 (public offer list at root) | MUST | PRIMARY | E2E step 5 — public list shows PUBLISHED offer |
| FR-041 (public offer detail) | MUST | PRIMARY | E2E step 6 — detail page renders all fields |
| FR-042 (non-published returns not-found) | MUST | PRIMARY | E2E steps 8, 13 — direct URL → 404 for hidden |
| FR-050 (public simple search — SHOULD) | SHOULD | PRIMARY | E2E: search via `?q=` parameter |
| FR-060 (empty public list state) | MUST | SECONDARY | E2E: visible when no PUBLISHED offers (fixture-driven) |
| BR-025 (public visibility — PUBLISHED only) | MUST | PRIMARY | E2E steps 5, 8, 11, 13 — visibility toggles with status |
| BR-033 (unknown company presentation) | MUST | SECONDARY | E2E: detail shows "Entreprise non communiquée" when company absent |
| BR-034 (Tiptap rendering) | MUST | PRIMARY | E2E step 6 — Tiptap content preserved in detail |
| BR-040 (no Apply button) | MUST | PRIMARY | E2E step 7 — verify no Apply button on detail |
| BR-070 / BR-071 (published_at DESC + created_at DESC) | MUST | SHOULD | E2E: PUBLISHED list ordering |
| PERM-001 (public read access) | MUST | PRIMARY | E2E: anonymous browse without auth |
| PERM-002 (ADMIN full lifecycle) | MUST | PRIMARY | E2E: full admin lifecycle |
| PERM-004 (FANTOMAS inherits ADMIN + Fantomas-only) | MUST | PRIMARY | E2E: FANTOMAS login + authorized admin access; Fantomas-only capability verified at integration layer |
| TD-024 (testing strategy Layer 4) | MUST | PRIMARY | Playwright E2E infrastructure |
| TD-029 (SEO — sitemap + robots + metadata) | MUST | SECONDARY | E2E: verify `/sitemap.xml` and `/robots.txt` reachable; metadata present |
| ADR-0008 (Vitest + RTL + Playwright, real DB) | MUST | PRIMARY | Playwright installed and configured |
| ADR-0006 (env isolation + target verification) | MUST | PRIMARY | E2E runner positively verifies TEST database before any execution |
| AISE S0 §26 (quota-safety) | MUST | PRIMARY | LOCAL app, TEST DB, no Vercel, no remote E2E by default |

**REQUIREMENTS NOT IN THIS WP:**

| Requirement | Reason |
|---|---|
| CI workflow configuration (TD-025) | MS-006 scope per S8 §7 (Environments + CI/CD). WP-005 produces E2E specs that MS-006 CI will consume. |
| Vercel deployment (TD-019 deployment side) | MS-006 scope |
| Production / Preview environment variables | MS-006 scope |
| Performance/load testing | Out of scope — V1 has no quantitative performance SLO (Charter §13) |
| Synthetic production monitoring | Out of scope — S0 §23 zero scheduled work |
| New business features | Out of scope — all features from MS-003/004 are CLOSED |
| Component tests (RTL) | Already largely covered by existing Vitest test files; WP-005 may add minimal RTL tests if E2E reveals a gap, but does NOT duplicate them |
| Integration tests (Server Actions + real DB) | Already exist (offers-integration, public-offers-integration, auth-regression) — WP-005 does NOT replace or rewrite them |

**ORPHAN SCOPE: 0**

---

## 4. Entry Conditions

| Condition | Status |
|---|---|
| MS-001 / WP-001 CLOSED / PASS WITH NON-BLOCKING FINDINGS | YES (impl commit `45fa8b7`) |
| MS-002 / WP-002 CLOSED / PASS | YES (impl commit `6d0027a`) |
| MS-003 / WP-003 CLOSED / PASS WITH NON-BLOCKING FINDINGS | YES (impl head `35f80b3`) |
| MS-004 / WP-004 CLOSED / PASS | YES (impl head `a7b3833`, closure commit `484898e`) |
| MS-005 selected as next milestone | YES (DELIVERY_ROADMAP §7) |
| MS-005 entry conditions: "MS-004 CLOSED / PASS" | YES |
| AISE S0 v0.2 §26 QUOTA-SAFETY active | YES |
| BLOCKING PRODUCT AMBIGUITIES | 0 |
| BLOCKING TECHNICAL AMBIGUITIES | 0 |
| Technical baseline (S6/S7) | APPROVED |
| Database schema (offers + user + session + rateLimit) | EXISTS from WP-002; no migration needed |
| Admin offer management (UI + Server Actions) | EXISTS from WP-003; no modification needed |
| Public portal (routes + components) | EXISTS from WP-004; no modification needed |
| Better Auth (Username plugin + Admin plugin + rate limiter) | EXISTS from WP-002; no modification needed |
| Existing 149-test Vitest suite | EXISTS; preserved as-is |
| Test database reachable (TEST_DATABASE_URL) | YES (verified at WP-004 closure) |
| Bootstrap identities (ADMIN + FANTOMAS) in TEST | YES (verified at WP-002 + WP-003) |
| AISE universal governance patch (S0 v0.2 §26) merged | YES (commit `f3f2bdc`) |

---

## 5. In Scope

### 5.1 Playwright E2E Framework

- Install `@playwright/test` as a devDependency (per ADR-0008, TD-024 Layer 4).
- Create `playwright.config.ts` at the project root with:
  - **Single browser: Chromium only** (per quota-safety; multi-engine matrix is OUT OF SCOPE per S0 §26 — Chromium alone proves the critical journey for V1).
  - **Single worker by default** (controlled parallelism is possible later if isolated fixtures justify it; default prefers deterministic state over speed).
  - **0 retries on first run**; optional 1 retry on flake documented as opt-in (NOT enabled by default to avoid masking defects).
  - **Screenshot: only on failure** (not on success).
  - **Trace: on first retry only** (no trace by default).
  - **Video: OFF by default** (opt-in via env var if a specific debugging session requires it).
  - **Base URL: localhost only** by default (see §5.4 Local Base URL Policy).
  - **Test directory: `tests/e2e/`** (per S6 §17 directory structure).

### 5.2 Local Next.js Application Runner

- The E2E runner spawns a LOCAL Next.js production server (`next start` after `next build`) against the TEST database.
- The runner controls the entire lifecycle deterministically:
  1. **Pre-flight guard**: verify TEST database identity (see §5.5) and base URL policy (see §5.4) BEFORE any other action.
  2. **Build**: `pnpm build` once before the suite (reuses existing build artifact if fresh).
  3. **Spawn**: `next start --port <PORT>` with explicit env injection (DATABASE_URL=TEST_DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, INITIAL_ADMIN_LOGIN, INITIAL_ADMIN_PASSWORD, FANTOMAS_INITIAL_PASSWORD, FANTOMAS_EMAIL, INITIAL_ADMIN_EMAIL).
  4. **Readiness probe**: poll `http://127.0.0.1:<PORT>/` until 200 or timeout (default 30s).
  5. **Run E2E suite**: Playwright tests execute against the local server.
  6. **Shutdown**: send SIGTERM to the spawned Next.js process; verify port released.
  7. **Cleanup**: run TEST-only fixture cleanup (see §5.8).
- The runner does NOT rely on a separately hand-started developer server as the canonical automated path.
- The runner does NOT use `next dev` (dev mode has different runtime characteristics — slow first-compile, HMR, source maps) — `next start` after `next build` is the deterministic production-equivalent local target.

### 5.3 Environment Target Contract

This contract eliminates the environment-target ambiguity discovered during WP-004 post-merge verification (parent `.env` `DATABASE_URL=file:...` SQLite fallback leaked into the test process while the authorized target was `TEST_DATABASE_URL`).

**Authorized targets for WP-005 E2E (default):**

| Resource | Authorized | Notes |
|---|---|---|
| Application runtime | LOCAL (Next.js on `127.0.0.1`) | Spawned by the E2E runner |
| Application base URL | `http://127.0.0.1:<PORT>` or `http://localhost:<PORT>` | Loopback only |
| Database / state target | TEST (TEST_DATABASE_URL) | Positively verified before any mutation (see §5.5 Phase A) |
| Remote application target | NO by default | Refused without explicit override (see §5.6) |
| Production database | NEVER by default | Refused unconditionally |
| DEV database | NOT an acceptable substitute for TEST | Refused for E2E |
| SQLite fallback (`file:...`) | Refused | Refused for E2E |

**Environment precedence rules (deterministic, explicit — see also §16 Mutation Ordering Invariant):**

1. The E2E runner explicitly reads `TEST_DATABASE_URL` from `.env.local` (using the same `parseEnvLocal()` pattern already established by the integration tests).
2. The runner positively verifies the TEST database identity (see §5.5 Phase A) BEFORE any mutation (fixture insert, fixture cleanup, rateLimit cleanup, bootstrap, test user creation, offer creation).
3. The runner constructs the child Next.js process environment EXPLICITLY from scratch — it does NOT inherit the parent process environment wholesale.
4. The runner REMOVES or OVERRIDES any inherited parent `DATABASE_URL` from the child environment before spawning. Specifically:
   a. The child environment is built from a curated allowlist of required variables (TEST_DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, INITIAL_ADMIN_LOGIN, INITIAL_ADMIN_PASSWORD, FANTOMAS_INITIAL_PASSWORD, FANTOMAS_EMAIL, INITIAL_ADMIN_EMAIL, plus the explicit `DATABASE_URL` injection).
   b. Any inherited `DATABASE_URL` (including a parent `.env` `DATABASE_URL=file:...` SQLite fallback) is NEUTRALIZED — it is NOT present in the child environment unless explicitly re-injected by the runner as `DATABASE_URL=$TEST_DATABASE_URL`.
   c. The runner injects `DATABASE_URL=$TEST_DATABASE_URL` (the positively verified TEST value) into the child environment. This is the canonical fix for the WP-004 environment incident.
5. The runner does NOT trust a parent `DATABASE_URL` even if it appears to point to TEST — it MUST use the explicit `TEST_DATABASE_URL` value as the source of truth.
6. A parent `.env` `DATABASE_URL=file:...` SQLite fallback MUST NOT silently redirect the E2E suite — the runner ignores it and uses `TEST_DATABASE_URL` directly.
7. **Frozen rule (parent DATABASE_URL contamination)**: the child application process MUST NOT trust inherited `DATABASE_URL`. Before spawn, the runner removes or overrides inherited `DATABASE_URL`. Then explicitly injects `DATABASE_URL = positively verified TEST_DATABASE_URL`. Guard self-test AC-037 simulates `parent DATABASE_URL=file:...` and verifies: (A) the parent value is NOT used; (B) the application receives TEST; (C) NO mutation occurs before target certification.

### 5.4 Local Base URL Policy

- Default authorized automated target: **loopback only** (`localhost`, `127.0.0.1`, `::1`).
- An arbitrary `BASE_URL` environment variable MUST NOT silently redirect the suite to remote infrastructure.
- The runner accepts `E2E_BASE_URL` only if its hostname is loopback; otherwise it refuses to start.
- Remote base URL requires the explicit remote override (see §5.6) AND must NOT be active by default.

### 5.5 Database Target Identity Verification

The runner positively identifies the database target BEFORE ANY MUTATION (per §16 Mutation Ordering Invariant). The verification is split into TWO phases — a read-only Phase A performed before any mutation, and an optional post-spawn Phase B that uses a SAFE sentinel approach (NOT a write-through-application probe).

#### Phase A — BEFORE ANY APPLICATION OR TEST MUTATION (read-only)

1. **Source of truth**: read `TEST_DATABASE_URL` from `.env.local` via the canonical `parseEnvLocal()` helper (already used by `__tests__/auth-regression.test.ts`, `__tests__/offers-integration.test.ts`, `__tests__/public-offers-integration.test.ts`).
2. **URL type/scheme validation**: validate `TEST_DATABASE_URL` matches the URL type/scheme expected by the current project architecture. Per ADR-0002 + ADR-0006 + S6 TD-019, the canonical database architecture is `Drizzle + neon-http` over a `postgresql://` URL with `sslmode=require`. Reject URLs that are not `postgresql://` (including `file:`, `postgres://` without SSL, `mysql://`, etc.).
3. **Positive TEST fingerprint comparison**: the runner reads `E2E_EXPECTED_TEST_DATABASE_HOST` from the authorized execution environment (`.env.local` for local developer runs, or the explicitly injected process environment for CI runs). **No silent `.env.example` fallback.** A static example file may be stale, copied from another environment, generic, or not representative of the authorized TEST resource — it MUST NOT be the authoritative runtime source for the fingerprint. The runner parses the URL hostname of `TEST_DATABASE_URL` and compares it to the explicit `E2E_EXPECTED_TEST_DATABASE_HOST`. If they do not match → **STOP** with `TEST_FINGERPRINT_MISMATCH` error. If `E2E_EXPECTED_TEST_DATABASE_HOST` is missing from the authorized runtime environment → **STOP** with `MISSING_EXPECTED_TEST_FINGERPRINT` error. Do NOT infer the fingerprint from `TEST_DATABASE_URL` itself — comparing a value to a fingerprint derived from itself would provide no independent target identity evidence. This is the project-specific enforcement of AISE S0 v0.2 §26 — it proves positively that this is the expected TEST target, not merely that it differs from DEV/PROD. (The expected hostname itself is non-secret — it identifies a database resource, not credentials. Do NOT commit database credentials.) `.env.example` MAY document the variable name and its purpose, but MUST NOT be the authoritative runtime source — it documents, it does not authorize.
4. **Read-only connectivity/identity probe**: open a Neon HTTP connection using `@neondatabase/serverless` `neon()` and execute ONLY read-only SQL:
   - `SELECT 1 AS one` (reachability)
   - `SELECT current_database() AS db, current_setting('server_version') AS version` (identity assertion — records actual database name)
   These queries do NOT mutate state. Fail-closed if not reachable.
5. **Refuse-non-TEST guard (necessary but not sufficient for positive identity)**: the runner also reads `DATABASE_URL` (parent env if present), `DEV_DATABASE_URL`, and `PROD_DATABASE_URL` (if any). If any of these resolves to a different host than the verified TEST host, the runner logs the divergence and proceeds ONLY with the explicit `TEST_DATABASE_URL` injection. If the parent `DATABASE_URL` host matches the verified TEST host, that is acceptable (the runner still injects TEST_DATABASE_URL explicitly). If the parent `DATABASE_URL` host matches a DEV or PROD host (or resolves to a SQLite `file:` URL), the runner emits a clear warning but still proceeds with TEST injection. (The refuse-non-TEST semantics apply at the application-process level — the spawned Next.js process receives ONLY `DATABASE_URL=TEST_DATABASE_URL`, never the parent value.)
6. **Construct the child Next.js process environment explicitly**: per §5.3 rule 3-4. The child env is built from a curated allowlist; any inherited `DATABASE_URL` is removed/overridden; `DATABASE_URL=$TEST_DATABASE_URL` is injected explicitly.

Only after Phase A passes may the following mutate TEST:
- fixtures (insert, cleanup)
- bootstrap
- rate-limit cleanup
- test user creation
- offer creation
- browser actions

#### Phase B — Optional SAFE post-spawn target confirmation (read-only via public read path)

If additional post-spawn confirmation is desired, the runner uses a SAFE pattern that NEVER writes through an application whose DB target has not already been certified in Phase A:

1. **After TEST has already been certified in Phase A**, seed a uniquely identifiable PUBLISHED sentinel DIRECTLY into TEST via the runner's TEST-verified Neon SQL connection (NOT through the application). The sentinel uses an `E2E_<run-id>_<scenario>` title marker (per §5.9 Fixture Marker Policy — the marker lives in the `title` business field, NOT in a new schema column and NOT replacing the canonical UUID `id`).
2. **Start the application** with the explicitly constructed TEST environment (from Phase A step 6).
3. **Through the public read path** (`GET /`), verify the application can see that unique sentinel by fetching the root URL and asserting the sentinel title appears in the PUBLISHED offer list.
   - This proves the application is reading the expected TEST state — if the application's DB ≠ TEST, the sentinel would not be visible (because the sentinel only exists in TEST).
4. If the sentinel is NOT visible within the readiness timeout → **STOP** with `APP_DB_DIVERGENCE` error.
5. **Cleanup sentinel from TEST only** (via the runner's TEST-verified Neon SQL connection, by the exact recorded canonical UUID of the sentinel offer).

**This pattern NEVER writes through an application whose DB target has not already been certified.** The sentinel insert happens via direct Neon SQL on the positively-verified TEST connection — it does NOT go through the application Server Action, so it cannot accidentally mutate DEV/PROD even if the application were somehow misconfigured.

#### Unknown target behavior

- If `TEST_DATABASE_URL` is missing → **STOP** with `MISSING_TEST_DATABASE_URL` error.
- If `TEST_DATABASE_URL` URL scheme is not `postgresql://` (e.g., `file:`, `mysql:`, etc.) → **STOP** with `TEST_IS_SQLITE_FALLBACK` (for `file:`) or `TEST_UNSUPPORTED_SCHEME` (for other non-postgresql schemes).
- If `E2E_EXPECTED_TEST_DATABASE_HOST` is missing from the authorized runtime environment → **STOP** with `MISSING_EXPECTED_TEST_FINGERPRINT` error (no `.env.example` fallback, no inference from `TEST_DATABASE_URL`).
- If `TEST_DATABASE_URL` host does NOT match `E2E_EXPECTED_TEST_DATABASE_HOST` → **STOP** with `TEST_FINGERPRINT_MISMATCH` error.
- If `TEST_DATABASE_URL` is set but unreachable → **STOP** with `TEST_DB_UNREACHABLE` error.
- If `TEST_DATABASE_URL` host matches the DEV host → **STOP** with `TEST_EQUALS_DEV` error.
- If `TEST_DATABASE_URL` host matches the PROD host → **STOP** with `TEST_EQUALS_PROD` error.
- If the post-spawn Phase B sentinel is not visible → **STOP** with `APP_DB_DIVERGENCE` error.

**Rule (AISE S0 v0.2 §26):**
> UNKNOWN TARGET → STOP / INVESTIGATE
> NEVER: UNKNOWN TARGET → RUN ANYWAY

**Rule (WP-005 Mutation Ordering Invariant — see §16):**
> NO STATE MUTATION BEFORE TARGET CERTIFICATION.
> The previous proposal to "insert a probe fixture via the running app's Server Action, then verify via direct Neon SQL that the row landed in TEST" is REMOVED — that approach would have mutated an uncertified target before detecting divergence, violating FAIL CLOSED and VERIFY TARGET BEFORE MUTATION.

### 5.6 Remote Base URL Override (Opt-In Only)

By default, remote E2E is **FORBIDDEN / REFUSED** (per AISE S0 v0.2 §26).

The contract defines the override semantics so that the infrastructure can support future OWNER-authorized remote runs WITHOUT enabling them by default:

- The override requires THREE environment variables simultaneously:
  1. `E2E_ALLOW_REMOTE=1` (explicit opt-in flag).
  2. `E2E_REMOTE_BASE_URL=https://...` (the explicit target URL).
  3. `E2E_REMOTE_AUTHORIZATION_REF` (a NON-SECRET reference to a documented OWNER authorization record stored outside the repo — e.g., a work-item ID, a signed-authorization document path, or an AISE R-form reference. This is NOT an access token, NOT a credential, NOT an API secret. It is evidence/reference that OWNER has authorized this specific remote run.)
- All three must be set; the runner refuses if only one or two are set.
- The runner does NOT validate the contents of `E2E_REMOTE_AUTHORIZATION_REF` — it only verifies the variable is present and non-empty. The OWNER authorization record itself lives outside the repo (per AISE §25 external parameter gate). The variable is the traceability link to that record.
- The override logs the target, environment class, cost/quota class, purpose, and expected request volume in the E2E report (including the `E2E_REMOTE_AUTHORIZATION_REF` value for traceability).
- No remote execution is authorized during WP-005 S10 unless OWNER separately approves it. This contract defines the SEMANTICS only; it does NOT enable the override.

**Protected remote targets (refused even with override unless additional OWNER authorization is provided):**

- Vercel Preview deployments
- Vercel Production deployments
- Other hosted URLs that resolve to non-loopback addresses

This is intentionally provider-neutral: the runner protects against ANY remote base URL, not just Vercel.

#### Guard self-test semantics (NO external network request)

WP-005 S10 must implement and test the remote-override guard semantics ONLY. The guard self-test verifies that:

- A non-loopback `E2E_BASE_URL` without the override set → REFUSED with `REMOTE_BASE_URL_NOT_AUTHORIZED`.
- A non-loopback `E2E_BASE_URL` with only `E2E_ALLOW_REMOTE=1` (missing `E2E_REMOTE_BASE_URL` and `E2E_REMOTE_AUTHORIZATION_REF`) → REFUSED.
- A non-loopback `E2E_BASE_URL` with `E2E_ALLOW_REMOTE=1` + `E2E_REMOTE_BASE_URL` but missing `E2E_REMOTE_AUTHORIZATION_REF` → REFUSED.
- A non-loopback `E2E_BASE_URL` with all three override variables → ACCEPTED by the guard (the override semantics allow it; whether to actually execute the remote run is a separate OWNER authorization question, NOT exercised by S10).

The guard self-test does NOT make any external network request. It verifies the guard's REFUSE/ACCEPT decision logic by mocking the runner's base-URL validator and asserting the decision. No Vercel, no Preview, no Production network call is performed by any guard test.

### 5.7 E2E Framework Selection

- **Playwright** is the canonical approved choice per ADR-0008 and TD-024.
- Do NOT introduce Cypress or Selenium. Do NOT install multiple browser frameworks.
- Do NOT install browser drivers globally; Playwright manages its own browser binaries.
- Chromium is the only browser engine installed (per §5.1). The minimum browser installation command is `pnpm playwright install chromium` (NOT `pnpm playwright install` which would install all engines).

### 5.8 Test Fixture Strategy

- Fixtures are created ONLY on TEST (positively verified per §5.5 Phase A — NO fixture insert before Phase A passes).
- Cleanup runs ONLY on TEST (also gated by Phase A — NO cleanup before Phase A passes).
- **Fixture marking policy**: do NOT replace canonical UUID `id` values with arbitrary prefixed identifiers. The `offers.id` column remains a canonical UUID (per ADR-0009). The test marker is stored in an existing business field — specifically, the `title` field, with a unique prefix `E2E_<run-id>_<scenario>` (e.g., `E2E_20260916T120000_a1b2c3_admin-critical-journey`). No new schema column is added solely for E2E. The marker is a contract-safe existing-field reuse.
- The runner tracks every created fixture's canonical UUID in a `createdFixtureIds` registry (the actual `offers.id` UUID, not the title marker).
- **Normal cleanup**: delete exact recorded UUIDs created by that run (by `id`), NOT by title prefix. The title marker is for orphan recovery only — not for normal cleanup.
- **Orphan recovery cleanup**: find TEST `offers` records whose `title` starts with the E2E marker prefix (`E2E_`), collect their canonical UUIDs, then delete those exact UUIDs. No broad unrestricted `DELETE FROM offers WHERE title LIKE 'E2E-%'` without an explicit UUID list — always delete by `id` after collecting the UUIDs.
- Safe reruns after failure: each fixture has a unique `title` marker per run (includes timestamp + random hex + scenario), so a failed run leaves orphan fixtures that the next run's pre-flight cleanup can detect by title prefix and remove by canonical UUID.
- The contract prefers **direct DB helpers** (via Neon SQL tagged templates, same pattern as `__tests__/offers-integration.test.ts`) for fixture setup, NOT application actions. Rationale: direct DB helpers are deterministic, do not depend on the UI being in a specific state, and do not generate rate-limit traffic. Application actions are reserved for the E2E journey itself (which is what we are testing).
- No public test-only API endpoints. No new application routes added for testing.
- The fixture helper lives at `tests/e2e/helpers/fixtures.ts` and exposes:
  - `createTestOffer(overrides)` — inserts a row in `offers` with a canonical UUID `id`, a `title` containing the E2E marker prefix (e.g., `E2E_<run-id>_<scenario>`), and the supplied overrides. Returns the row (including the canonical UUID `id`).
  - `deleteTestOffer(id)` — deletes by canonical UUID `id` (NOT by title).
  - `cleanupOrphanFixtures(markerPrefix)` — queries `SELECT id FROM offers WHERE title LIKE '<markerPrefix>%'`, collects the canonical UUIDs, then deletes each by `id`. Used in pre-flight orphan recovery.
  - `clearTestRateLimit()` — `DELETE FROM "rateLimit"` (scoped to TEST only — the helper positively verifies TEST in Phase A before executing; per §5.10 ordering, this MUST happen AFTER Phase A passes, NEVER before).

### 5.9 Test Isolation

- Each E2E spec creates its own fixtures in `beforeAll` and cleans them up in `afterAll`.
- Tests within a single spec MAY share a fixture ONLY if they represent one continuous user journey (e.g., the 15-step critical journey uses ONE offer across all 15 steps).
- Tests across specs MUST NOT depend on each other's state.
- No "test 5 assumes test 4 published the offer" pattern unless the entire spec is intentionally one journey.
- The runner resets relevant TEST state (rate limit, orphan fixtures with `E2E_` title marker) before each spec via `beforeAll` in a shared setup helper — but ONLY AFTER Phase A target verification has passed (per §5.10 ordering invariant and §16 Mutation Ordering Invariant).

### 5.10 Rate Limit Handling

- Better Auth's database-backed rate limiter persists counts across test runs (verified during WP-002). E2E must handle this safely.
- **Ordering invariant**: VERIFY TEST TARGET FIRST (Phase A), THEN cleanup TEST `rateLimit`. NEVER: cleanup THEN verify target. Any cleanup counts as a TEST mutation, so per §16 it MUST happen after target certification.
- The E2E setup helper clears the TEST `rateLimit` table BEFORE each spec that performs login, using the same pattern as `__tests__/auth-regression.test.ts` `beforeEach`:
  ```ts
  await rawSql`DELETE FROM "rateLimit"`;
  ```
- This targets TEST only (the helper positively verifies TEST in Phase A before executing — see §5.5).
- NEVER clear the DEV `rateLimit` during E2E.
- NEVER disable security globally (do NOT set `rateLimit.enabled = false` in `auth.ts`).
- Each login uses the canonical sleep pattern (1000ms between admin logins, 500ms between mixed logins) — same as `__tests__/auth-regression.test.ts`.
- The default Better Auth rate-limit rule for `/sign-in/*` is 3 requests per 10 seconds; the suite accommodates this with sleeps + rate-limit clearing.

### 5.11 Auth Test Identities

- ADMIN identity: the bootstrapped `admin1` user (credentials from `.env.local`: `INITIAL_ADMIN_LOGIN`, `INITIAL_ADMIN_PASSWORD`).
- FANTOMAS identity: the bootstrapped `fantomas` user (credentials from `.env.local`: `FANTOMAS_INITIAL_PASSWORD`, `FANTOMAS_EMAIL`).
- **Deterministic TEST identity preparation**: WP-005 MUST NOT make E2E reproducibility depend on historical TEST state. The runner uses the existing canonical bootstrap mechanism (`pnpm db:bootstrap` → `db/bootstrap/bootstrap.ts`) deterministically, scoped to verified TEST only. Conceptual sequence:
  1. VERIFY TEST TARGET (Phase A — §5.5).
  2. Inject `DATABASE_URL=TEST_DATABASE_URL` into the bootstrap process environment (NO inherited parent `DATABASE_URL`).
  3. Run the existing TEST-safe bootstrap/ensure step (`pnpm db:bootstrap` with `DATABASE_URL=TEST_DATABASE_URL`). The bootstrap is idempotent (verified at WP-002 closure): if `admin1` and `fantomas` already exist, it does NOT overwrite their credentials or `principalType`; it only creates them if missing.
  4. Verify the ADMIN identity exists in TEST (direct read-only SQL: `SELECT id, username, principal_type FROM "user" WHERE username = 'admin1'`).
  5. Verify the FANTOMAS identity exists in TEST (direct read-only SQL: `SELECT id, username, principal_type FROM "user" WHERE username = 'fantomas'`).
  6. If both identities exist (either pre-existing or just bootstrapped), proceed to E2E execution.
  7. If existing bootstrap CANNOT safely satisfy this requirement (e.g., it requires schema changes, or it cannot be scoped to TEST deterministically), S10 MUST STOP and report `E2E_TEST_IDENTITY_PREPARATION_GAP`.
- Do NOT bootstrap DEV.
- Do NOT bootstrap Production.
- Do NOT introduce a second authentication implementation. Better Auth remains the identity/session authority.
- No Production credentials. No DEV credentials. No secret values committed to Git.
- The `principalType` / `can()` model remains canonical (per ADR-0004, AISE §21).
- The E2E suite logs in via the real `/admin/login` UI (Better Auth client API), NOT via direct session creation. This exercises the real auth boundary.
- The FANTOMAS test verifies that FANTOMAS inherits all ADMIN capabilities AND has Fantomas-only capabilities (e.g., `system:bootstrap`) — same as `__tests__/authorization.test.ts` but through the real UI.

### 5.12 Public E2E Journeys

| Spec | Steps |
|---|---|
| `tests/e2e/public-root.spec.ts` | anonymous visit to `/`; PUBLISHED offers visible; empty state when no PUBLISHED; cards show title + company (if present) + location (if present) + contract_type (if present) + published_at + "Voir l'offre" link |
| `tests/e2e/public-detail.spec.ts` | click "Voir l'offre" → detail page renders all PUBLISHED fields; Tiptap content preserved; "Entreprise non communiquée" when company absent; no Apply button; source block visible when source_name/source_url present |
| `tests/e2e/public-search.spec.ts` | search via `?q=` matches title; matches company; matches location; empty search returns full list; search never returns hidden offers |
| `tests/e2e/public-pagination.spec.ts` | page 1 / page 2 navigation; deterministic ordering preserved |
| `tests/e2e/public-not-found.spec.ts` | direct URL to hidden (DRAFT/SUSPENDED/ARCHIVED) → 404; nonexistent UUID → 404; malformed UUID → 404 (no DB query) |
| `tests/e2e/public-seo.spec.ts` | `/sitemap.xml` reachable + lists PUBLISHED offers; `/robots.txt` reachable + disallows `/admin/*`; per-page metadata present (title, description) |
| `tests/e2e/public-tiptap-safety.spec.ts` | Tiptap content with `javascript:`, `data:`, `vbscript:`, `file:` href → link text preserved, NOT clickable; `http://`, `https://`, `mailto:` links clickable |
| `tests/e2e/public-url-safety.spec.ts` | offer with unsafe `application_url` or `source_url` stored in TEST (via fixture) → link omitted on detail page; safe `http://`/`https://` → link present and clickable |

### 5.13 Admin E2E Journey (Critical 15-step per S6 §18.4)

`tests/e2e/admin-critical-journey.spec.ts` — ONE spec, ONE offer across 15 steps:

1. ADMIN navigates to `/admin/login`, enters credentials, submits → redirected to `/admin/offres`
2. ADMIN clicks "Nouvelle offre", fills title + description + 1-2 optional fields, saves → offer appears in admin list as DRAFT
3. ADMIN edits the offer, modifies description, saves → updated content visible in edit form
4. ADMIN clicks "Publier" → status becomes PUBLISHED, `published_at` is set
5. PUBLIC visits `/` → offer appears in list as a card
6. PUBLIC clicks "Voir l'offre" → detail page shows all entered fields, formatting preserved
7. PUBLIC verifies no "Apply" button, no share, no logo
8. ADMIN clicks "Suspendre" → status becomes SUSPENDED
9. PUBLIC visits `/` → offer no longer in list. Public direct URL → 404
10. ADMIN clicks "Republier" → status becomes PUBLISHED, `published_at` preserved
11. PUBLIC visits `/` → offer visible again
12. ADMIN clicks "Archiver" → status becomes ARCHIVED (terminal)
13. PUBLIC visits `/` → offer not visible. Direct URL → 404
14. ADMIN visits admin list → archived offer still visible with status ARCHIVED, content preserved
15. ADMIN clicks "Logout" → redirected to `/admin/login`

### 5.14 Security E2E Journeys

| Spec | Steps |
|---|---|
| `tests/e2e/security-admin-route-guard.spec.ts` | unauthenticated visit to `/admin/offres` → redirected to `/admin/login`; unauthenticated POST to admin Server Action → rejected |
| `tests/e2e/security-hidden-offer.spec.ts` | DRAFT/SUSPENDED/ARCHIVED offer IDs (stored via fixture) → public list does NOT contain them; public detail → 404 (no status leak) |
| `tests/e2e/security-tiptap-href.spec.ts` | Tiptap content with `javascript:alert(1)` href → link text present, NO clickable anchor; `https://example.com` → clickable |
| `tests/e2e/security-unsafe-url.spec.ts` | offer with `application_url="javascript:evil()"` stored via fixture → no clickable link on detail; offer with `application_url="http://safe.example"` → clickable |
| `tests/e2e/security-logout-invalidates.spec.ts` | ADMIN login → access `/admin/offres` (200) → click Logout → revisit `/admin/offres` → redirected to `/admin/login` (session invalidated) |

### 5.15 FANTOMAS E2E Journey

`tests/e2e/fantomas-journey.spec.ts`:
1. FANTOMAS logs in via `/admin/login` with mixed-case input `"Fantomas"` → succeeds (Username plugin normalizes to `fantomas`)
2. FANTOMAS accesses `/admin/offres` → authorized (inherits ADMIN capabilities)
3. FANTOMAS creates an offer → authorized (offer:create)
4. FANTOMAS edits the offer → authorized (offer:update)
5. FANTOMAS publishes the offer → authorized (offer:publish)
6. FANTOMAS suspends, republishes, archives → all authorized (inherits ADMIN capabilities)

Do NOT expand FANTOMAS scope beyond currently implemented behavior (AISE §21: FANTOMAS = ADMIN capabilities + Fantomas-only).

### 5.16 Accessibility E2E (NFR-030)

`tests/e2e/accessibility.spec.ts`:
- axe-core scan (via `@axe-core/playwright` or equivalent) on public pages (`/`, `/offres/{id}`) and admin pages (`/admin/login`, `/admin/offres`).
- Keyboard navigation test: tab through public list → focus indicators visible; tab through admin login form → focus order logical.
- Acceptance: no critical axe violations (warnings acceptable; critical violations are blockers).

### 5.17 Responsive E2E

`tests/e2e/responsive.spec.ts`:
- Public pages render correctly on mobile viewport (e.g., 375x667 — iPhone SE).
- No horizontal scroll, no overlapping elements, no clipped content.
- Admin pages: desktop-only by default (admin UI is not optimized for mobile per V1 scope).

### 5.18 Local Developer Commands

| Script | Purpose |
|---|---|
| `pnpm test:e2e` | Run the full E2E suite (build + spawn + run + shutdown + cleanup). Default: local Next.js + TEST DB + Chromium. |
| `pnpm test:e2e:ui` | Run E2E in Playwright UI mode (interactive debug, watch mode). |
| `pnpm test:e2e:headed` | Run E2E in headed mode (visible browser window). |
| `pnpm test:e2e:debug` | Run E2E with Playwright debug (`DEBUG=pw:*`). |

The existing `pnpm test` (Vitest unit + integration) is UNCHANGED and does NOT run E2E. The separation prevents accidental browser E2E from running as part of every fast local unit test cycle.

### 5.19 Failure Artifacts

- **Screenshot**: on test failure only. Saved to `tests/e2e/.artifacts/screenshots/`.
- **Trace**: on first retry only (if retries > 0). Saved to `tests/e2e/.artifacts/traces/`.
- **Video**: OFF by default. Opt-in via `E2E_VIDEO=1` for specific debugging sessions.
- **No artifacts on success** — this is test infrastructure, not observability infrastructure.
- The `.artifacts/` directory is in `.gitignore` (added by S10).
- The runner cleans `.artifacts/` at the start of each run (deterministic state).

### 5.20 Test Reporting

Each E2E run produces:
- **Console summary**: scenario name, PASS/FAIL, duration, app target (localhost:PORT), DB target (TEST host + database name), browser (Chromium), mutation target (TEST only).
- **JSON report**: `tests/e2e/.artifacts/report.json` (machine-readable).
- **HTML report** (opt-in): `tests/e2e/.artifacts/report.html` for human review.
- **Quota-safety evidence block**: app runtime class (LOCAL), DB target class (CONTROLLED_TEST), remote E2E flag (NO by default), production mutation (NO), DEV mutation (NO), TEST mutation (YES — fixtures).

### 5.21 Quality Gates

The existing quality gates are PRESERVED:
- `pnpm lint` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` (Vitest, 149 tests) — PASS, unchanged
- `pnpm build` — PASS

The NEW E2E gate is SEPARATE:
- `pnpm test:e2e` — PASS (the new gate added by WP-005)

S11 for WP-005 must run BOTH gates (Vitest + E2E) and confirm both pass. Existing 149 tests MUST still pass — E2E is additive, not a replacement.

---

## 6. Out of Scope

### MS-006 / WP-006
- Vercel project configuration
- Neon Production/Preview environment configuration
- GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- Environment variables for Production / Preview
- Migration execution against Production or Preview
- Bootstrap execution against Production or Preview
- Branch deployment mappings
- Preview deployment automation
- Production domain configuration

### CI E2E Pipeline
- The CI workflow itself is MS-006 scope per S8 §7 (Environments + CI/CD) and S6 TD-025.
- WP-005 produces E2E specs that the MS-006 CI pipeline will eventually consume.
- WP-005 does NOT create `.github/workflows/`, does NOT add CI trigger configuration, does NOT configure CI secrets, does NOT configure CI test-database provisioning.
- The contract documents how MS-006 SHOULD wire E2E into CI (see §7 Future CI Integration Guide), but does NOT implement it.

### Vercel
- VERCEL IS NOT THE WP-005 TEST TARGET.
- Do NOT configure it. Do NOT deploy. Do NOT run automated tests against it. Do NOT set Preview URLs. Do NOT create Vercel-specific E2E behavior.

### Performance / Load / Stress Testing
- No load testing. No stress testing. No performance benchmarking. No synthetic monitoring. No uptime probes.
- V1 has no quantitative performance SLO (Charter §13). NFR-001 is a SHOULD, not a MUST with a quantitative target.
- Per S0 §23 (zero scheduled work): no automated monitoring, no cron, no background alerting.

### Remote E2E by Default
- Remote automated E2E is FORBIDDEN / REFUSED by default (AISE S0 v0.2 §26).
- The contract defines the override semantics (§5.6) but does NOT enable it.
- No OWNER authorization for remote E2E is granted by this S9 operation.

### Application Code Changes
- Expected application feature changes: NONE.
- WP-005 is test infrastructure. Do NOT redesign admin UI, public UI, auth, offer lifecycle, database schema, or any business feature.
- If E2E reveals a real product defect during S10/S11: REPORT IT. Do NOT silently fix product code under infrastructure scope unless OWNER authorizes remediation.
- Minimal testability hooks may only be considered if they do NOT create production-only test backdoors and AISE explicitly permits them. Prefer exercising actual UI semantics (roles, labels, text, URLs) over adding production code solely for tests.

### Database Schema / Migrations
- DB SCHEMA CHANGE: NO.
- MIGRATION: NO.
- If E2E infrastructure appears to require schema changes: STOP. That is a contract gap — report and request OWNER authorization.

### New Business Features
- All features from MS-003/004 are CLOSED. WP-005 adds test infrastructure only.

### data-testid Policy
- Do NOT blanket-add `data-testid` everywhere.
- Prefer accessible selectors: role, label, name, text.
- Add stable `data-testid` ONLY where the UI lacks a reliable semantic selector AND the contract explicitly permits it.
- The contract does NOT pre-authorize any data-testid additions. Any S10 addition requires explicit justification in the S10 worklog.

### S12 Release Process
- S12 remains global release-readiness. WP-005 does NOT close the project.
- Do NOT start S12.

### Other
- Multilingual, multi-tenant — EXCLUDED (NFR-040: French only).
- Public API — EXCLUDED (INT-001).
- Mobile app — EXCLUDED.
- AI matching — EXCLUDED.

---

## 7. Future CI Integration Guide (Reference Only — NOT Implemented in WP-005)

This section documents how the MS-006 CI pipeline SHOULD consume the WP-005 E2E infrastructure. It is reference material for MS-006; WP-005 does NOT implement any of this.

**Architecture (per S6 TD-025, S8 MS-006 IN SCOPE):**

```
GitHub Actions CI runner
  → checkout repository
  → install pnpm dependencies
  → provision a dedicated CI test database that is COMPATIBLE with the canonical database architecture and driver (Drizzle + neon-http). A Neon-compatible TEST/CI resource is the current natural option. Any alternate PostgreSQL runtime (e.g., a generic CI service-container PostgreSQL) requires explicit technical compatibility validation during MS-006 — the neon-http driver may not work against arbitrary PostgreSQL instances. Do NOT prescribe a generic PostgreSQL service container at WP-005 without compatibility proof.
  → run `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest unit + integration + component), `pnpm build`
  → run `pnpm test:e2e` against the local Next.js server spawned inside the runner, pointing at the dedicated CI test database (compatible with Drizzle + neon-http; selected during MS-006)
  → local Chromium (Playwright-managed) executes the E2E specs
  → no remote deployed application is the test target
```

**Trigger policy (per S6 TD-025, S8 MS-006):**
- On every PR: lint + typecheck + Vitest + build.
- On push to `main`: lint + typecheck + Vitest + build + E2E.
- On PR with label `run-e2e`: lint + typecheck + Vitest + build + E2E (opt-in cost control).

**MS-006 database decision (per owner §12):**
- MS-006 must select a dedicated CI TEST database/runtime compatible with the canonical database architecture and driver. A Neon-compatible TEST/CI resource is the current natural option.
- Any alternate PostgreSQL runtime (e.g., a generic CI service-container PostgreSQL) requires explicit technical compatibility validation during MS-006 — the `neon-http` driver may not work against arbitrary PostgreSQL instances, and the `Drizzle` ORM configuration may also differ.
- WP-005 does NOT prescribe a generic PostgreSQL service container for MS-006. The MS-006 database/runtime selection is deferred to MS-006 boundary.

**CI secrets (per S6 §13, ADR-0006):**
- `TEST_DATABASE_URL` supplied as a CI secret — NEVER committed, NEVER derived from Production credentials, NEVER using `DEV_DATABASE_URL` as fallback.
- Missing `TEST_DATABASE_URL` in CI → FAIL CLOSED (the runner refuses to start).

**Quota-safety in CI:**
- The CI runner is REMOTE infrastructure (GitHub Actions), but the APPLICATION UNDER TEST is LOCAL (Next.js spawned inside the runner). This distinction is critical: per AISE S0 §26, the cost/quota class is determined by where the application runs, not where the test runner lives.
- CI E2E against a local Next.js inside the runner is `LOCAL_UNMETERED` for the application runtime; the only `REMOTE_METERED` resource is the CI test database (Neon preview branch) — which is ephemeral and auto-cleaned.

**WP-005 does NOT implement any of this.** This section exists to ensure the E2E infrastructure produced by WP-005 is compatible with the future MS-006 CI pipeline without retrofitting.

---

## 8. Intended Behavior

### 8.1 E2E Runner Pre-Flight (Fail-Closed)

```
=== PHASE A — TARGET VERIFICATION (NO MUTATION) ===
1. Parse .env.local via canonical parseEnvLocal() helper
2. Read TEST_DATABASE_URL
3. If TEST_DATABASE_URL missing → STOP: MISSING_TEST_DATABASE_URL
4. URL type/scheme validation:
   - If TEST_DATABASE_URL scheme is not "postgresql://" → STOP: TEST_UNSUPPORTED_SCHEME
   - If TEST_DATABASE_URL starts with "file:" → STOP: TEST_IS_SQLITE_FALLBACK
5. Parse URL hostname of TEST_DATABASE_URL → record as testHost
6. Read E2E_EXPECTED_TEST_DATABASE_HOST from the authorized execution environment (NOT from .env.example — no silent fallback)
   - If E2E_EXPECTED_TEST_DATABASE_HOST missing → STOP: MISSING_EXPECTED_TEST_FINGERPRINT
   - If hostname(TEST_DATABASE_URL) != E2E_EXPECTED_TEST_DATABASE_HOST → STOP: TEST_FINGERPRINT_MISMATCH
   - Do NOT infer fingerprint from TEST_DATABASE_URL itself
7. If DEV_DATABASE_URL present and its hostname == testHost → STOP: TEST_EQUALS_DEV
8. If PROD_DATABASE_URL present and its hostname == testHost → STOP: TEST_EQUALS_PROD
9. Read-only connectivity probe: SELECT 1 AS one on TEST_DATABASE_URL → if fail, STOP: TEST_DB_UNREACHABLE
10. Read-only identity probe: SELECT current_database() AS db, current_setting('server_version') AS version → record as testDbName
11. Base URL policy check:
    - Read E2E_BASE_URL (default: http://127.0.0.1:3000)
    - Parse E2E_BASE_URL hostname; if not loopback (127.0.0.1, localhost, ::1):
      a. If E2E_ALLOW_REMOTE=1 AND E2E_REMOTE_BASE_URL set AND E2E_REMOTE_AUTHORIZATION_REF set:
         → continue with explicit remote override (log target, class, purpose, expected volume, authorization ref)
      b. Else: STOP: REMOTE_BASE_URL_NOT_AUTHORIZED

=== PHASE A PASSED — TARGET CERTIFIED. NOW MUTATIONS ARE ALLOWED ===

12. Orphan recovery cleanup (TEST only, by exact canonical UUID):
    - Query: SELECT id FROM offers WHERE title LIKE 'E2E_%'
    - For each UUID: DELETE FROM offers WHERE id = <uuid>
13. TEST rateLimit cleanup (TEST only): DELETE FROM "rateLimit"
14. Deterministic TEST identity preparation (per §5.11):
    - Inject DATABASE_URL=TEST_DATABASE_URL into the bootstrap process environment (NO inherited parent DATABASE_URL)
    - Run pnpm db:bootstrap (idempotent — creates admin1/fantomas only if missing; does NOT overwrite existing)
    - Verify admin1 exists: SELECT id FROM "user" WHERE username = 'admin1' → if missing, STOP: E2E_TEST_IDENTITY_PREPARATION_GAP
    - Verify fantomas exists: SELECT id FROM "user" WHERE username = 'fantomas' → if missing, STOP: E2E_TEST_IDENTITY_PREPARATION_GAP
15. Construct the child Next.js process environment EXPLICITLY (curated allowlist):
    - Remove/override any inherited DATABASE_URL
    - Inject DATABASE_URL=TEST_DATABASE_URL (the positively verified TEST value)
    - Inject other required env vars: BETTER_AUTH_SECRET, BETTER_AUTH_URL, INITIAL_ADMIN_LOGIN, INITIAL_ADMIN_PASSWORD, FANTOMAS_INITIAL_PASSWORD, FANTOMAS_EMAIL, INITIAL_ADMIN_EMAIL, NEXT_PUBLIC_SITE_URL
16. Build Next.js: pnpm build (skip if fresh build artifact exists)
17. Spawn Next.js: next start --port <PORT> with the explicitly constructed env (NO inherited parent DATABASE_URL)
18. Readiness probe: poll http://127.0.0.1:<PORT>/ until 200 or timeout (30s)

=== PHASE B — OPTIONAL SAFE POST-SPAWN TARGET CONFIRMATION (read-only via public read path) ===
19. Seed a uniquely identifiable PUBLISHED sentinel DIRECTLY into TEST via the runner's TEST-verified Neon SQL connection (NOT through the application):
    - title = "E2E_SENTINEL_<run-id>"
    - status = 'PUBLISHED'
    - Record the sentinel's canonical UUID
20. Through the public read path (GET /), verify the application can see that sentinel:
    - Fetch http://127.0.0.1:<PORT>/
    - Assert the sentinel title appears in the PUBLISHED offer list
    - If sentinel NOT visible within readiness timeout → STOP: APP_DB_DIVERGENCE
    - (This proves the application is reading the expected TEST state — if the application's DB ≠ TEST, the sentinel would not be visible.)
21. Cleanup the sentinel from TEST only (by the exact recorded canonical UUID)

=== E2E EXECUTION ===
22. Run Playwright E2E suite (each spec creates its own fixtures with E2E_<run-id>_<scenario> title marker; normal cleanup by exact canonical UUID)
23. Shutdown Next.js (SIGTERM)
24. Post-run cleanup: delete all recorded fixture UUIDs (by id); orphan recovery by title prefix 'E2E_'; DELETE FROM "rateLimit" (TEST only)
25. Emit report with quota-safety evidence block
```

**Critical ordering invariants:**
- Steps 1-11 (Phase A) are READ-ONLY — NO mutation of any target.
- Step 12+ (orphan cleanup, rateLimit cleanup, bootstrap, fixture insert, browser actions) MAY mutate TEST ONLY AFTER Phase A passes.
- Step 19 sentinel insert uses the runner's TEST-verified Neon SQL connection — it NEVER goes through the application Server Action.
- A parent `.env` `DATABASE_URL=file:...` SQLite fallback is NEUTRALIZED at step 15 (removed from the child env); step 17 spawns with the explicit TEST injection only.

### 8.2 Critical Journey Flow (15 steps, single offer, single spec)

Per S6 §18.4 — the runner follows the exact 15-step critical journey defined in the technical specification. The spec creates ONE fixture offer (with `status='DRAFT'` via direct DB helper), then drives the admin UI through the lifecycle transitions, interleaving public-page checks at the prescribed steps.

### 8.3 Quota-Safety Evidence Block (per AISE S0 v0.2 §26)

Each E2E run emits the following block in the report:

```
QUOTA-SAFETY EVIDENCE:
  APPLICATION RUNTIME:    LOCAL (Next.js on 127.0.0.1:<PORT>)
  DATABASE / STATE:       TEST (host=<testHost>, db=<testDbName>)
  REMOTE E2E:             NO (default) | YES (with explicit override + authorization)
  VERCEL:                 NO (never in WP-005)
  LOAD TEST:              NO
  POLLING:                NO
  PRODUCTION:             NOT TOUCHED
  DEV MUTATED:            NO
  TEST MUTATED:           YES (fixtures with E2E_ title marker; rateLimit cleared in TEST only)
```

---

## 9. Protected Surfaces

WP-005 must NOT modify the following protected surfaces. If genuine modification becomes necessary during S10: STOP, REPORT, REQUEST OWNER AUTHORIZATION.

| Protected Surface | Reason |
|---|---|
| Business feature code (app/*, components/*, lib/*) | Test infrastructure only — no product changes |
| Database schema (db/schema.ts, db/migrations/*) | No migration; no schema change |
| Better Auth foundation (lib/server/auth/*) | Auth is the session authority — unchanged |
| principalType model (lib/server/auth/capabilities.ts) | AISE §21 — unchanged |
| Offer lifecycle semantics (lifecycle transitions, published_at preservation) | Verified by E2E, NOT modified by E2E |
| AISE governance (docs/engineering/*) | S0 v0.2 §26 active — unchanged |
| Vercel configuration | MS-006 scope — NOT configured in WP-005 |
| Existing 149-test Vitest suite | Preserved as-is; E2E is additive |
| Existing `package.json` scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:*`) | Preserved; new `test:e2e*` scripts added |

---

## 10. Dependencies

**Required new devDependencies (S10 will install — NOT installed during S9):**

| Package | Purpose |
|---|---|
| `@playwright/test` | Playwright E2E framework (per ADR-0008, TD-024 Layer 4) |
| `@axe-core/playwright` | axe-core accessibility scan in E2E (per NFR-030) |

**Browser binary:**

- Chromium only (NOT Firefox, NOT WebKit).
- Install via `pnpm playwright install chromium` (NOT `pnpm playwright install` — the latter installs all engines and consumes more disk + bandwidth).

**No other test libraries.** Do NOT add Cypress, Selenium, WebdriverIO, TestCafe, or any other E2E framework. Do NOT add additional Vitest plugins (Vitest is already installed and configured).

**Existing devDependencies preserved:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`, `tsx`, `typescript`, `eslint`, `prettier`, `tailwindcss`, `autoprefixer`, `postcss`, `drizzle-kit`, `@types/*`.

**Existing dependencies preserved:** all runtime dependencies (`next`, `react`, `react-dom`, `better-auth`, `drizzle-orm`, `@neondatabase/serverless`, `@tiptap/*`, `@radix-ui/*`, `zod`, etc.) — UNCHANGED.

---

## 11. Database Schema / Migration Impact

- DB SCHEMA CHANGE: NO
- MIGRATION: NO
- The E2E infrastructure reads/writes the existing schema only. No new tables, no new columns, no new indexes.
- The `offers`, `user`, `session`, `account`, `verification`, `rateLimit` tables are used as-is.

---

## 12. Application Code Impact

- APPLICATION FEATURE CHANGES: NONE
- The application code (`app/*`, `components/*`, `lib/*`) is UNCHANGED.
- No new routes. No new Server Actions. No new API endpoints. No new components.
- No data-testid additions are pre-authorized. Any S10 addition requires explicit justification.
- The E2E runner interacts with the application ONLY through:
  - The real browser (Playwright) hitting real pages
  - Direct DB helpers (Neon SQL) for fixture setup/cleanup (NOT application routes)

---

## 13. Acceptance Criteria

The following numbered acceptance criteria MUST all be met for S11 to PASS. They are objective and verifiable.

### Infrastructure & Framework

| AC ID | Criterion |
|---|---|
| AC-001 | `@playwright/test` is in `devDependencies` in `package.json` |
| AC-002 | `playwright.config.ts` exists at project root with single browser (Chromium), single worker, 0 retries default, screenshot on failure, trace on first retry, video off |
| AC-003 | Chromium browser binary is installed via `pnpm playwright install chromium` |
| AC-004 | `tests/e2e/` directory exists with helpers, fixtures, and spec files per §5.12-5.17 |
| AC-005 | `pnpm test:e2e` script exists and runs the full E2E suite (build + spawn + run + shutdown + cleanup) |
| AC-006 | `pnpm test:e2e:ui`, `pnpm test:e2e:headed`, `pnpm test:e2e:debug` scripts exist |
| AC-007 | `.gitignore` includes `tests/e2e/.artifacts/` and `playwright-report/` |
| AC-008 | `@axe-core/playwright` is in `devDependencies` (for accessibility E2E) |

### Environment Target & Fail-Closed Guards

| AC ID | Criterion |
|---|---|
| AC-010 | E2E runner reads `TEST_DATABASE_URL` from `.env.local`, performs Phase A target verification (read-only), and injects `DATABASE_URL=$TEST_DATABASE_URL` into the spawned Next.js process — the child environment is built from a curated allowlist; any inherited parent `DATABASE_URL` is removed/overridden |
| AC-011 | Runner refuses to start if `TEST_DATABASE_URL` is missing (error: `MISSING_TEST_DATABASE_URL`) |
| AC-012 | Runner refuses to start if `TEST_DATABASE_URL` URL scheme is not `postgresql://` — specifically `file:` (error: `TEST_IS_SQLITE_FALLBACK`) or any other non-postgresql scheme (error: `TEST_UNSUPPORTED_SCHEME`) |
| AC-012a | Runner performs positive TEST fingerprint comparison: hostname(`TEST_DATABASE_URL`) MUST equal `E2E_EXPECTED_TEST_DATABASE_HOST` (error: `TEST_FINGERPRINT_MISMATCH` if not). The expected hostname is read explicitly from the authorized runtime environment (`.env.local` for local developer runs, or explicitly injected process env for CI). No `.env.example` fallback — a static example file may be stale, copied from another environment, generic, or not representative of the authorized TEST resource. If `E2E_EXPECTED_TEST_DATABASE_HOST` is missing → STOP with `MISSING_EXPECTED_TEST_FINGERPRINT`. The runner MUST NOT infer the fingerprint from `TEST_DATABASE_URL` itself. The expected hostname is a non-secret project-local config value, NOT a credential |
| AC-013 | Runner refuses to start if `TEST_DATABASE_URL` host matches `DEV_DATABASE_URL` host (error: `TEST_EQUALS_DEV`) |
| AC-014 | Runner refuses to start if `TEST_DATABASE_URL` host matches `PROD_DATABASE_URL` host (error: `TEST_EQUALS_PROD`) |
| AC-015 | Runner refuses to start if `TEST_DATABASE_URL` is unreachable (error: `TEST_DB_UNREACHABLE`) — probe is READ-ONLY (`SELECT 1 AS one`) |
| AC-016 | Runner refuses to start if base URL is non-loopback without explicit remote override (error: `REMOTE_BASE_URL_NOT_AUTHORIZED`) |
| AC-017 | Runner performs SAFE post-spawn target confirmation (Phase B): seeds a uniquely identifiable PUBLISHED sentinel DIRECTLY into TEST via the runner's TEST-verified Neon SQL connection (NOT through the application Server Action), then verifies via the public read path (`GET /`) that the application can see the sentinel. If sentinel NOT visible → STOP with `APP_DB_DIVERGENCE`. The sentinel insert NEVER goes through an application whose DB target has not already been certified |
| AC-017a | NO write-based target verification is performed. The previous proposal ("insert probe fixture via the running app's Server Action, then verify the row landed in TEST") is REMOVED. Guard test AC-037a verifies no such write-probe exists in the runner code |
| AC-018 | A parent `.env` `DATABASE_URL=file:...` SQLite fallback does NOT silently redirect the suite. The runner constructs the child env explicitly (curated allowlist), removes/overrides any inherited parent `DATABASE_URL`, and injects `DATABASE_URL=TEST_DATABASE_URL`. Guard test AC-037 verifies: (A) parent value NOT used; (B) application receives TEST; (C) NO mutation before target certification |
| AC-019 | Mutation ordering invariant (§16): NO state mutation occurs before Phase A target certification. Steps 1-11 of the runner pre-flight are READ-ONLY. Orphan cleanup, rateLimit cleanup, bootstrap, fixture insert, browser actions all occur AFTER Phase A passes. Guard test AC-037b verifies this ordering by simulating a parent env where `DATABASE_URL=file:...` and asserting no `DELETE`/`INSERT` SQL is issued before target certification |

### Guard Self-Tests

| AC ID | Criterion |
|---|---|
| AC-030 | `tests/e2e/guards.spec.ts` (or equivalent unit-level guard tests under `__tests__/e2e-guards.test.ts`) verifies: local target allowed |
| AC-031 | Guard test verifies: remote target denied by default. The guard self-test does NOT make any external network request — it mocks the runner's base-URL validator and asserts the REFUSE decision |
| AC-032 | Guard test verifies: TEST DB allowed (verified TEST fingerprint + read-only probe pass) |
| AC-033 | Guard test verifies: DEV DB denied for E2E (`TEST_EQUALS_DEV` error) |
| AC-034 | Guard test verifies: Production DB denied for E2E (`TEST_EQUALS_PROD` error) |
| AC-035 | Guard test verifies: unknown DB denied (no silent execution — `TEST_FINGERPRINT_MISMATCH` error) |
| AC-036 | Guard test verifies: SQLite fallback denied (`TEST_IS_SQLITE_FALLBACK` error) |
| AC-037 | Guard test verifies: parent `DATABASE_URL` contamination does not silently redirect execution. Simulates parent env with `DATABASE_URL=file:...` and asserts: (A) the parent value is NOT used by the child process; (B) the child application receives `DATABASE_URL=TEST_DATABASE_URL` (positively verified TEST); (C) NO mutation occurs before target certification. No external network request is made |
| AC-037a | Guard test verifies: no write-based target probe exists in the runner code. A static check (grep / AST scan) confirms the runner does NOT insert probe fixtures via the application Server Action as a target-verification mechanism. The only post-spawn confirmation is the Phase B sentinel approach (AC-017) which inserts via direct Neon SQL on the certified TEST connection |
| AC-037b | Guard test verifies: the mutation ordering invariant (§16) is enforced. The runner's pre-flight sequence issues NO `INSERT`/`UPDATE`/`DELETE` SQL before Phase A target certification. Verified by mocking the SQL client and asserting the SQL traffic log is empty during steps 1-11 |
| AC-037c | Guard test verifies: remote override requires all THREE variables (`E2E_ALLOW_REMOTE=1` + `E2E_REMOTE_BASE_URL` + `E2E_REMOTE_AUTHORIZATION_REF`). Missing any one → REFUSED. The guard self-test does NOT make any external network request — it verifies the REFUSE/ACCEPT decision logic only |
| AC-037d | Guard test verifies: `E2E_REMOTE_AUTHORIZATION_REF` is treated as a non-secret reference (a string identifier), NOT validated as a credential/token. The runner only checks the variable is present and non-empty; it does NOT attempt to authenticate with the value |

### Critical User Journeys

| AC ID | Criterion |
|---|---|
| AC-050 | Public E2E journeys pass: `public-root`, `public-detail`, `public-search`, `public-pagination`, `public-not-found`, `public-seo` |
| AC-051 | Admin critical 15-step journey passes: `admin-critical-journey` |
| AC-052 | FANTOMAS journey passes: `fantomas-journey` |
| AC-053 | Security E2E journeys pass: `security-admin-route-guard`, `security-hidden-offer`, `security-tiptap-href`, `security-unsafe-url`, `security-logout-invalidates` |
| AC-054 | Accessibility E2E passes: `accessibility` (no critical axe violations) |
| AC-055 | Responsive E2E passes: `responsive` (public pages render on mobile viewport) |

### Quality Gates & Suite Preservation

| AC ID | Criterion |
|---|---|
| AC-070 | `pnpm lint` PASS |
| AC-071 | `pnpm typecheck` PASS |
| AC-072 | `pnpm test` PASS (existing 149 Vitest tests still pass, unchanged) |
| AC-073 | `pnpm build` PASS |
| AC-074 | `pnpm test:e2e` PASS (new E2E gate) |
| AC-075 | Existing 149 Vitest tests are unchanged (diff shows only additive changes — no removals) |

### Quota-Safety & Isolation

| AC ID | Criterion |
|---|---|
| AC-090 | E2E report includes quota-safety evidence block (LOCAL app, TEST DB, NO remote E2E by default, NO Vercel, NO load test, NO production touch, NO DEV mutation, YES TEST mutation for fixtures) |
| AC-091 | E2E does NOT clear DEV `rateLimit` (guard test verifies) |
| AC-092 | E2E does NOT disable rate limiter globally (auth.ts `rateLimit.enabled` remains `true`) |
| AC-093 | E2E does NOT touch Production (no `PROD_DATABASE_URL` reads beyond divergence check; no writes) |
| AC-094 | E2E cleanup deletes only fixtures by exact canonical UUID (collected from title prefix `E2E_`). No broad `TRUNCATE`. No unrestricted `DELETE FROM offers WHERE title LIKE 'E2E_%'` without an explicit UUID list — always delete by `id` after collecting the UUIDs. Normal cleanup uses exact recorded UUIDs; orphan recovery uses title prefix to discover UUIDs, then deletes by UUID. No new schema column added solely for E2E (the marker lives in the `title` business field) |
| AC-095 | No Vercel configuration added (no `vercel.json`, no Vercel env vars, no Vercel CLI) |
| AC-096 | No CI workflow added (no `.github/workflows/`) |

### Documentation & Reporting

| AC ID | Criterion |
|---|---|
| AC-110 | E2E run produces console summary with scenario, result, app target, DB target, browser, duration, mutation target |
| AC-111 | E2E run produces JSON report at `tests/e2e/.artifacts/report.json` |
| AC-112 | Quota-safety evidence block is in the JSON report |

### Boundary Preservation

| AC ID | Criterion |
|---|---|
| AC-130 | No MS-006 implementation (no Vercel, no Neon env config, no CI workflow, no production env vars) |
| AC-131 | No S12 start (no release-readiness process triggered) |
| AC-132 | No WP-006 implementation (no deployment work) |
| AC-133 | No new business features added (application feature code unchanged) |
| AC-134 | No database schema changes (no new migration file) |
| AC-135 | No application code modifications (diff is additive on test infrastructure only) |

---

## 14. S11 Verification Plan

S11 for WP-005 must independently verify the INFRASTRUCTURE itself, not only the user journeys.

### S11 Categories

| Category | Verification |
|---|---|
| Local browser run | `pnpm test:e2e` runs successfully on a clean checkout with TEST_DATABASE_URL set |
| TEST database positively identified | Phase A target verification (AC-010 through AC-012a) passes; report shows actual TEST database name + actual TEST host matching `E2E_EXPECTED_TEST_DATABASE_HOST` |
| TEST fingerprint guard | AC-012a passes: `E2E_EXPECTED_TEST_DATABASE_HOST` is explicitly provided in the authorized runtime environment (NOT from `.env.example` fallback), and hostname(`TEST_DATABASE_URL`) == `E2E_EXPECTED_TEST_DATABASE_HOST`. Missing fingerprint → STOP with `MISSING_EXPECTED_TEST_FINGERPRINT` |
| Mutation ordering invariant | AC-019 + AC-037b pass: no SQL mutation before Phase A target certification |
| SAFE post-spawn target confirmation | AC-017 passes: Phase B sentinel visible via public read path. AC-017a passes: no write-based probe through the application |
| Parent DATABASE_URL contamination refused | AC-018 + AC-037 pass: parent `DATABASE_URL=file:...` is NEUTRALIZED; child receives TEST; no mutation before certification |
| DEV untouched | E2E never connects to DEV (guard test AC-033 + AC-091 verify). S11 confirms by inspecting the runner code and the SQL traffic log: no connection to `DEV_DATABASE_URL` is opened during the run |
| Production untouched | No `PROD_DATABASE_URL` reads beyond divergence check; no writes; no migrations. S11 confirms by inspecting the runner code: no `PROD_DATABASE_URL` connection is opened |
| Remote URL guard works | Guard test AC-031 passes: setting `E2E_BASE_URL=https://example.com` without override → runner refuses. No external network request made by the guard test |
| Unknown DB guard works | Guard test AC-035 passes: removing `TEST_DATABASE_URL` (or pointing to an unknown host) → runner refuses with `MISSING_TEST_DATABASE_URL` or `TEST_FINGERPRINT_MISMATCH` |
| Fixture cleanup works | Post-run DB query: `SELECT COUNT(*) FROM offers WHERE title LIKE 'E2E_%'` returns 0 (all E2E fixtures have `E2E_` title marker; cleanup deletes by exact canonical UUID, so no `E2E_`-titled rows remain after a successful run) |
| Critical user journeys pass | AC-050 through AC-055 all PASS |
| Failure artifacts work | Force a deliberate failure (e.g., break a spec temporarily) → screenshot + trace generated in `.artifacts/` |
| Existing 149 tests still pass | AC-072 + AC-075 PASS |
| Quality gates | AC-070 through AC-074 all PASS |

### S11 Evidence Requirement

S11 must produce real, non-mocked evidence:
- Actual Playwright run logs (console output captured).
- Actual screenshot of a successful critical journey step (optional, used as evidence).
- Actual DB query results showing fixture cleanup (`SELECT COUNT(*) FROM offers WHERE title LIKE 'E2E_%'` returns 0).
- Actual Phase A target verification output: `TEST_DATABASE_URL` host + `E2E_EXPECTED_TEST_DATABASE_HOST` comparison + `current_database()` result.
- Actual Phase B sentinel confirmation: the sentinel title appeared in `GET /` HTML response.
- Actual SQL traffic log: steps 1-11 of the runner pre-flight issue NO `INSERT`/`UPDATE`/`DELETE` (mutation ordering invariant verified).
- Actual JSON report with quota-safety block.

Do NOT accept only mocked evidence. The infrastructure must really run.

---

## 15. Quota-Safety Evidence

Per AISE S0 v0.2 §26, the WP-005 verification model:

| Resource | Value |
|---|---|
| APPLICATION RUNTIME | LOCAL (Next.js on `127.0.0.1`) |
| DATABASE / STATE | TEST (`TEST_DATABASE_URL`, positively verified) |
| REMOTE E2E | NO (default; opt-in only with explicit override + OWNER authorization) |
| VERCEL | NO (never in WP-005; MS-006 scope) |
| LOAD TEST | NO |
| POLLING | NO (no scheduled runs, no cron, no background monitoring per S0 §23) |
| PRODUCTION | NOT TOUCHED (no `PROD_DATABASE_URL` writes; no migrations; no bootstrap) |
| DEV MUTATED DURING FINAL VERIFICATION | NO (E2E never connects to DEV; guard test verifies) |
| TEST MUTATED | YES (fixtures with `E2E_` title marker created/cleaned; `rateLimit` cleared in TEST only) |

---

## 16. Mutation Ordering Invariant (Frozen)

**FROZEN CONTRACT INVARIANT**: NO STATE MUTATION BEFORE TARGET CERTIFICATION.

This invariant is the single most important safety rule for WP-005. It directly addresses the WP-004 environment incident class (parent `DATABASE_URL` contamination could have caused a mutation against an uncertified target).

**Required sequence — ALWAYS:**

```
IDENTIFY target
  → VERIFY target identity (Phase A — read-only)
  → AUTHORIZE target for mutation (Phase A passes)
  → MUTATE target (fixture insert, fixture cleanup, rateLimit cleanup, bootstrap, test user creation, offer creation, browser actions)
```

**Forbidden sequence — NEVER:**

```
MUTATE target
  → VERIFY target identity afterward
```

**Scope of "mutation":**
- `INSERT` into any table (offers, user, session, account, verification, rateLimit)
- `DELETE` from any table (including rateLimit cleanup, orphan cleanup)
- `UPDATE` to any table
- `TRUNCATE`
- Bootstrap execution (which creates users)
- Test user creation
- Offer creation (via direct DB helper OR via application Server Action)
- Browser actions that trigger Server Actions (login, create, edit, publish, suspend, republish, archive, logout)

**Phase A (read-only) steps that MUST complete before any mutation:**
1. Parse `.env.local` via `parseEnvLocal()`
2. Read `TEST_DATABASE_URL`
3. Validate URL type/scheme (`postgresql://` only; reject `file:`, `mysql:`, etc.)
4. Positive TEST fingerprint comparison: `E2E_EXPECTED_TEST_DATABASE_HOST` is explicitly provided in the authorized runtime environment (NOT from `.env.example` fallback, NOT inferred from `TEST_DATABASE_URL` itself), and `hostname(TEST_DATABASE_URL) == E2E_EXPECTED_TEST_DATABASE_HOST`
5. Read-only refuse-non-TEST guards (`hostname != DEV host`, `hostname != PROD host`)
6. Read-only connectivity probe (`SELECT 1 AS one`)
7. Read-only identity probe (`SELECT current_database() AS db`)
8. Base URL policy check (loopback only, or explicit remote override)
9. Construct child process environment explicitly (curated allowlist, NO inherited `DATABASE_URL`)
10. Inject `DATABASE_URL=TEST_DATABASE_URL` (positively verified TEST value)

Only after Phase A passes may any mutation occur. The runner's pre-flight sequence (steps 1-11 of §8.1) is READ-ONLY — verified by guard test AC-037b.

**Phase B (optional, SAFE post-spawn confirmation) is NOT a mutation-verification step:**
- Phase B seeds a PUBLISHED sentinel DIRECTLY into TEST via the runner's TEST-verified Neon SQL connection (NOT through the application).
- Phase B verifies via the public read path (`GET /`) that the application can see the sentinel.
- The sentinel insert is a TEST mutation, but it happens AFTER Phase A has certified TEST, so it is safe.
- The sentinel insert NEVER goes through an application whose DB target has not already been certified.

**This invariant is FROZEN. Any future change requires a CONTRACT DIVERGENCE PROTOCOL (R3) invocation and OWNER authorization.**

---

## 17. Non-Blocking Historical Finding (Carried Forward from WP-004)

The WP-004 post-merge environment incident (parent `.env` `DATABASE_URL=file:...` SQLite fallback leaked into the test process while the authorized target was `TEST_DATABASE_URL`) is recorded as a NON-BLOCKING HISTORICAL FINDING. It informed the design of this WP-005 contract (§5.3 Environment Target Contract, §5.5 Database Target Identity Verification, AC-018). It is NOT an open defect — it is a design input.

The S10 initial test-count reporting discrepancy from WP-004 (S10 reported 59 unit + 43 integration = 102; actual was 58 + 44 = 102) is also carried forward as a NON-BLOCKING HISTORICAL FINDING. Application impact: NONE. Do NOT reopen.

---

## 18. Work Branch

Recommended work branch for S10 (per owner §51): `wp/005-e2e-test-infrastructure`.

This branch is NOT created during S9. S10 creates it after OWNER APPROVE + AUTHORIZE.

**FINAL S10 BRANCH BASE (frozen):** `6dd5b337449f266b436b46420061d887cd51c0b1`.

This is the canonical dev head AFTER this final S9 patch operation. S10 MUST branch from this exact SHA — it contains BOTH the original WP-005 S9 contract (committed at `6278315`) AND the final target-verification hardening patch (committed at `6dd5b33`). The implementation branch must contain both; branching from `6278315` would miss the hardening patch and is FORBIDDEN.

Historical references to `6278315` may remain only when clearly labeled as HISTORICAL PRE-PATCH state (e.g., in §1 Contract Status, §19 S9 Final State). Every instruction that tells S10 to branch from `6278315` (or any other commit) is REMOVED — the only valid implementation baseline is `6dd5b33`.

**Branch creation precondition (per owner §2 — freeze baseline verification):** Before S10 branch creation, the implementation procedure MUST verify:

```
dev local = dev remote = 6dd5b337449f266b436b46420061d887cd51c0b1
worktree  = CLEAN
main      = 0bc77a783c8efc1ba6056c67b5a5e290dd26ee4d
```

Only after this verification passes may S10 create `wp/005-e2e-test-infrastructure` from `6dd5b33`. If `dev` differs from `6dd5b33` (local OR remote): **STOP** and report `CANONICAL STATE DIVERGENCE`. Do NOT silently branch from another commit.

After S11 PASS + OWNER ACCEPT + closure, S10 work is fast-forward merged to `dev` (per established convention: `git merge --ff-only wp/005-e2e-test-infrastructure`). The work branch is RETAINED (not deleted), matching the convention established for WP-001 through WP-004.

---

## 19. S9 Final State

After this S9 operation:

| Surface | State |
|---|---|
| Application code | UNCHANGED |
| DB schema | UNCHANGED |
| DB migrations | UNCHANGED |
| Packages (`package.json`, `pnpm-lock.yaml`) | UNCHANGED |
| CI (`.github/`) | UNCHANGED (no CI workflow created) |
| Vercel | UNCHANGED (no Vercel config) |
| `main` branch | UNCHANGED (still `0bc77a7`) |
| `dev` branch | UNCHANGED — initial S9 contract at `6278315` (HISTORICAL), hardening patch at `6dd5b33` (HISTORICAL), this final patch adds a new commit on top of `6dd5b33`; the dev head AFTER this final patch is the FINAL S10 BRANCH BASE |
| Worktree | CLEAN |
| WP-005 implementation | NOT STARTED |
| Playwright | NOT installed (S10 will install) |
| `playwright.config.ts` | NOT created (S10 will create) |
| `tests/e2e/` | NOT created (S10 will create) |
| `pnpm test:e2e` script | NOT added (S10 will add) |
| `E2E_EXPECTED_TEST_DATABASE_HOST` | NOT committed to repo; `.env.example` MAY document the variable name and its purpose but MUST NOT be the authoritative runtime source; the actual authorized runtime value is supplied by the execution environment (`.env.local` for local developer runs, or explicitly injected process env for CI) |

**Only canonical contract documentation changes:** `docs/planning/work-packages/WP-005-E2E-TEST-INFRASTRUCTURE.md` (this file).

---

## 20. Files Modified by S9

| File | Action | Notes |
|---|---|---|
| `docs/planning/work-packages/WP-005-E2E-TEST-INFRASTRUCTURE.md` | CREATED (initial S9) + PATCHED (S9 patch 1: harden E2E target verification) + FINAL-PATCHED (S9 patch 2: freeze S10 baseline and test fingerprint — this patch) | This contract (documentation-only) |

No other files are modified, created, or deleted by S9 (initial, patch 1, or this final patch).

---

## 21. Risk Register (Material Risks for S10)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Playwright Chromium binary fails to download in restricted environment | Medium | High | S10 may need to use a project-local browser cache or pre-provisioned Chromium; documented as S10 risk, not S9 risk |
| E2E suite flakes due to rate-limit timing | Medium | Medium | Per-spec rateLimit clear + sleep pattern (same as auth-regression test); 0 default retries (no flake masking) |
| E2E suite flakes due to Tiptap content rendering timing | Low | Low | Server-side rendering — deterministic, no client hydration race |
| Test database drift (orphan fixtures from failed runs accumulate) | Low | Low | Pre-flight cleanup of `e2e-`-prefixed orphans at each run start |
| Live target verification fails due to Neon replication lag | Low | Medium | Retry once with 1s sleep; if still fails, STOP (per fail-closed rule) |
| Owner discovers MS-005 scope divergence from S8 during S9 review | Low | Medium | This contract explicitly maps S8 requirements; divergence protocol (R3) applies if OWNER identifies a gap |

---

## 22. Owner Authorization Required

| Authorization | Required For |
|---|---|
| OWNER APPROVE WP-005 CONTRACT | Approving this S9 contract before S10 starts |
| OWNER AUTHORIZE S10 | Authorizing S10 implementation (after contract approval) |
| OWNER AUTHORIZE REMOTE E2E (if ever needed) | Any future remote E2E run (NOT granted by this S9) |
| OWNER AUTHORIZE Playwright installation | S10 will install `@playwright/test` + `@axe-core/playwright` + Chromium binary (per §10) |

No further authorization is requested by this S9 operation.

---

## 23. References

- AISE S0 v0.2 §26 (REMOTE RUNTIME COST & QUOTA SAFETY)
- AISE S0 §23 (Zero Scheduled Work)
- AISE S0 §25 (External Parameter Gate)
- ADR-0006 (Database Environment Isolation: Production / Preview / Local)
- ADR-0008 (Testing Strategy: Vitest + RTL + Playwright, Real DB in Integration)
- ADR-0009 (Offer URL — UUID detail route)
- TD-024 (Testing strategy — 4-layer architecture)
- TD-025 (CI pipeline — GitHub Actions)
- TD-029 (SEO — sitemap + robots + metadata)
- S6 §18.4 (Critical E2E scenario — 15-step journey)
- S6 §18.5 (CI integration)
- S8 §7 MS-005 (E2E Integration + Hardening)
- S8 §7 MS-006 (Environments + CI/CD — NOT this WP)
- WP-004 closure commit (`484898e`) — environment incident recorded in PROJECT_STATE.md
- Existing Vitest integration tests: `__tests__/auth-regression.test.ts`, `__tests__/offers-integration.test.ts`, `__tests__/public-offers-integration.test.ts` (pattern source for fixtures + rate-limit handling + parseEnvLocal)

---

**END OF WP-005 CONTRACT — DRAFT, PENDING OWNER APPROVAL + AUTHORIZATION**
