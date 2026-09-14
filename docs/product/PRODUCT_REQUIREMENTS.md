# PRODUCT REQUIREMENTS — JOURDAIN EMPLOI V1

**Document type:** AISE S5 — Product Requirements / Cahier des Charges fonctionnel
**Status:** DRAFT — PENDING OWNER APPROVAL
**Date:** 2026-09-14
**Project:** JOURDAIN EMPLOI V1
**Canonical repository:** `github.com/alexkanga/jourdain`
**Canonical branch:** `main`
**Canonical HEAD at draft start:** `33a51ca3c695b6f170971c05af8a21a01e6e877a`

---

## 1. Document Status

| Field | Value |
|---|---|
| Project | JOURDAIN EMPLOI |
| AISE Stage | S5 — Product Requirements |
| Status | DRAFT — PENDING OWNER APPROVAL |
| Source Charter | `docs/planning/PROJECT_CHARTER.md` — OWNER APPROVED 2026-09-13 at `fa377c1` |
| Charter-approved canonical HEAD | `fa377c1feba5a111c07e0f40d094245fdadc727d` |
| S5 draft HEAD at start | `33a51ca3c695b6f170971c05af8a21a01e6e877a` |

This document is governed by AISE protocol S5 (`docs/engineering/AISE_PRODUCT_REQUIREMENTS.md`). It defines **what the product must do** — not how (S6) and not why (S4).

Every material requirement carries one of four epistemic states (S5 §5):

- **CONFIRMED** — supported by OWNER approval or authoritative project evidence
- **ASSUMPTION** — plausible and consistent with OWNER intent but not explicitly approved; labeled for OWNER review
- **OPEN** — materially unresolved, decision-relevant; cannot be silently converted to a requirement
- **DEFERRED** — explicitly outside current delivery scope by OWNER decision

Core rules (S5 §5):
- Never silently promote ASSUMPTION → CONFIRMED.
- Never convert OPEN → requirement without evidence.

---

## 2. Source Charter

The source of truth for this requirements document is the OWNER-APPROVED PROJECT CHARTER (`docs/planning/PROJECT_CHARTER.md`), frozen at canonical commit `fa377c1` on 2026-09-13.

All S5 requirements must trace to one of:
- A Charter CONFIRMED item
- A Charter DEFERRED DECISION (only if material for S5 functional behavior)
- An explicit OWNER decision provided during S5 elicitation
- An authoritative source (e.g., a regulation, an OWNER-provided reference)

No requirement may silently expand an S4 out-of-scope area.

---

## 3. Product Scope Summary

JOURDAIN EMPLOI V1 is a simple, mono-tenant web portal for **publishing and consulting job offers**. The administration records and manages offers through an authenticated back-office with a single ordinary role (ADMIN). The public consults published offers without authentication. The V1 is intentionally narrow: it is NOT a recruitment platform.

The Fantomas system principal (AISE §14 / §21) is mandated as a special break-glass principal distinct from ordinary ADMIN users.

For full scope, see Charter Sections 7 (High-Level Scope) and 8 (Out of Scope). This S5 document decomposes the Charter scope into testable requirements.

---

## 4. Actors / Roles

| Actor / Role | Description | Authentication | Source |
|---|---|---|---|
| **PUBLIC visitor** | Any visitor who consults published offers without authentication | None | Charter §3, §5 |
| **ADMIN** | Ordinary administration role; manages the offer lifecycle | Authenticated | Charter §3, §4 (OWNER revision) |
| **FANTOMAS** | Special system principal; highest privilege; bootstrap / recovery / break-glass | Authenticated (break-glass) | Charter §7; AISE S0 §14, §21 |
| **SYSTEM** | Automated system actions (timestamps, status updates, audit) | N/A (internal) | Inferred from functional behavior |

The V1 ordinary interface uses a single ADMIN role. No complex RBAC for ordinary users. Fantomas is distinct and is not exposed as a regular role in the day-to-day interface.

---

## 5. Functional Requirements

Functional requirements are grouped by capability area.

### 5.1 Authentication & Session (ADMIN)

```
ID:            FR-001
TITLE:         Admin login
REQUIREMENT:   The system shall allow an ADMIN user to authenticate with a login identifier and a password to access the administration back-office.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Administration back-office: Authentication); OWNER S5 §1
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an ADMIN account exists with valid credentials
               WHEN the ADMIN submits the login form with the correct identifier and password
               THEN the system authenticates the ADMIN and grants access to the back-office
               AND GIVEN the same ADMIN submits invalid credentials
               WHEN the ADMIN attempts to log in
               THEN the system rejects the attempt and does not grant access
DEPENDENCIES:  PERM-001
```

```
ID:            FR-002
TITLE:         Admin logout
REQUIREMENT:   The system shall allow an authenticated ADMIN to end the session explicitly.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Administration back-office); inferred standard behavior
STATUS:        ASSUMPTION — A1
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an ADMIN is authenticated
               WHEN the ADMIN triggers logout
               THEN the session is ended and the back-office is no longer accessible without re-authenticating
```

```
ID:            FR-003
TITLE:         Unauthenticated access to back-office is denied
REQUIREMENT:   The system shall deny access to any administration back-office page to unauthenticated visitors.
ACTOR:         PUBLIC, SYSTEM
SOURCE:        Charter §7 (back-office authenticated); inferred security requirement
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN a visitor is not authenticated as ADMIN
               WHEN the visitor attempts to access a back-office URL
               THEN the system denies access and redirects to the login page (or returns an unauthorized response)
```

### 5.2 Offer List (ADMIN)

```
ID:            FR-010
TITLE:         Admin offer list view
REQUIREMENT:   The system shall display to an authenticated ADMIN a list of all offers regardless of status, with sufficient information to identify and act on each offer.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Consultation of the administrative list of offers); OWNER S5 §1
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN at least one offer exists in any status (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED)
               WHEN the ADMIN opens the offer list
               THEN the system displays each offer with at minimum: title, status, publication date (if any), and a way to access the offer's detail/edit view
               AND the list is navigable when the number of offers exceeds a single page
```

```
ID:            FR-011
TITLE:         Admin offer list status visibility
REQUIREMENT:   The administrative offer list shall clearly display the current status of each offer (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED) so the ADMIN can immediately tell which offers are visible publicly.
ACTOR:         ADMIN
SOURCE:        Charter §7; OWNER S5 §8
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in status X (where X is one of the four lifecycle statuses)
               WHEN the ADMIN views the offer list
               THEN the status X is visibly associated with that offer
DEPENDENCIES:  FR-010, BR-020 (lifecycle states)
```

```
ID:            FR-012
TITLE:         Admin offer list filtering
REQUIREMENT:   The administrative offer list MAY provide simple filters by status and a simple text search on title. Complex search is excluded (see Section 18 — Exclusions).
ACTOR:         ADMIN
SOURCE:        OWNER S5 §12 (search/filter evaluation)
STATUS:        ASSUMPTION — A2 (simple status filter + title search are useful for daily administration; not explicitly mandated but reasonable for usability with more than a few offers)
PRIORITY:      SHOULD
ACCEPTANCE:    GIVEN the ADMIN is on the offer list page
               WHEN the ADMIN selects a status filter or enters a search term
               THEN the list is narrowed to offers matching the filter/search criteria
               AND clearing the filter/search restores the full list
```

### 5.3 Offer Creation & Editing (ADMIN)

```
ID:            FR-020
TITLE:         New offer creation
REQUIREMENT:   The system shall allow an ADMIN to create a new offer by entering values into the offer form (see Section 8 — Offer form fields) and saving it in DRAFT status.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Creation of an offer; Recording of an offer); OWNER S5 §1, §4, §9
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is authenticated
               WHEN the ADMIN opens the "New offer" form and enters at minimum the required fields (title, description)
               AND saves the offer
               THEN the system persists a new offer in DRAFT status
               AND the new offer is visible in the administrative offer list
               AND the new offer is NOT visible in the public offer list
DEPENDENCIES:  FR-001, FR-010, Section 8, BR-030 (required fields), BR-031 (optional fields)
```

```
ID:            FR-021
TITLE:         Offer editing
REQUIREMENT:   The system shall allow an ADMIN to edit the values of any existing offer (regardless of status) and save the changes without forcing a status change.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Modification of an offer); OWNER S5 §1
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in any status
               WHEN the ADMIN opens the edit form, modifies one or more fields, and saves
               THEN the system persists the new values
               AND the offer's status is NOT changed as a side effect of saving edits
DEPENDENCIES:  FR-010, Section 8
```

```
ID:            FR-022
TITLE:         Save without publishing
REQUIREMENT:   The system shall allow an ADMIN to save an offer in DRAFT status without publishing it, so the offer remains invisible to the public until an explicit publication action.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Recording of an offer); OWNER S5 §9
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is editing a new or existing offer
               WHEN the ADMIN saves the offer
               THEN the offer is persisted and remains in DRAFT status (unless it was already in another status, in which case the status is preserved per FR-021)
               AND the offer is NOT visible in the public offer list
DEPENDENCIES:  FR-020, FR-021, BR-020
```

```
ID:            FR-023
TITLE:         Required-field validation on save
REQUIREMENT:   The system shall reject an attempt to save an offer when one or more required fields are missing or empty, and shall indicate which fields are missing.
ACTOR:         ADMIN, SYSTEM
SOURCE:        Charter §7 (Data rules: title required, description required); OWNER S5 §4
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is on the offer form
               WHEN the ADMIN attempts to save with title empty OR description empty
               THEN the system rejects the save and indicates which required field(s) are missing
               AND no offer is persisted (or, in the case of editing an existing offer, the existing offer is not modified)
DEPENDENCIES:  BR-030
```

### 5.4 Publication & Lifecycle Actions (ADMIN)

```
ID:            FR-030
TITLE:         Publish offer
REQUIREMENT:   The system shall allow an ADMIN to explicitly publish a DRAFT offer. Publication is a distinct action from saving.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Publication of an offer); OWNER S5 §9
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in DRAFT status
               WHEN the ADMIN triggers the publish action
               THEN the offer transitions to PUBLISHED status
               AND the offer becomes visible in the public offer list
               AND the offer's detail page becomes accessible to the public
               AND a publication_date is recorded (system-generated if not previously set)
DEPENDENCIES:  BR-020, BR-021, BR-022, FR-040
```

```
ID:            FR-031
TITLE:         Suspend published offer
REQUIREMENT:   The system shall allow an ADMIN to explicitly suspend a PUBLISHED offer. Suspension removes the offer from the public list and the public detail view, without changing the offer's content.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Suspension of a published offer); OWNER S5 §1, §9
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in PUBLISHED status
               WHEN the ADMIN triggers the suspend action
               THEN the offer transitions to SUSPENDED status
               AND the offer is no longer visible in the public offer list
               AND the public detail URL for that offer no longer displays the offer content (returns not-found or equivalent)
               AND the offer's content is preserved in the database
DEPENDENCIES:  BR-020, BR-023, FR-050
```

```
ID:            FR-032
TITLE:         Republish suspended offer
REQUIREMENT:   The system shall allow an ADMIN to republish a SUSPENDED offer, returning it to PUBLISHED status and restoring public visibility.
ACTOR:         ADMIN
SOURCE:        OWNER S5 §20 (critical E2E scenario includes "republication if planned")
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in SUSPENDED status
               WHEN the ADMIN triggers the republish action
               THEN the offer transitions back to PUBLISHED status
               AND the offer is visible again in the public offer list
               AND the public detail URL displays the offer content again
DEPENDENCIES:  BR-020, BR-023, FR-030
```

```
ID:            FR-033
TITLE:         Archive offer
REQUIREMENT:   The system shall allow an ADMIN to archive an offer. Archiving preserves the offer in the database but removes it from the public active list. Archived offers remain accessible administratively.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Archiving of an offer); OWNER S5 §1, §15
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in any active status (DRAFT, PUBLISHED, SUSPENDED)
               WHEN the ADMIN triggers the archive action
               THEN the offer transitions to ARCHIVED status
               AND the offer is no longer visible in the public offer list
               AND the public detail URL no longer displays the offer content
               AND the offer remains visible in the administrative offer list (with ARCHIVED status)
               AND the offer's content is preserved in the database
DEPENDENCIES:  BR-020, BR-024, FR-010
```

```
ID:            FR-034
TITLE:         No automatic deletion of archived offers
REQUIREMENT:   The system shall NOT automatically delete archived offers in V1. Archived offers remain in the database until an explicit administrative action (which is out of V1 scope — see Section 17).
ACTOR:         SYSTEM
SOURCE:        Charter §7 (no auto-delete); OWNER S5 §15, §16
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer is in ARCHIVED status
               WHEN time passes (any duration)
               THEN the offer remains in the database
               AND no automatic deletion occurs
DEPENDENCIES:  FR-033
```

### 5.5 Public Browsing

```
ID:            FR-040
TITLE:         Public offer list
REQUIREMENT:   The system shall display to any visitor (no authentication) a list of PUBLISHED offers, ordered from most recent to oldest by publication date by default, with each offer presented as a card (see Section 10).
ACTOR:         PUBLIC
SOURCE:        Charter §7 (Consultation of the list of published offers); OWNER S5 §2, §10, §13
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN at least one offer is in PUBLISHED status
               WHEN a visitor opens the public offer list
               THEN the system displays each PUBLISHED offer as a card with the fields specified in Section 10
               AND the offers are ordered by publication_date descending (most recent first)
               AND offers in other statuses (DRAFT, SUSPENDED, ARCHIVED) are NOT displayed
               AND the list is navigable when the number of offers exceeds a single page
DEPENDENCIES:  BR-020, BR-025, Section 10
```

```
ID:            FR-041
TITLE:         Public offer detail
REQUIREMENT:   The system shall display to any visitor (no authentication) the full detail of a PUBLISHED offer, including all available fields per Section 10.
ACTOR:         PUBLIC
SOURCE:        Charter §7 (Consultation of the full detail of an offer); OWNER S5 §2, §10
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer is in PUBLISHED status
               WHEN a visitor opens the offer's public detail URL
               THEN the system displays the offer with the fields specified in Section 10 (Detail)
               AND the visitor can read the full description
               AND the visitor can read the application modalities when they are available
               AND no administration controls are visible to the public
DEPENDENCIES:  FR-040, Section 10
```

```
ID:            FR-042
TITLE:         Public detail for non-published offer returns not-found
REQUIREMENT:   The system shall NOT display offer content on the public detail URL when the offer is not in PUBLISHED status.
ACTOR:         PUBLIC, SYSTEM
SOURCE:        Charter §7 (public list restricted to published offers); inferred from FR-040
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in DRAFT, SUSPENDED, or ARCHIVED status
               WHEN a visitor attempts to access that offer's public detail URL
               THEN the system returns a not-found response (or equivalent — no offer content displayed)
               AND no information about the offer's existence or status is leaked to the public
DEPENDENCIES:  FR-041, BR-025
```

### 5.6 Search & Filters (Public)

```
ID:            FR-050
TITLE:         Public simple text search
REQUIREMENT:   The public offer list MAY provide a simple text search on title (and possibly description). A complex search engine is excluded (see Section 18).
ACTOR:         PUBLIC
SOURCE:        OWNER S5 §12 (search/filter evaluation)
STATUS:        ASSUMPTION — A3 (a simple title search is useful for V1 usability; not explicitly mandated; COULD priority)
PRIORITY:      COULD
ACCEPTANCE:    GIVEN the public offer list is displayed
               WHEN the visitor enters a search term
               THEN the list is narrowed to offers whose title (or description) contains the term (case-insensitive)
               AND clearing the search restores the full list
NOTE:          This is a COULD requirement. OWNER may drop it from V1 if it adds undue complexity. Decision deferred to OWNER approval of this baseline.
```

### 5.7 Home Page

```
ID:            FR-060
TITLE:         Public home page
REQUIREMENT:   The system MAY provide a home page that introduces the portal and provides a clear entry point to the published offers list. The home page is not mandatory if the public offer list can serve as the entry point.
ACTOR:         PUBLIC
SOURCE:        OWNER S5 §3 (page d'accueil si nécessaire)
STATUS:        ASSUMPTION — A4 (a minimal home page improves UX but is not strictly required)
PRIORITY:      SHOULD
ACCEPTANCE:    GIVEN a visitor arrives at the site root
               WHEN no specific path is requested
               THEN the system presents either a home page or redirects to the public offer list
               AND the visitor can reach the offer list in one click or fewer
NOTE:          Decision deferred to OWNER approval. If OWNER prefers to skip the home page and serve the offer list directly as the entry point, this requirement can be dropped.
```

---

## 6. Business Rules

### 6.1 Offer Lifecycle States

```
ID:            BR-020
TITLE:         Offer lifecycle states
RULE:          An offer has exactly one status at any time. The set of statuses for V1 is exactly: DRAFT, PUBLISHED, SUSPENDED, ARCHIVED. No other status exists in V1.
SOURCE:        Charter §7; OWNER S5 §8
STATUS:        CONFIRMED
PRIORITY:      MUST
```

| Status | Meaning | Public visibility | ADMIN actions allowed | Allowed transitions |
|---|---|---|---|---|
| **DRAFT** | Offer saved but not yet published | Not visible publicly | Edit, publish, archive | → PUBLISHED, → ARCHIVED |
| **PUBLISHED** | Offer actively visible to the public | Visible in public list + detail | Edit, suspend, archive | → SUSPENDED, → ARCHIVED |
| **SUSPENDED** | Offer temporarily removed from public view (e.g., corrections needed, on hold) | Not visible publicly; public detail URL returns not-found | Edit, republish, archive | → PUBLISHED, → ARCHIVED |
| **ARCHIVED** | Offer permanently removed from public active view but retained in database | Not visible publicly; public detail URL returns not-found | View (read-only); no V1 transition out (republication from ARCHIVED is DEFERRED — see DR-070) | (none in V1) |

**Forbidden transitions in V1:**
- DRAFT → SUSPENDED (no direct path; an offer must be published before it can be suspended)
- ARCHIVED → any other status (no V1 transition out of ARCHIVED — see DR-070)

```
ID:            BR-021
TITLE:         Publication is explicit
RULE:          An offer is PUBLISHED only by an explicit ADMIN action (publish). Saving an offer (FR-022) does NOT publish it. The system shall NOT auto-publish offers.
SOURCE:        OWNER S5 §9
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-022
TITLE:         Publication date semantics
RULE:          The system records a publication_date when an offer transitions to PUBLISHED for the first time. On subsequent republications (SUSPENDED → PUBLISHED), the publication_date is preserved (not overwritten). The ADMIN may optionally specify a publication_date at creation/edit time; if unspecified at first publication, the system records the current date.
SOURCE:        Charter §7; OWNER S5 §14
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-023
TITLE:         Suspension preserves content
RULE:          Suspending an offer does NOT modify the offer's content fields. Only the status changes. The offer's publication_date is preserved.
SOURCE:        OWNER S5 §9 (suspension and modification semantics)
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-024
TITLE:         Archiving preserves content
RULE:          Archiving an offer does NOT modify the offer's content fields. Only the status changes. The offer remains in the database indefinitely (per FR-034). The offer's publication_date is preserved.
SOURCE:        Charter §7; OWNER S5 §15
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-025
TITLE:         Public visibility rule
RULE:          An offer is visible in the public offer list (FR-040) and on its public detail page (FR-041) if and only if its status is PUBLISHED. All other statuses (DRAFT, SUSPENDED, ARCHIVED) are excluded from public visibility.
SOURCE:        Charter §7; inferred from FR-040, FR-041, FR-042
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 6.2 Field Rules

```
ID:            BR-030
TITLE:         Required fields
RULE:          The required fields for an offer are exactly: title, description. All other fields listed in Section 8 are optional. An offer cannot be saved without both required fields present and non-empty.
SOURCE:        Charter §7 (data rules); OWNER S5 §4
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-031
TITLE:         Optional fields do not block save or publish
RULE:          An absent optional field shall NOT prevent saving (FR-022) or publishing (FR-030) an offer. The system shall NOT default an absent optional field to a placeholder value such as "Non renseigné" in the public display — absent optional fields are omitted from display rather than displayed as placeholders.
SOURCE:        Charter §7 (data rules); OWNER S5 §4, §10
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-032
TITLE:         Never invent absent information
RULE:          The system shall NOT fabricate, infer, or auto-fill any offer field value that was not provided by the ADMIN. The system shall NOT generate values such as "Une importante entreprise" for an absent company name.
SOURCE:        Charter §7 (data rules); OWNER S5 §11
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-033
TITLE:         Unknown company presentation
RULE:          When the company field is absent, the public display MAY either omit the company line entirely OR display a neutral label such as "Entreprise non communiquée". The choice between omit and label is a UX decision; it must NOT be a fabricated company name.
SOURCE:        OWNER S5 §11
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer has no company value
               WHEN the offer is displayed publicly (card or detail)
               THEN the displayed company line is either absent or reads "Entreprise non communiquée" (or equivalent neutral label)
               AND no fabricated company name appears
```

```
ID:            BR-034
TITLE:         Description formatting
RULE:          The description field shall preserve reasonable professional formatting entered by the ADMIN: paragraphs, lists, headings (if applicable), and links (if applicable). The system shall NOT corrupt or flatten the formatting on save or display. The technical editor choice is deferred to S6.
SOURCE:        OWNER S5 §5
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN enters a description with paragraphs, a list, a heading, and a link
               WHEN the offer is saved and then displayed in the public detail page
               THEN the formatting is preserved (paragraphs, list, heading, link are rendered as such)
               AND no content is lost
```

### 6.3 Application Modalities Rules

```
ID:            BR-040
TITLE:         Application modalities are informational only
RULE:          The application modalities fields (text, email, URL) are strictly informational. The system shall NOT provide an "Apply" button, an application form, a CV upload, or any internal application workflow. The system shall NOT track or process applications.
SOURCE:        Charter §8 (Apply button excluded; candidate accounts excluded; CV excluded; internal application excluded); OWNER S5 §6
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN a PUBLISHED offer with application modalities (text/email/URL)
               WHEN a visitor views the offer detail page
               THEN the modalities are displayed as informational text/links
               AND no in-app application submission mechanism is present
```

### 6.4 Source Rules

```
ID:            BR-050
TITLE:         Source is optional
RULE:          The source fields (source name, source URL) are optional. An offer can be saved and published with no source. The source fields are informational only; the system shall NOT perform automated import or syndication from the source URL.
SOURCE:        Charter §7 (source optional); OWNER S5 §7
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 6.5 Sorting Rules

```
ID:            BR-060
TITLE:         Public default sort
RULE:          The public offer list shall sort offers by publication_date descending (most recent first) by default. No alternative sort option is required in V1.
SOURCE:        OWNER S5 §13
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN multiple PUBLISHED offers exist with different publication dates
               WHEN a visitor opens the public offer list without any explicit sort request
               THEN the offers are displayed with the most recently published first
```

```
ID:            BR-061
TITLE:         Tie behavior in sort
RULE:          When two offers share the same publication_date, the tie is broken by creation timestamp descending (most recently created first). This is not visible to the user but ensures deterministic ordering.
SOURCE:        Inferred deterministic ordering requirement
STATUS:        ASSUMPTION — A5 (deterministic ordering is reasonable; specific tie-breaker is an implementation detail but the rule should be stated)
PRIORITY:      SHOULD
```

### 6.6 Date Rules

```
ID:            BR-070
TITLE:         Date categorization
RULE:          The dates relevant to V1 are categorized as follows:
               - ADMIN-entered: publication_date (may default to system date), expiration_date (optional)
               - System-generated: created_at (internal), updated_at (internal), status_changed_at (internal)
               - Public-visible: publication_date, expiration_date (when present)
               - Internal-only: created_at, updated_at, status_changed_at
               The system shall NOT ask the ADMIN to enter created_at, updated_at, or status_changed_at — these are system-managed.
SOURCE:        OWNER S5 §14
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-071
TITLE:         Expiration date semantics
RULE:          The expiration_date is an optional ADMIN-entered date after which the offer is no longer "active". In V1, expiration_date is informational only — the system does NOT automatically move an offer to ARCHIVED or SUSPENDED status when the expiration_date passes. Automated expiration is excluded from V1 (see Section 17 — Deferred Requirements). The ADMIN remains responsible for archiving expired offers.
SOURCE:        OWNER S5 §14 (no automatic deletion / status changes); NFR (no scheduled work per AISE §23)
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN a PUBLISHED offer has an expiration_date in the past
               WHEN time passes beyond the expiration_date
               THEN the offer remains in PUBLISHED status (no automatic transition)
               AND the offer remains visible in the public offer list
               AND the ADMIN must archive it manually
NOTE:          A future V2 might add automated expiration; this is explicitly deferred for V1 (see DR-071).
```

---

## 7. Workflows / State Models

### 7.1 Offer Lifecycle State Model

The offer lifecycle is a 4-state model (BR-020). The state diagram (textual):

```
                    +-----------+
                    |   DRAFT   |  <-- FR-020 (create)
                    +-----------+
                     /         \
                    /           \
              publish            archive
            (FR-030)           (FR-033)
                  /               \
                 v                 v
            +-----------+      +-----------+
            | PUBLISHED |      | ARCHIVED  |
            +-----------+      +-----------+
              /     ^              ^
        suspend   republish        archive
      (FR-031)  (FR-032)       (from any status:
            v     /              DRAFT, PUBLISHED,
        +-----------+              or SUSPENDED)
        | SUSPENDED |
        +-----------+
              \
               \
                archive (FR-033)
                v
            +-----------+
            | ARCHIVED  |
            +-----------+
              (terminal in V1)
```

**Entry conditions per state:**

| State | Entry conditions |
|---|---|
| DRAFT | Offer created by ADMIN (FR-020) |
| PUBLISHED | DRAFT offer published by ADMIN (FR-030), or SUSPENDED offer republished by ADMIN (FR-032) |
| SUSPENDED | PUBLISHED offer suspended by ADMIN (FR-031) |
| ARCHIVED | Any active offer archived by ADMIN (FR-033) |

**Side effects on transitions:**

| Transition | Side effects |
|---|---|
| → PUBLISHED (first publication) | publication_date is set (system date if not previously entered); status_changed_at is updated |
| → PUBLISHED (republication) | publication_date is preserved; status_changed_at is updated |
| → SUSPENDED | status_changed_at is updated; content preserved |
| → ARCHIVED | status_changed_at is updated; content preserved; offer removed from public visibility |

### 7.2 ADMIN Main Workflow

The ADMIN main user journey (Charter §6 + OWNER S5 §1):

```
Login (FR-001)
  -> Offer list (FR-010)
    -> New offer (FR-020)
      -> Form (Section 8)
      -> Save as DRAFT (FR-022)
    -> Find offer in list (FR-010)
    -> Edit (FR-021)
    -> Publish (FR-030)
    -> Suspend (FR-031)
    -> Republish (FR-032)
    -> Archive (FR-033)
  -> Logout (FR-002)
```

### 7.3 PUBLIC Main Workflow

The PUBLIC main user journey (Charter §6 + OWNER S5 §2):

```
Access home or offer list (FR-060, FR-040)
  -> Browse published offers as cards
  -> Click "Voir l'offre" (FR-041)
  -> Read full detail
  -> Read application modalities (if available)
```

---

## 8. Data Requirements

This section defines **logical product data**, not physical database design. Per S5 §14, SQL tables, indexes, foreign keys, ORM schemas, and column types belong to S6.

### 8.1 Offer Entity

**Business name:** Offer

**Purpose:** A single job offer published (or to be published) by the JOURDAIN EMPLOI administration.

**Key attributes (business fields):**

| # | Field | Required | Source |
|---|---|---|---|
| 1 | title | Yes | Charter §7, OWNER S5 §4 |
| 2 | description | Yes (formatted text) | Charter §7, OWNER S5 §4, §5 |
| 3 | company | Optional | Charter §7, OWNER S5 §4 |
| 4 | sector | Optional | Charter §7, OWNER S5 §4 |
| 5 | category | Optional | Charter §7, OWNER S5 §4 |
| 6 | contract_type | Optional | Charter §7, OWNER S5 §4 |
| 7 | education_level | Optional | Charter §7, OWNER S5 §4 |
| 8 | experience | Optional | Charter §7, OWNER S5 §4 |
| 9 | location | Optional | Charter §7, OWNER S5 §4 |
| 10 | publication_date | Optional (ADMIN-entered; system-defaulted on first publication) | Charter §7, OWNER S5 §14 |
| 11 | expiration_date | Optional (ADMIN-entered) | Charter §7, OWNER S5 §4 |
| 12 | source_name | Optional | Charter §7, OWNER S5 §7 |
| 13 | source_url | Optional | Charter §7, OWNER S5 §7 |
| 14 | application_modalities | Optional (text) | Charter §7, OWNER S5 §6 |
| 15 | application_email | Optional | OWNER S5 §6 |
| 16 | application_url | Optional | OWNER S5 §6 |
| 17 | status | Required (system-managed; one of DRAFT, PUBLISHED, SUSPENDED, ARCHIVED) | BR-020 |

**System-managed fields (internal, not entered by ADMIN):**

| # | Field | Source |
|---|---|---|
| 18 | created_at | System — set on offer creation |
| 19 | updated_at | System — updated on every save |
| 20 | status_changed_at | System — updated on every status transition |
| 21 | id | System — unique identifier |

**Identity / uniqueness:** Each offer has a unique system id (DR-010). No business uniqueness on title+company+date — duplicates are allowed (an ADMIN may legitimately create two similar offers).

**Ownership:** Offers are owned by the system (JOURDAIN EMPLOI). In V1, all ADMINs have equal access to all offers (no per-ADMIN ownership). Fantomas has full access per AISE §21.

**Business lifecycle:** See Section 7.1.

**History / audit needs:** Minimal in V1. The system maintains created_at, updated_at, status_changed_at (DR-030). No full audit log of who-did-what in V1 (deferred to a later version — see DR-040).

**Retention:** Archived offers are retained indefinitely in V1 (FR-034). No automatic deletion (BR-024).

**Data quality rules:**
- title must be non-empty after whitespace trimming (BR-030)
- description must be non-empty after whitespace trimming (BR-030)
- application_email, when provided, must be a valid email format (DR-020)
- application_url and source_url, when provided, must be valid URL format (DR-021)
- expiration_date, when provided, must be a valid date (no time component needed in V1)

### 8.2 ADMIN User Entity

**Business name:** ADMIN user

**Purpose:** An ordinary administration account that can authenticate and manage offers.

**Key attributes (business fields):**

| # | Field | Required | Source |
|---|---|---|---|
| 1 | login identifier | Yes | Charter §7; OWNER S5 §1 |
| 2 | password (hashed) | Yes | Charter §7; OWNER S5 §1 |

**Identity / uniqueness:** The login identifier is unique.

**Lifecycle:** Out of V1 scope — V1 does not include ADMIN account self-management (creation, deletion, password reset flows). The initial ADMIN account(s) are created via a bootstrap mechanism (defined in S6/S7) or by Fantomas. ADMIN account management UI is deferred (see DR-050).

### 8.3 Fantomas Principal

**Business name:** Fantomas

**Purpose:** Special system principal for bootstrap, recovery, and break-glass operations per AISE §14 and §21.

**Key attributes (business fields):**

| # | Field | Required | Source |
|---|---|---|---|
| 1 | login identifier | Yes — value: "Fantomas" | Charter §7; OWNER S5 §17 |
| 2 | password (hashed) | Yes — initial value OWNER-specified (NOT stored in repository per S0 §13) | Charter §7; OWNER S5 §17; S0 §13 |

**Identity / uniqueness:** Single Fantomas principal per JOURDAIN EMPLOI instance.

**Privilege inheritance (per AISE §21, OWNER S5 §17):**
- Every operation authorized for the future SUPER_ADMIN role must also be authorized for Fantomas.
- SUPER_ADMIN does NOT automatically inherit Fantomas-only capabilities.
- The distinction between effective SUPER_ADMIN capabilities and Fantomas identity is preserved.

**Note on SUPER_ADMIN:** The Charter mentions a "future SUPER_ADMIN role" but does not require it in V1. V1 has only ADMIN (ordinary) and Fantomas (special). A formal SUPER_ADMIN role is DEFERRED (see DR-051) — Fantomas covers the highest-privilege need in V1.

**Lifecycle:** The initial Fantomas credential is OWNER-specified and injected via S0 §25 External Parameter Gate at implementation time (S10). It must be rotated upon first use (Charter §7). Fantomas password reset / rotation flows are deferred to S6/S7 technical decisions.

**Technical authentication mechanism:** Out of S5 scope — deferred to S6 (see S6 Technical Decision Inputs, Section 19).

---

## 9. Permissions

### 9.1 Permission Matrix

| Action | PUBLIC | ADMIN | FANTOMAS |
|---|---|---|---|
| View public offer list | ALLOWED | ALLOWED | ALLOWED |
| View public offer detail | ALLOWED | ALLOWED | ALLOWED |
| View administrative offer list | DENIED | ALLOWED | ALLOWED |
| View administrative offer detail (any status) | DENIED | ALLOWED | ALLOWED |
| Create offer | DENIED | ALLOWED | ALLOWED |
| Edit offer (any status) | DENIED | ALLOWED | ALLOWED |
| Save offer as DRAFT | DENIED | ALLOWED | ALLOWED |
| Publish offer | DENIED | ALLOWED | ALLOWED |
| Suspend offer | DENIED | ALLOWED | ALLOWED |
| Republish offer | DENIED | ALLOWED | ALLOWED |
| Archive offer | DENIED | ALLOWED | ALLOWED |
| Delete offer (physical) | DENIED | DENIED in V1 | DENIED in V1 (see DR-060) |
| Authenticate to back-office | N/A | ALLOWED (login + password) | ALLOWED (break-glass auth) |
| Bootstrap initial ADMIN account | N/A | DENIED (no ADMIN exists yet) | ALLOWED (Fantomas-specific capability) |
| Recover from auth failure | N/A | DENIED | ALLOWED (Fantomas-specific capability) |

### 9.2 Permission Requirements

```
ID:            PERM-001
TITLE:         Public read access to published offers
REQUIREMENT:   Any unauthenticated visitor may view the public offer list and the public detail of any PUBLISHED offer. No other read access is granted to the public.
SOURCE:        Charter §7; FR-040, FR-041, FR-042
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            PERM-002
TITLE:         ADMIN full offer lifecycle
REQUIREMENT:   An authenticated ADMIN may perform the full offer lifecycle on all offers: create, edit, save, publish, suspend, republish, archive. Physical deletion is NOT authorized in V1.
SOURCE:        Charter §7; FR-020, FR-021, FR-022, FR-030, FR-031, FR-032, FR-033
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            PERM-003
TITLE:         Back-office access restricted to authenticated principals
REQUIREMENT:   Only authenticated ADMIN or Fantomas may access the back-office. Unauthenticated access is denied (FR-003).
SOURCE:        Charter §7; FR-001, FR-003
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            PERM-004
TITLE:         Fantomas privilege inheritance
REQUIREMENT:   Fantomas has at minimum all ADMIN capabilities plus Fantomas-specific bootstrap / recovery / break-glass capabilities per AISE §14 and §21. ADMIN does NOT inherit Fantomas-specific capabilities.
SOURCE:        Charter §7; AISE S0 §14, §21; OWNER S5 §17
STATUS:        CONFIRMED
PRIORITY:      MUST
```

---

## 10. Public Display — Offer Card and Detail

### 10.1 Offer Card (public list)

Each PUBLISHED offer is displayed in the public list as a card showing, when available, the following elements (per Charter §7 and OWNER S5 §10):

| Element | Display rule |
|---|---|
| Title | Always displayed |
| Company | Displayed if present; if absent, either omit OR display "Entreprise non communiquée" (per BR-033) |
| Location | Displayed if present; omitted if absent (no placeholder) |
| Contract type | Displayed if present; omitted if absent (no placeholder) |
| Publication date | Always displayed (every PUBLISHED offer has a publication_date per BR-022) |
| Expiration date | Displayed if present; omitted if absent |
| Action "Voir l'offre" | Always displayed; links to the offer's public detail page |

**Excluded from card (Charter §8):** logos, social share buttons, "Postuler" button.

### 10.2 Offer Detail (public page)

The public detail page displays, when available (per Charter §7 and OWNER S5 §10):

| Element | Display rule |
|---|---|
| Title | Always displayed |
| Company | Same rule as card (BR-033) |
| Main job information (sector, category, contract type, education level, experience) | Each displayed if present; omitted if absent |
| Location | Displayed if present; omitted if absent |
| Dates (publication date, expiration date) | Displayed if present |
| Full description | Always displayed; preserves formatting (BR-034) |
| Application modalities (text, email, URL) | Displayed if any present; the three sub-fields may be displayed together as a "How to apply" block; no "Apply" button (BR-040) |
| Source (name + URL) | Displayed if present; the URL is rendered as a link |

**Excluded from detail (Charter §8):** logos, social share, "Postuler" button, CV upload, favorites, messaging.

---

## 11. Integration Requirements

V1 has no external integration requirements.

```
ID:            INT-001
TITLE:         No external integration in V1
REQUIREMENT:   V1 does NOT integrate with any external system. No syndication, no public API, no import pipeline, no notifications, no payment, no third-party authentication provider as a user-facing feature. Internal endpoints required for Next.js operation are an implementation detail of S6 and are NOT a public product API.
SOURCE:        Charter §9; OWNER S5 §18
STATUS:        CONFIRMED
PRIORITY:      MUST
```

---

## 12. Error / Incomplete / Edge Behavior

### 12.1 Authentication Errors

```
ID:            FR-001-ERR
TITLE:         Invalid credentials
REQUIREMENT:   When an ADMIN submits invalid credentials (wrong login or wrong password), the system shall reject the attempt without indicating which specific field is wrong (no leak of which of login/password is incorrect). The system shall not grant access.
SOURCE:        Standard security practice; inferred from FR-001
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 12.2 Offer Form Errors

```
ID:            FR-023-ERR
TITLE:         Required field validation feedback
REQUIREMENT:   When the ADMIN attempts to save an offer with a missing required field (title or description), the system shall preserve the values already entered in the form (do NOT clear the form), indicate which required field is missing, and keep the ADMIN on the same form page.
SOURCE:        Inferred from FR-023; standard UX practice
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            FR-023-ERR2
TITLE:         URL/email field validation feedback
REQUIREMENT:   When the ADMIN enters an invalid URL or email in a relevant field (application_email, application_url, source_url), the system shall indicate which field is invalid and preserve the rest of the form values. The offer shall NOT be saved until the invalid values are corrected or removed.
SOURCE:        DR-020, DR-021; standard UX practice
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 12.3 Public Page Errors

```
ID:            FR-042-ERR
TITLE:         Non-published offer URL access
REQUIREMENT:   When a visitor accesses a public detail URL for an offer that does not exist or is not in PUBLISHED status, the system shall return a not-found response. The response shall NOT distinguish between "offer does not exist" and "offer exists but is not published" — both cases return the same not-found behavior to avoid information leakage.
SOURCE:        FR-042; standard security practice
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 12.4 Empty States

```
ID:            FR-040-EMPTY
TITLE:         Empty public offer list
REQUIREMENT:   When no offer is in PUBLISHED status (or no offer exists at all), the public offer list shall display an empty state (e.g., a message like "Aucune offre publiée pour le moment" or equivalent). The system shall NOT display an error.
SOURCE:        Standard UX practice
STATUS:        ASSUMPTION — A6 (empty-state copy is reasonable; specific wording can be refined in implementation)
PRIORITY:      SHOULD
```

```
ID:            FR-010-EMPTY
TITLE:         Empty administrative offer list
REQUIREMENT:   When no offer exists at all, the administrative offer list shall display an empty state with a clear call-to-action to create a new offer.
SOURCE:        Standard UX practice
STATUS:        ASSUMPTION — A7 (empty-state CTA is reasonable)
PRIORITY:      SHOULD
```

---

## 13. Non-Functional Requirements

### 13.1 Performance

```
ID:            NFR-001
TITLE:         Public page response time
REQUIREMENT:   Public pages (offer list, offer detail) shall display their primary content within a reasonable time for a small editorial portal. Target: the public offer list and the public offer detail page should be served quickly. Specific quantitative target: TARGET TO BE DEFINED in S6 (this is a SHOULD, not a blocker for S5).
SOURCE:        Charter §10 (priority 5: performance — ordered after simplicity, correctness, security, maintainability)
STATUS:        ASSUMPTION — performance matters but is not the top priority; quantitative target deferred to S6
PRIORITY:      SHOULD
```

### 13.2 Security

```
ID:            NFR-010
TITLE:         Password storage
REQUIREMENT:   ADMIN and Fantomas passwords shall NOT be stored in plaintext. The system shall store only a hashed representation using a vetted password-hashing mechanism. The specific mechanism is an S6 decision.
SOURCE:        Standard security practice; Charter §10 (priority 3: security)
STATUS:        CONFIRMED — requirement; mechanism deferred to S6
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an ADMIN or Fantomas account exists
               WHEN the database is inspected
               THEN the password is NOT present in plaintext
               AND a password hash is present instead
```

```
ID:            NFR-011
TITLE:         No password in repository
REQUIREMENT:   No password value (ADMIN, Fantomas, or any other) shall be stored in the Git repository, in any file (including .env.example, README, PROJECT_STATE, this requirements document, or any other). Passwords are injected via S0 §25 External Parameter Gate at deployment time.
SOURCE:        S0 §13 (frozen rule); Charter §10
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            NFR-012
TITLE:         Session protection
REQUIREMENT:   Authenticated ADMIN sessions shall be protected against standard session attacks (fixation, hijacking). The specific technical mechanisms (cookie flags, session rotation, etc.) are S6 decisions.
SOURCE:        Standard security practice; Charter §10 (priority 3: security)
STATUS:        CONFIRMED — requirement; mechanisms deferred to S6
PRIORITY:      MUST
```

```
ID:            NFR-013
TITLE:         Fantomas credential handling
REQUIREMENT:   The Fantomas initial bootstrap credential shall be injectable at deployment time without being stored in the repository. It shall be rotated upon first use. The technical mechanism is an S6/S7 decision.
SOURCE:        Charter §7; S0 §13, §25; OWNER S5 §17
STATUS:        CONFIRMED — requirement; mechanism deferred to S6/S7
PRIORITY:      MUST
```

### 13.3 Availability

V1 has no formal uptime SLO (Charter §13 — success is functional, not quantitative). Availability is "best effort" within Vercel's free or standard tier (Charter §10 — priority 7: low operating cost). No high-availability requirement for V1.

### 13.4 Accessibility

```
ID:            NFR-030
TITLE:         Reasonable accessibility
REQUIREMENT:   The public interface shall follow reasonable accessibility practices (semantic HTML, sufficient contrast, navigable by keyboard). Specific WCAG level conformance: not mandated for V1 but accessibility-aware design is expected.
SOURCE:        Standard practice; Charter §10 (priority 1: simplicity of use)
STATUS:        ASSUMPTION — A8 (accessibility-aware design is reasonable for a public portal; specific conformance level deferred)
PRIORITY:      SHOULD
```

### 13.5 Localization

```
ID:            NFR-040
TITLE:         French only
REQUIREMENT:   The V1 user interface (public and administrative) shall be in French. Multilingual support is excluded from V1 (Charter §8). The technical i18n architecture is an S6 decision; V1 may use a simple French-only implementation without an i18n framework.
SOURCE:        Charter §8, §10; OWNER S5 §18
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 13.6 Auditability

```
ID:            NFR-050
TITLE:         Minimal audit data
REQUIREMENT:   The system shall maintain minimal audit data per offer: created_at, updated_at, status_changed_at. A full audit log (who did what, when, with what values) is NOT required for V1 (deferred — see DR-040).
SOURCE:        DR-030; Charter §10
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 13.7 Data Integrity

```
ID:            NFR-060
TITLE:         Offer integrity across lifecycle
REQUIREMENT:   The system shall preserve offer content integrity across status transitions (DRAFT → PUBLISHED → SUSPENDED → PUBLISHED → ARCHIVED). No content field shall be modified as a side effect of a status transition. Only the status field and status_changed_at change.
SOURCE:        BR-023, BR-024; FR-031, FR-032, FR-033
STATUS:        CONFIRMED
PRIORITY:      MUST
```

---

## 14. Constraints

The constraints from Charter §10 apply. Key restatements relevant to S5:

- **Mono-tenant**: V1 is a single JOURDAIN EMPLOI instance (Charter §9, OWNER revision §1). No multi-tenancy.
- **French only**: V1 UI is French (Charter §10, OWNER revision §2). Multilingual is out of scope.
- **Manual offer creation only**: No automated import (Charter §7, OWNER revision §3 + §6).
- **Single ordinary ADMIN role**: No complex RBAC for ordinary users (Charter §3, §7; OWNER revision §4). Fantomas is the only other principal (PERM-004).
- **No architecture-heavy stack**: No microservices, Kubernetes, Kafka, Elasticsearch (Charter §10).
- **Production separated from Preview**: Vercel environments (Charter §10).
- **AISE process constraints**: §13 secret handling, §14/§21 Fantomas, §23 zero scheduled work, §24 contract preservation, §25 external parameter gate.
- **Volumetry**: Editorial portal scale, no quantitative capacity assumption (Charter §10; OWNER revision §12).
- **UX/UI references**: OWNER-provided screenshots are the orientation (Charter §10; OWNER revision §10).
- **Priority order** (when two priorities conflict, the lower-numbered wins): 1. Simplicity of use, 2. Correct functioning, 3. Security, 4. Maintainability, 5. Performance, 6. Low complexity, 7. Low operating cost.

---

## 15. Assumptions

| ID | Assumption | Section | Why it's an assumption |
|---|---|---|---|
| A1 | Admin logout is available (FR-002) | 5.1 | Standard behavior, not explicitly mandated by OWNER but inferred from any authenticated back-office. |
| A2 | Admin offer list has simple status filter + title search (FR-012) | 5.2 | Useful for daily administration; not explicitly mandated. SHOULD priority. |
| A3 | Public offer list has a simple title text search (FR-050) | 5.6 | Useful for V1 usability; not explicitly mandated. COULD priority. |
| A4 | A minimal home page is provided (FR-060) | 5.7 | Improves UX; not strictly required. SHOULD priority. |
| A5 | Tie-breaker in public sort is creation timestamp descending (BR-061) | 6.5 | Deterministic ordering is reasonable; specific tie-breaker is implementation detail. |
| A6 | Empty public offer list displays an informational message (FR-040-EMPTY) | 12.4 | Standard UX practice; specific wording can be refined. |
| A7 | Empty administrative offer list displays a CTA (FR-010-EMPTY) | 12.4 | Standard UX practice. |
| A8 | Public interface follows reasonable accessibility practices (NFR-030) | 13.4 | Reasonable for a public portal; specific WCAG conformance level not mandated. |

All assumptions are presented for OWNER review. Per S5 §5, the agent must NOT silently promote an ASSUMPTION to CONFIRMED. OWNER may confirm, correct, or drop any of these during the approval round.

---

## 16. Open Questions

**BLOCKING open questions: 0.**

No open question is materially blocking S5 closure. The requirements below can be refined by OWNER before approval, but no question requires an OWNER decision before the baseline can be considered for approval.

**Non-blocking questions for OWNER consideration during approval:**

| ID | Question | Why it's raised | Default if OWNER does not answer |
|---|---|---|---|
| OQ-1 | Should the V1 home page (FR-060) be a dedicated page, or should the public offer list serve directly as the entry point? | A4 assumes a home page improves UX, but it's not strictly required. | Default: provide a minimal home page with a CTA to view offers. |
| OQ-2 | Should the public simple text search (FR-050) be included in V1 or deferred? | A3 — COULD priority. Adds a small amount of complexity. | Default: include in V1 as a simple title search. |
| OQ-3 | Should the admin offer list filter (FR-012) include status filter, title search, or both? | A2 — SHOULD priority. | Default: include both (status filter + title search). |
| OQ-4 | For the unknown-company display (BR-033), should the V1 omit the company line OR display "Entreprise non communiquée"? | OWNER S5 §11 allows both. UX choice. | Default: omit the line when absent (cleaner card); display "Entreprise non communiquée" only on the detail page. |
| OQ-5 | Should the V1 include a "duplicate offer" action (create a new offer by copying an existing one)? | Not mentioned by OWNER; could be useful for similar offers. | Default: NOT in V1 (avoid scope creep; defer to a later version). |
| OQ-6 | Should the V1 include a "preview" mode (ADMIN previews the public detail page before publishing)? | Not mentioned by OWNER; useful but not critical. | Default: NOT in V1 (defer). |

These are non-blocking. OWNER can answer them during the approval round or leave the defaults; in either case, S5 can close.

---

## 17. Deferred Requirements

The following items are explicitly DEFERRED (out of V1 delivery scope, will be considered in a future version). Each is grounded in an OWNER decision or an explicit V1 exclusion.

| ID | Deferred item | Source | Rationale |
|---|---|---|---|
| DR-010 | Specific format of the offer unique id (UUID, sequential, slug-based, etc.) | S5 boundary (technical decision) | S6 territory. |
| DR-020 | Specific email validation format | DR-020 in Section 8 | S5 specifies "valid email format"; specific regex/format is S6. |
| DR-021 | Specific URL validation format | DR-021 in Section 8 | Same as DR-020. |
| DR-030 | Full audit log (who/what/when) | NFR-050 | V1 maintains minimal audit (created_at, updated_at, status_changed_at). Full audit deferred. |
| DR-040 | Full audit log implementation | NFR-050 | Same as DR-030. |
| DR-050 | ADMIN account management UI (create, list, deactivate, password reset) | Section 8.2 | V1 bootstraps initial ADMIN via Fantomas or deployment; no self-service UI. |
| DR-051 | Formal SUPER_ADMIN role | Charter §7; Section 8.3 | Charter mentions "future SUPER_ADMIN"; V1 uses ADMIN + Fantomas only. |
| DR-060 | Physical deletion of offers | FR-034, BR-024 | V1 prefers archiving; no destructive deletion. |
| DR-070 | Republication from ARCHIVED status | BR-020 (forbidden transitions) | V1 treats ARCHIVED as terminal. A future version may allow ARCHIVED → DRAFT. |
| DR-071 | Automated expiration (auto-archive or auto-suspend on expiration_date) | BR-071 | V1 has no scheduled work (S0 §23); ADMIN archives manually. |
| DR-080 | "Duplicate offer" action | OQ-5 | Not in V1. |
| DR-090 | Preview mode before publishing | OQ-6 | Not in V1. |
| DR-100 | Multi-criteria advanced search | Charter §8 (no complex search); OWNER S5 §12 | V1 has at most simple title search. |
| DR-110 | Public API | Charter §8 | V1 has no public product API. |
| DR-120 | Notifications | Charter §8 | V1 has no notifications. |
| DR-130 | Multilingual UI | Charter §8 | V1 is French only. |
| DR-140 | Multi-tenant | Charter §8 | V1 is mono-tenant. |
| DR-150 | Complex RBAC for ordinary users | Charter §7 | V1 uses a single ADMIN role. |
| DR-160 | GDPR detailed constraints | Charter §10 (D1) | Deferred to S6. |
| DR-170 | Data residency constraints | Charter §10 (D3) | Deferred to S6. |

---

## 18. Exclusions (V1)

The following are explicitly excluded from V1 (Charter §8 + OWNER S5 §18):

- Company logos
- "Apply" button / in-app application submission
- Social sharing (Facebook, WhatsApp, LinkedIn, generic share)
- Candidate accounts
- CV / resume upload
- Favorites / bookmarks
- Messaging (between candidates and administration, or between any users)
- Internal application (candidates applying through JOURDAIN EMPLOI)
- Recruiter space (any third-party recruiter features)
- Payment (any payment functionality)
- AI matching (between offers and candidates, or any AI-driven recommendation)
- Mobile application (native iOS/Android)
- Notifications (email, push, SMS)
- Automatic import of offers
- Public API (internal Next.js endpoints are an S6 implementation detail, NOT a public product API)
- Multilingual support
- Multi-tenant
- Complex RBAC for ordinary users (single ADMIN role in V1)
- Automated expiration / scheduled status changes (S0 §23 — zero scheduled work)
- Physical deletion of offers (archiving is preferred)

These exclusions are CONFIRMED by Charter §8 and OWNER S5 §18. They are not "future scope that may slip in" — they are explicit boundaries. Any future re-introduction requires OWNER approval and a new AISE scope decision.

---

## 19. S6 Technical Decision Inputs

S5 identifies the following technical decisions to be made in S6. S5 does NOT decide them — it hands them off.

| ID | S6 Decision Input | S5 Source |
|---|---|---|
| TD-001 | Web framework confirmation (Next.js App Router) | Charter §10 — OWNER preference |
| TD-002 | Database confirmation (PostgreSQL on Neon) | Charter §10 — OWNER preference |
| TD-003 | Hosting confirmation (Vercel) | Charter §10 — OWNER preference |
| TD-004 | ORM choice (Drizzle or Prisma) | Charter §10 — OWNER-envisaged |
| TD-005 | Validation library (Zod or equivalent) | Charter §10 — OWNER-envisaged |
| TD-006 | Form library (React Hook Form or equivalent) | Charter §10 — OWNER-envisaged |
| TD-007 | Data-fetching library (TanStack Query or equivalent) — only if materially useful | Charter §10 — OWNER-envisaged |
| TD-008 | UI styling (Tailwind CSS + shadcn/ui) | Charter §10 — OWNER-envisaged |
| TD-009 | Description editor choice (rich-text or markdown) | BR-034 (preserve formatting) — technical choice is S6 |
| TD-010 | Authentication mechanism for ADMIN (session, JWT, etc.) | FR-001, NFR-012 — mechanism is S6 |
| TD-011 | Password hashing mechanism | NFR-010 — mechanism is S6 |
| TD-012 | Fantomas authentication and authorization architecture | Charter §7; PERM-004; AISE §14, §21 — architecture is S6/S7 |
| TD-013 | Database schema (tables, columns, indexes, foreign keys) | Section 8 — logical data only; physical schema is S6 |
| TD-014 | Internal API endpoint design (NOT a public API) | INT-001 — implementation detail of S6 |
| TD-015 | Testing strategy and tools | Charter §10 — "outils de tests adaptés" |
| TD-016 | Deployment topology (Preview vs Production environments) | Charter §10 — Production separated from Preview |
| TD-017 | Caching strategy (if any) | NFR-001 (performance is SHOULD, not MUST) — S6 territory |
| TD-018 | GDPR detailed constraints (data minimization, retention rules, consent flows if any) | Charter §10 — Deferred Decision D1 |
| TD-019 | Data residency / hosting region constraints | Charter §10 — Deferred Decision D3 |
| TD-020 | Bootstrap mechanism for initial ADMIN and Fantomas credentials | Section 8.3; PERM-004; S0 §25 — S6/S7 decision |

---

## 20. Approval / Baseline Status

| Field | Value |
|---|---|
| Document status | DRAFT — PENDING OWNER APPROVAL |
| Charter reference | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Charter approval date | 2026-09-13 |
| S5 draft date | 2026-09-14 |
| S5 OWNER approval | PENDING |
| S5 closure (S5 CLOSED / PASS) | PENDING — requires OWNER approval |
| Next recommended component | S6 — Technical Specification |

Per AISE S5 §25, the baseline is NOT valid until OWNER explicitly approves it. OWNER's absence of objection is NOT approval — explicit acknowledgment is required.

---

## 21. Requirement Quality Gate Self-Check (per S5 §31)

| Check | Result |
|---|---|
| Ambiguous critical requirements | 0 (every MUST requirement has ACCEPTANCE criteria) |
| Contradictory unresolved critical requirements | 0 (no contradictions identified; BR-020 + transitions are consistent) |
| Blocking product open questions | 0 (OQ-1 through OQ-6 are non-blocking; defaults specified) |
| Critical requirements without acceptance | 0 (all FR-/BR-/PERM-/NFR-MUST have acceptance or testable rule) |
| Orphan MUST requirements | 0 (every requirement traces to Charter §7 or §8 or OWNER S5 decision) |
| Uncovered MUST Charter objectives | 0 (Charter §7 admin lifecycle fully covered by FR-020 through FR-034; Charter §7 public fully covered by FR-040 through FR-042; Charter §7 Fantomas covered by Section 8.3 + PERM-004) |
| Technical implementation as requirement | 0 (no library, framework, schema, or API endpoint chosen — all deferred to S6 via TD-001 through TD-020) |

**Verdict: REQUIREMENTS QUALITY GATE: PASS.**

The baseline is ready for OWNER review.

---

## 22. Critical E2E Scenario (per OWNER S5 §20)

The critical end-to-end functional scenario that V1 must support:

```
ADMIN
  -> Login (FR-001)
  -> Create offer (FR-020) with title + description + optional fields
  -> Save as DRAFT (FR-022) — offer NOT visible publicly
  -> Find offer in admin list (FR-010) — status DRAFT visible
  -> Edit (FR-021) — modify some fields
  -> Save — offer still DRAFT
  -> Publish (FR-030) — offer transitions to PUBLISHED

PUBLIC
  -> Open public offer list (FR-040) — offer is visible as a card
  -> Click "Voir l'offre" (FR-041) — offer detail displays correctly
  -> Verify all entered fields are displayed per Section 10.2
  -> Verify no "Apply" button, no logo, no share (Charter §8)

ADMIN
  -> Suspend offer (FR-031) — offer transitions to SUSPENDED

PUBLIC
  -> Public offer list — offer no longer visible
  -> Direct URL to offer detail — returns not-found (FR-042)

ADMIN
  -> Republish offer (FR-032) — offer transitions back to PUBLISHED

PUBLIC
  -> Public offer list — offer is visible again

ADMIN
  -> Archive offer (FR-033) — offer transitions to ARCHIVED

PUBLIC
  -> Public offer list — offer no longer visible
  -> Direct URL — returns not-found

ADMIN
  -> Administrative offer list — offer is still visible with status ARCHIVED
  -> Offer content is preserved (FR-034, BR-024)
```

This scenario is the minimum verifiable functional demonstration of V1. It must work end-to-end before V1 can be considered delivered.
