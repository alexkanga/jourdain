# PRODUCT REQUIREMENTS — JOURDAIN EMPLOI V1

**Document type:** AISE S5 — Product Requirements / Cahier des Charges fonctionnel
**Status:** OWNER APPROVED — S5 CLOSED / PASS
**Date:** 2026-09-14 (initial draft), 2026-09-14 (revised after OWNER revision decisions §1–§23), 2026-09-14 (OWNER APPROVED)
**Project:** JOURDAIN EMPLOI V1
**Canonical repository:** `github.com/alexkanga/jourdain`
**Canonical branch:** `main`
**Initial draft HEAD:** `25c72046a0b9fbb7261d41d95cdcaa5333f61e07`
**Revised draft HEAD (pre-approval):** `9ec4a08b467a4a3909fa9bc0a72bf02e4c682418`
**Charter-approved HEAD (source of truth):** `fa377c1feba5a111c07e0f40d094245fdadc727d`

---

## 1. Document Status

| Field | Value |
|---|---|
| Project | JOURDAIN EMPLOI |
| AISE Stage | S5 — Product Requirements |
| Status | OWNER APPROVED — S5 CLOSED / PASS |
| Source Charter | `docs/planning/PROJECT_CHARTER.md` — OWNER APPROVED 2026-09-13 at `fa377c1` |
| Charter-approved canonical HEAD | `fa377c1feba5a111c07e0f40d094245fdadc727d` |
| Initial S5 draft HEAD | `25c72046a0b9fbb7261d41d95cdcaa5333f61e07` |
| Revised S5 draft HEAD (pre-approval) | `9ec4a08b467a4a3909fa9bc0a72bf02e4c682418` |
| S5 OWNER approval date | 2026-09-14 |
| S5 revision | Applies OWNER decisions §1–§23 to resolve all ASSUMPTIONS and OPEN QUESTIONS, reclassify DEFERRED items, and correct the date model |

This document is governed by AISE protocol S5 (`docs/engineering/AISE_PRODUCT_REQUIREMENTS.md`). It defines **what the product must do** — not how (S6) and not why (S4).

Every material requirement carries one of four epistemic states (S5 §5):

- **CONFIRMED** — supported by OWNER approval or authoritative project evidence
- **ASSUMPTION** — plausible and consistent with OWNER intent but not explicitly approved; labeled for OWNER review
- **OPEN** — materially unresolved, decision-relevant; cannot be silently converted to a requirement
- **DEFERRED** — explicitly outside current delivery scope by OWNER decision; will be re-examined in a future version or at S6/S7

Core rules (S5 §5):
- Never silently promote ASSUMPTION → CONFIRMED.
- Never convert OPEN → requirement without evidence.

In this revised baseline, every reclassification from ASSUMPTION / OPEN / DEFERRED to CONFIRMED or OUT OF SCOPE V1 is grounded in an explicit OWNER revision decision (§1–§23) and is referenced in the relevant section.

---

## 2. Source Charter

The source of truth for this requirements document is the OWNER-APPROVED PROJECT CHARTER (`docs/planning/PROJECT_CHARTER.md`), frozen at canonical commit `fa377c1` on 2026-09-13.

All S5 requirements must trace to one of:
- A Charter CONFIRMED item
- A Charter DEFERRED DECISION (only if material for S5 functional behavior)
- An explicit OWNER decision provided during S5 elicitation (revision decisions §1–§23 below)
- An authoritative source (e.g., a regulation, an OWNER-provided reference)

No requirement may silently expand an S4 out-of-scope area.

---

## 3. Product Scope Summary

JOURDAIN EMPLOI V1 is a simple, mono-tenant web portal for **publishing and consulting job offers**. The administration records and manages offers through an authenticated back-office with a single ordinary role (ADMIN). The public consults published offers without authentication. The V1 is intentionally narrow: it is NOT a recruitment platform.

The public root URL serves directly the published offers list — no separate marketing home page (OWNER §3).

The Fantomas system principal (AISE §14 / §21) is mandated as a special break-glass principal distinct from ordinary ADMIN users.

For full scope, see Charter Sections 7 (High-Level Scope) and 8 (Out of Scope). This S5 document decomposes the Charter scope into testable requirements.

---

## 4. Actors / Roles

| Actor / Role | Description | Authentication | Source |
|---|---|---|---|
| **PUBLIC visitor** | Any visitor who consults published offers without authentication | None | Charter §3, §5; OWNER §3 |
| **ADMIN** | Ordinary administration role; manages the offer lifecycle | Authenticated | Charter §3, §4 (OWNER revision); OWNER §2 |
| **FANTOMAS** | Special system principal; highest privilege; bootstrap / recovery / break-glass | Authenticated (break-glass) | Charter §7; AISE S0 §14, §21; OWNER §20 |
| **SYSTEM** | Automated system actions (timestamps, status updates) | N/A (internal) | Inferred from functional behavior |

The V1 ordinary interface uses a single ADMIN role. No complex RBAC for ordinary users (OWNER §4, §15). Fantomas is distinct and is not exposed as a regular role in the day-to-day interface (OWNER §20).

---

## 5. Functional Requirements

Functional requirements are grouped by capability area.

### 5.1 Authentication & Session (ADMIN)

```
ID:            FR-001
TITLE:         Admin login
REQUIREMENT:   The system shall allow an ADMIN user to authenticate with a login identifier and a password to access the administration back-office.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Administration back-office: Authentication); OWNER §1, §2
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
SOURCE:        OWNER revision decision §2 (CONFIRMED)
STATUS:        CONFIRMED  [former ASSUMPTION A1 — resolved by OWNER §2]
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

```
ID:            FR-004
TITLE:         No public registration or self-service account
REQUIREMENT:   The system shall NOT provide public registration, candidate account creation, or self-service account management in V1. Account creation is administrative only (bootstrap by Fantomas or by deployment).
ACTOR:         PUBLIC, SYSTEM
SOURCE:        Charter §8 (candidate accounts excluded); OWNER revision decision §2
STATUS:        CONFIRMED  [former implicit — explicit per OWNER §2]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN a visitor is on the public interface
               WHEN the visitor attempts to register or create an account
               THEN the system provides no registration mechanism
               AND no self-service account management is available
```

### 5.2 Offer List (ADMIN)

```
ID:            FR-010
TITLE:         Admin offer list view
REQUIREMENT:   The system shall display to an authenticated ADMIN a list of all offers regardless of status, with sufficient information to identify and act on each offer: at minimum title, status, and a way to access the offer's edit view.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Consultation of the administrative list of offers); OWNER §1, §4
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN at least one offer exists in any status (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED)
               WHEN the ADMIN opens the offer list
               THEN the system displays each offer with at minimum: title, status, and an action to open the edit view
               AND the list is navigable when the number of offers exceeds a single page
               AND a "New offer" action is available to create a new offer
DEPENDENCIES:  FR-001
```

```
ID:            FR-011
TITLE:         Admin offer list status visibility
REQUIREMENT:   The administrative offer list shall clearly display the current status of each offer (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED) so the ADMIN can immediately tell which offers are visible publicly.
ACTOR:         ADMIN
SOURCE:        Charter §7; OWNER §4, §16
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in status X (where X is one of the four lifecycle statuses)
               WHEN the ADMIN views the offer list
               THEN the status X is visibly associated with that offer
DEPENDENCIES:  FR-010, BR-020 (lifecycle states)
```

```
ID:            FR-012
TITLE:         Admin offer list status filter
REQUIREMENT:   The administrative offer list shall provide a simple filter by status. The ADMIN can narrow the list to offers in a specific status.
ACTOR:         ADMIN
SOURCE:        OWNER revision decision §4 (CONFIRMED status filter)
STATUS:        CONFIRMED  [former ASSUMPTION A2 — partially resolved by OWNER §4]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is on the offer list page
               WHEN the ADMIN selects a status filter
               THEN the list is narrowed to offers matching the selected status
               AND clearing the filter restores the full list
```

```
ID:            FR-013
TITLE:         Admin offer list title search
REQUIREMENT:   The administrative offer list MAY provide a simple text search on offer title to improve usability when the offer count grows. A complex admin search engine is excluded (Charter §8; OWNER §4).
ACTOR:         ADMIN
SOURCE:        OWNER revision decision §4 (SHOULD if it improves usage)
STATUS:        CONFIRMED  [former ASSUMPTION A2 — partially resolved by OWNER §4]
PRIORITY:      SHOULD
ACCEPTANCE:    GIVEN the ADMIN is on the offer list page
               WHEN the ADMIN enters a search term
               THEN the list is narrowed to offers whose title contains the term (case-insensitive)
               AND clearing the search restores the full list
NOTE:          SHOULD priority. If S6 implementation reveals this adds disproportionate complexity, it can be descoped to V2 with OWNER approval.
```

### 5.3 Offer Creation & Editing (ADMIN)

```
ID:            FR-020
TITLE:         New offer creation
REQUIREMENT:   The system shall allow an ADMIN to create a new offer by entering values into the offer form (see Section 8 — Offer form fields) and saving it in DRAFT status.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Creation of an offer; Recording of an offer); OWNER §1, §4, §14, §18
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is authenticated
               WHEN the ADMIN opens the "New offer" form and enters at minimum the required fields (title, description)
               AND saves the offer
               THEN the system persists a new offer in DRAFT status
               AND the new offer is visible in the administrative offer list
               AND the new offer is NOT visible in the public offer list
DEPENDENCIES:  FR-001, FR-010, Section 8, BR-030 (required fields), BR-031 (optional fields), BR-040 (save ≠ publish)
```

```
ID:            FR-021
TITLE:         Offer editing
REQUIREMENT:   The system shall allow an ADMIN to edit the values of any existing offer (regardless of status) and save the changes without forcing a status change.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Modification of an offer); OWNER §1, §19
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
TITLE:         Save without publishing (DRAFT preservation)
REQUIREMENT:   The system shall allow an ADMIN to save an offer in DRAFT status without publishing it. A DRAFT offer shall never become public simply because it has been saved.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Recording of an offer); OWNER §18 (save ≠ publish)
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is editing a new or existing DRAFT offer
               WHEN the ADMIN saves the offer
               THEN the offer is persisted and remains in DRAFT status
               AND the offer is NOT visible in the public offer list
DEPENDENCIES:  FR-020, FR-021, BR-020, BR-040
```

```
ID:            FR-023
TITLE:         Required-field validation on save
REQUIREMENT:   The system shall reject an attempt to save an offer when one or more required fields are missing or empty, and shall indicate which fields are missing.
ACTOR:         ADMIN, SYSTEM
SOURCE:        Charter §7 (data rules: title required, description required); OWNER §4, §14
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is on the offer form
               WHEN the ADMIN attempts to save with title empty OR description empty
               THEN the system rejects the save and indicates which required field(s) are missing
               AND no offer is persisted (or, in the case of editing an existing offer, the existing offer is not modified)
DEPENDENCIES:  BR-030
```

```
ID:            FR-024
TITLE:         Format validation on optional URL and email fields
REQUIREMENT:   When the ADMIN enters a value in application_email, application_url, or source_url, the system shall validate that the value has the expected format (valid email for application_email, valid URL for application_url and source_url). Invalid values are rejected at save time with field-specific feedback. The specific validation mechanism is an S6/S10 technical decision.
ACTOR:         ADMIN, SYSTEM
SOURCE:        OWNER revision decision §13 (CONFIRMED)
STATUS:        CONFIRMED  [former DR-020/DR-021 — partially resolved by OWNER §13; mechanism remains S6]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN the ADMIN is on the offer form
               WHEN the ADMIN enters an invalid email in application_email OR an invalid URL in application_url or source_url
               AND attempts to save
               THEN the system rejects the save and indicates which field is invalid
               AND the rest of the form values are preserved
               AND the offer is not persisted (or not modified)
DEPENDENCIES:  BR-030, BR-031
```

```
ID:            FR-025
TITLE:         Modification of a PUBLISHED offer keeps it PUBLISHED
REQUIREMENT:   When an ADMIN modifies a PUBLISHED offer and saves, the offer shall remain in PUBLISHED status unless the ADMIN explicitly chooses to suspend or archive it. No editorial revalidation workflow is triggered in V1.
ACTOR:         ADMIN, SYSTEM
SOURCE:        OWNER revision decision §19 (CONFIRMED)
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer is in PUBLISHED status
               WHEN the ADMIN edits one or more fields and saves
               THEN the offer remains in PUBLISHED status
               AND the modifications are visible on the public detail page immediately
               AND no revalidation / re-approval workflow is triggered
DEPENDENCIES:  FR-021, BR-020
```

### 5.4 Publication & Lifecycle Actions (ADMIN)

```
ID:            FR-030
TITLE:         Publish offer
REQUIREMENT:   The system shall allow an ADMIN to explicitly publish a DRAFT offer. Publication is a distinct action from saving. On first publication, the system records the published_at timestamp automatically (used for public sorting). On subsequent republications (SUSPENDED → PUBLISHED), published_at is preserved.
ACTOR:         ADMIN, SYSTEM
SOURCE:        Charter §7 (Publication of an offer); OWNER §12, §18
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in DRAFT status
               WHEN the ADMIN triggers the publish action
               THEN the offer transitions to PUBLISHED status
               AND the offer becomes visible in the public offer list
               AND the offer's detail page becomes accessible to the public
               AND the system records the published_at timestamp (current timestamp) for use in public sorting
DEPENDENCIES:  BR-020, BR-021, BR-040, BR-050, FR-040
```

```
ID:            FR-031
TITLE:         Suspend published offer
REQUIREMENT:   The system shall allow an ADMIN to explicitly suspend a PUBLISHED offer. Suspension removes the offer from the public list and the public detail view, without changing the offer's content. The published_at timestamp is preserved.
ACTOR:         ADMIN
SOURCE:        Charter §7 (Suspension of a published offer); OWNER §1, §16
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in PUBLISHED status
               WHEN the ADMIN triggers the suspend action
               THEN the offer transitions to SUSPENDED status
               AND the offer is no longer visible in the public offer list
               AND the public detail URL for that offer returns not-found
               AND the offer's content is preserved in the database
DEPENDENCIES:  BR-020, BR-023, FR-050
```

```
ID:            FR-032
TITLE:         Republish suspended offer
REQUIREMENT:   The system shall allow an ADMIN to republish a SUSPENDED offer, returning it to PUBLISHED status and restoring public visibility. The published_at timestamp is preserved (not overwritten).
ACTOR:         ADMIN
SOURCE:        OWNER §16 (SUSPENDUE → PUBLIÉE allowed); Charter §7
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in SUSPENDED status
               WHEN the ADMIN triggers the republish action
               THEN the offer transitions back to PUBLISHED status
               AND the offer is visible again in the public offer list
               AND the public detail URL displays the offer content again
               AND the published_at timestamp is preserved
DEPENDENCIES:  BR-020, BR-023, FR-030
```

```
ID:            FR-033
TITLE:         Archive offer
REQUIREMENT:   The system shall allow an ADMIN to archive an offer. Archiving preserves the offer in the database but removes it from the public active list. Archived offers remain accessible administratively. ARCHIVED is a terminal state in V1 (no republication from ARCHIVED).
ACTOR:         ADMIN
SOURCE:        Charter §7 (Archiving of an offer); OWNER §1, §15, §16
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in any active status (DRAFT, PUBLISHED, SUSPENDED)
               WHEN the ADMIN triggers the archive action
               THEN the offer transitions to ARCHIVED status
               AND the offer is no longer visible in the public offer list
               AND the public detail URL returns not-found
               AND the offer remains visible in the administrative offer list (with ARCHIVED status)
               AND the offer's content is preserved in the database
               AND no V1 action can transition the offer out of ARCHIVED status
DEPENDENCIES:  BR-020, BR-024, FR-010
```

```
ID:            FR-034
TITLE:         No automatic deletion of archived offers
REQUIREMENT:   The system shall NOT automatically delete archived offers in V1. Archived offers remain in the database indefinitely. Physical deletion of any offer is OUT OF SCOPE V1 (see Section 17 — Out of Scope).
ACTOR:         SYSTEM
SOURCE:        Charter §7; OWNER §15, §17
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer is in ARCHIVED status
               WHEN time passes (any duration)
               THEN the offer remains in the database
               AND no automatic deletion occurs
               AND no automatic status change occurs
DEPENDENCIES:  FR-033
```

```
ID:            FR-035
TITLE:         No automated expiration
REQUIREMENT:   The system shall NOT automatically change an offer's status when the application_deadline (if set) passes. A passed application_deadline does NOT trigger suspension or archiving. ADMIN action remains required to suspend or archive. This is consistent with AISE S0 §23 (zero scheduled work).
ACTOR:         SYSTEM
SOURCE:        OWNER revision decision §12 (no automatic expiration in V1); S0 §23
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN a PUBLISHED offer has an application_deadline in the past
               WHEN time passes beyond the application_deadline
               THEN the offer remains in PUBLISHED status
               AND the offer remains visible in the public offer list
               AND no automatic transition to SUSPENDED or ARCHIVED occurs
               AND the ADMIN remains responsible for archiving when appropriate
DEPENDENCIES:  BR-020
```

### 5.5 Public Browsing

```
ID:            FR-040
TITLE:         Public offer list at root URL
REQUIREMENT:   The system shall display to any visitor (no authentication) the list of PUBLISHED offers at the public root URL. There is no separate marketing home page. Each published offer is presented as a card per Section 10. The list is ordered by published_at descending (most recently published on JOURDAIN EMPLOI first).
ACTOR:         PUBLIC
SOURCE:        Charter §7; OWNER §3 (root = offer list), §6 (default sort), §10
STATUS:        CONFIRMED  [former FR-040 + FR-060 merged per OWNER §3]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN at least one offer is in PUBLISHED status
               WHEN a visitor opens the public root URL
               THEN the system displays each PUBLISHED offer as a card with the fields specified in Section 10
               AND the offers are ordered by published_at descending (most recently published first)
               AND offers in other statuses (DRAFT, SUSPENDED, ARCHIVED) are NOT displayed
               AND the list is navigable when the number of offers exceeds a single page
DEPENDENCIES:  BR-020, BR-025, BR-060, Section 10
```

```
ID:            FR-041
TITLE:         Public offer detail
REQUIREMENT:   The system shall display to any visitor (no authentication) the full detail of a PUBLISHED offer, including all available fields per Section 10.
ACTOR:         PUBLIC
SOURCE:        Charter §7 (Consultation of the full detail of an offer); OWNER §2, §10
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer is in PUBLISHED status
               WHEN a visitor opens the offer's public detail URL
               THEN the system displays the offer with the fields specified in Section 10 (Detail)
               AND the visitor can read the full description (formatting preserved)
               AND the visitor can read the application modalities when they are available
               AND no administration controls are visible to the public
DEPENDENCIES:  FR-040, Section 10, BR-034
```

```
ID:            FR-042
TITLE:         Public detail for non-published offer returns not-found
REQUIREMENT:   The system shall NOT display offer content on the public detail URL when the offer is not in PUBLISHED status. The system shall NOT distinguish between "offer does not exist" and "offer exists but is not published" — both return the same not-found behavior.
ACTOR:         PUBLIC, SYSTEM
SOURCE:        Charter §7 (public list restricted to published offers); inferred from FR-040
STATUS:        CONFIRMED
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer exists in DRAFT, SUSPENDED, or ARCHIVED status
               WHEN a visitor attempts to access that offer's public detail URL
               THEN the system returns a not-found response (no offer content displayed)
               AND no information about the offer's existence or status is leaked to the public
DEPENDENCIES:  FR-041, BR-025
```

### 5.6 Public Search & Filters

```
ID:            FR-050
TITLE:         Public simple text search
REQUIREMENT:   The public offer list MAY provide a simple text search across title, company, and location. A complex search engine is excluded (Charter §8; OWNER §5). The list remains usable without search.
ACTOR:         PUBLIC
SOURCE:        OWNER revision decision §5 (CONFIRMED SHOULD; search on title + company + location)
STATUS:        CONFIRMED  [former ASSUMPTION A3 — resolved by OWNER §5]
PRIORITY:      SHOULD
ACCEPTANCE:    GIVEN the public offer list is displayed
               WHEN the visitor enters a search term
               THEN the list is narrowed to offers whose title, company, or location contains the term (case-insensitive)
               AND clearing the search restores the full list
               AND the list remains usable and complete when no search term is entered
NOTE:          SHOULD priority. If S6 reveals disproportionate complexity, can be descoped to V2 with OWNER approval.
```

### 5.7 Empty States

```
ID:            FR-060
TITLE:         Empty public offer list state
REQUIREMENT:   When no offer is in PUBLISHED status (or no offer exists at all), the public offer list shall display a simple, comprehensible empty-state message such as "Aucune offre disponible actuellement". No illustration or complex feature is required.
ACTOR:         PUBLIC
SOURCE:        OWNER revision decision §7 (CONFIRMED)
STATUS:        CONFIRMED  [former ASSUMPTION A6 — resolved by OWNER §7]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN no offer is in PUBLISHED status
               WHEN a visitor opens the public root URL
               THEN the system displays a simple empty-state message
               AND no error is displayed
               AND no complex illustration or feature is required
```

```
ID:            FR-061
TITLE:         Empty administrative offer list state
REQUIREMENT:   When no offer exists at all, the administrative offer list shall display a simple empty-state message such as "Aucune offre créée" with a clear call-to-action to create a new offer. No illustration or complex feature is required.
ACTOR:         ADMIN
SOURCE:        OWNER revision decision §7 (CONFIRMED)
STATUS:        CONFIRMED  [former ASSUMPTION A7 — resolved by OWNER §7]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN no offer exists
               WHEN the ADMIN opens the administrative offer list
               THEN the system displays a simple empty-state message
               AND a "New offer" call-to-action is available
               AND no error is displayed
DEPENDENCIES:  FR-010
```

---

## 6. Business Rules

### 6.1 Offer Lifecycle States

```
ID:            BR-020
TITLE:         Offer lifecycle states
RULE:          An offer has exactly one status at any time. The set of statuses for V1 is exactly: DRAFT, PUBLISHED, SUSPENDED, ARCHIVED. No other status exists in V1.
SOURCE:        Charter §7; OWNER §16
STATUS:        CONFIRMED
PRIORITY:      MUST
```

| Status | Meaning | Public visibility | ADMIN actions allowed | Allowed transitions |
|---|---|---|---|---|
| **DRAFT** | Offer saved but not yet published | Not visible publicly | Edit, publish, archive | → PUBLISHED, → ARCHIVED |
| **PUBLISHED** | Offer actively visible to the public | Visible in public list + detail | Edit (stays PUBLISHED per FR-025), suspend, archive | → SUSPENDED, → ARCHIVED |
| **SUSPENDED** | Offer temporarily removed from public view | Not visible publicly; public detail URL returns not-found | Edit, republish, archive | → PUBLISHED, → ARCHIVED |
| **ARCHIVED** | Offer permanently removed from public active view but retained in database | Not visible publicly; public detail URL returns not-found | View (read-only) | **Terminal in V1 — no transition out** |

**Forbidden transitions in V1:**
- DRAFT → SUSPENDED (an offer must be published at least once before it can be suspended)
- ARCHIVED → any other status (ARCHIVED is terminal in V1 per OWNER §16)

```
ID:            BR-021
TITLE:         Publication is explicit (save ≠ publish)
RULE:          An offer is PUBLISHED only by an explicit ADMIN action (publish). Saving an offer (FR-022) does NOT publish it. The system shall NOT auto-publish offers. A DRAFT offer shall never become public simply because it has been saved.
SOURCE:        OWNER §18 (CONFIRMED)
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-022
TITLE:         published_at timestamp semantics
RULE:          The system records a published_at timestamp when an offer transitions to PUBLISHED for the first time. On subsequent republications (SUSPENDED → PUBLISHED), published_at is preserved (not overwritten). published_at is system-generated and reflects the moment the offer became visible on JOURDAIN EMPLOI. The ADMIN cannot edit published_at directly. published_at is used as the default public sort key (BR-060).
SOURCE:        Charter §7; OWNER §12 (CONFIRMED)
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-023
TITLE:         Suspension preserves content
RULE:          Suspending an offer does NOT modify the offer's content fields. Only the status changes. The offer's published_at timestamp is preserved.
SOURCE:        OWNER §16 (SUSPENDUE: conservée, modifiable, peut être republiée); inferred from FR-031
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-024
TITLE:         Archiving preserves content; ARCHIVED is terminal in V1
RULE:          Archiving an offer does NOT modify the offer's content fields. Only the status changes. The offer's published_at timestamp is preserved. ARCHIVED is a terminal state in V1: no V1 action can transition an offer out of ARCHIVED. The offer remains in the database indefinitely (per FR-034).
SOURCE:        Charter §7; OWNER §15, §16 (ARCHIVÉE: état terminal de la V1, pas de republication directe en V1)
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

```
ID:            BR-026
TITLE:         No automatic status transitions from dates
RULE:          The system shall NOT automatically change an offer's status based on any date (source_publication_date, application_deadline, published_at). All status transitions require an explicit ADMIN action. This is consistent with AISE S0 §23 (zero scheduled work).
SOURCE:        OWNER §12 (CONFIRMED); S0 §23
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 6.2 Field Rules

```
ID:            BR-030
TITLE:         Required fields
RULE:          The required fields for an offer are exactly: title, description. All other fields listed in Section 8 are optional. An offer cannot be saved without both required fields present and non-empty (after whitespace trimming).
SOURCE:        Charter §7 (data rules); OWNER §4, §14
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-031
TITLE:         Optional fields do not block save or publish
RULE:          An absent optional field shall NOT prevent saving (FR-022) or publishing (FR-030) an offer. The system shall NOT default an absent optional field to a placeholder value such as "Non renseigné" in the public display — absent optional fields are omitted from display rather than displayed as placeholders.
SOURCE:        Charter §7 (data rules); OWNER §4, §10
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-032
TITLE:         Never invent absent information
RULE:          The system shall NOT fabricate, infer, or auto-fill any offer field value that was not provided by the ADMIN. The system shall NOT generate values such as "Une importante entreprise" for an absent company name.
SOURCE:        Charter §7 (data rules); OWNER §9, §11
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-033
TITLE:         Unknown company presentation
RULE:          When the company field is absent:
           - On the public offer CARD: the company line is omitted (no placeholder).
           - On the public offer DETAIL page: the system displays the neutral label "Entreprise non communiquée" if an explicit indication improves comprehension.
           The product shall NEVER fabricate a company name.
SOURCE:        OWNER revision decision §9 (CONFIRMED)
STATUS:        CONFIRMED  [former OQ-4 — resolved by OWNER §9]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN an offer has no company value
               WHEN the offer is displayed as a public card
               THEN the company line is omitted (no placeholder, no fabricated name)
               AND WHEN the offer is displayed on the public detail page
               THEN the company line reads "Entreprise non communiquée" (or equivalent neutral label)
               AND no fabricated company name ever appears
DEPENDENCIES:  BR-032
```

```
ID:            BR-034
TITLE:         Description formatting
RULE:          The description field shall preserve reasonable professional formatting entered by the ADMIN: paragraphs, lists, headings (if applicable), and links (if applicable). The system shall NOT corrupt or flatten the formatting on save or display. The technical editor choice is deferred to S6 (TD-009).
SOURCE:        OWNER §5
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
SOURCE:        Charter §8 (Apply button excluded; candidate accounts excluded; CV excluded; internal application excluded); OWNER §6
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
TITLE:         Source is optional; no automated import
RULE:          The source fields (source name, source URL) are optional. An offer can be saved and published with no source. The source fields are informational only; the system shall NOT perform automated import or syndication from the source URL.
SOURCE:        Charter §7 (source optional); OWNER §7
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 6.5 Date Model Rules

```
ID:            BR-060
TITLE:         Date categorization (corrected per OWNER §12)
RULE:          The dates relevant to V1 are categorized as follows:
           - ADMIN-entered: source_publication_date (optional), application_deadline (optional)
           - System-generated: published_at (set on first publication), created_at (set on offer creation), updated_at (updated on every save)
           - Public-visible: published_at (used for default sort), source_publication_date (if present), application_deadline (if present)
           - Internal-only: created_at, updated_at
           The system shall NOT ask the ADMIN to enter published_at, created_at, or updated_at — these are system-managed.
SOURCE:        OWNER revision decision §12 (CONFIRMED — corrected date model)
STATUS:        CONFIRMED  [corrected from previous BR-070/BR-071]
PRIORITY:      MUST
```

```
ID:            BR-061
TITLE:         Distinct: source_publication_date vs published_at
RULE:          source_publication_date and published_at are TWO DISTINCT functional dates:
           - source_publication_date: optional, ADMIN-entered. Represents the original publication date of the offer if known (e.g., the offer was first published elsewhere on date X).
           - published_at: system-generated. Represents the moment the offer became PUBLISHED on JOURDAIN EMPLOI. Used for the public default sort.
           The two dates are independent. An offer may have a source_publication_date earlier than, equal to, or later than (or absent while present in) published_at. The two dates shall not be conflated.
SOURCE:        OWNER revision decision §12 (CONFIRMED — do not merge the two publication dates)
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-062
TITLE:         application_deadline is informational in V1
RULE:          application_deadline is an optional ADMIN-entered date representing the application deadline stated in the offer. In V1, application_deadline is informational only — the system does NOT automatically move an offer to ARCHIVED or SUSPENDED status when application_deadline passes (per FR-035 and BR-026). ADMIN remains responsible for archiving expired offers.
SOURCE:        OWNER revision decision §12 (CONFIRMED — no automatic expiration in V1)
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            BR-063
TITLE:         expiration_date concept removed from V1
RULE:          The V1 shall NOT include a separate "expiration_date" concept. The application_deadline covers the "deadline stated in the offer" need. There is no separate "expiration" date in V1. If a future version requires automated expiration, a new concept can be introduced then — but not in V1.
SOURCE:        OWNER revision decision §12 (CONFIRMED — remove expiration_date unless indispensable; not indispensable in V1)
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 6.6 Sorting Rules

```
ID:            BR-070
TITLE:         Public default sort uses published_at
RULE:          The public offer list shall sort offers by published_at descending (most recently published on JOURDAIN EMPLOI first) by default. No alternative sort option is required in V1.
SOURCE:        OWNER revision decision §6 (CONFIRMED — tri par date réelle de publication JOURDAIN)
STATUS:        CONFIRMED  [former BR-060 — renumbered for clarity]
PRIORITY:      MUST
ACCEPTANCE:    GIVEN multiple PUBLISHED offers exist with different published_at values
               WHEN a visitor opens the public offer list without any explicit sort request
               THEN the offers are displayed with the most recently published first (by published_at)
```

```
ID:            BR-071
TITLE:         Deterministic tie-breaker in public sort
RULE:          When two offers share the same published_at value, the tie is broken by created_at descending (most recently created first). The tie-breaker is deterministic but does not need to be exposed to the user.
SOURCE:        OWNER revision decision §6 (CONFIRMED — deterministic tie-breaker allowed)
STATUS:        CONFIRMED  [former ASSUMPTION A5 — resolved by OWNER §6]
PRIORITY:      SHOULD
```

### 6.7 Validation Rules

```
ID:            BR-080
TITLE:         Optional URL and email fields validation when provided
RULE:          When provided (non-empty), the optional fields application_email, application_url, and source_url shall be validated for format:
           - application_email: valid email format
           - application_url: valid URL format
           - source_url: valid URL format
           Empty values are accepted (the fields are optional). Non-empty invalid values are rejected at save time. The specific validation mechanism (regex, library, parser) is an S6/S10 technical decision.
SOURCE:        OWNER revision decision §13 (CONFIRMED)
STATUS:        CONFIRMED  [former DR-020/DR-021 partial — resolved by OWNER §13]
PRIORITY:      MUST
DEPENDENCIES:  FR-024
```

---

## 7. Workflows / State Models

### 7.1 Offer Lifecycle State Model

The offer lifecycle is a 4-state model (BR-020). The state diagram (textual):

```
                    +-----------+
                    |   DRAFT   |  <-- FR-020 (create) / FR-022 (save)
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
            | ARCHIVED  |  (terminal in V1 — no transition out)
            +-----------+
```

**Entry conditions per state:**

| State | Entry conditions |
|---|---|
| DRAFT | Offer created by ADMIN (FR-020); or saved as DRAFT (FR-022) |
| PUBLISHED | DRAFT offer published by ADMIN (FR-030); or SUSPENDED offer republished by ADMIN (FR-032) |
| SUSPENDED | PUBLISHED offer suspended by ADMIN (FR-031) |
| ARCHIVED | Any active offer (DRAFT, PUBLISHED, or SUSPENDED) archived by ADMIN (FR-033) |

**Side effects on transitions:**

| Transition | Side effects |
|---|---|
| → PUBLISHED (first publication) | published_at is set (current timestamp); updated_at is set |
| → PUBLISHED (republication from SUSPENDED) | published_at is preserved (not overwritten); updated_at is set |
| → SUSPENDED | status changes only; content preserved; published_at preserved; updated_at is set |
| → ARCHIVED | status changes only; content preserved; published_at preserved; updated_at is set; offer removed from public visibility |
| Edit + save (any status) | updated_at is set; status preserved (FR-021, FR-025); published_at preserved |

### 7.2 ADMIN Main Workflow

The ADMIN main user journey (Charter §6 + OWNER §1):

```
Login (FR-001)
  -> Offer list (FR-010)
    -> New offer (FR-020)
      -> Form (Section 8)
      -> Save as DRAFT (FR-022)
    -> Find offer in list (FR-010), optionally use status filter (FR-012) or title search (FR-013)
    -> Edit (FR-021)
    -> Publish (FR-030)
    -> Suspend (FR-031)
    -> Republish (FR-032)
    -> Archive (FR-033)
  -> Logout (FR-002)
```

### 7.3 PUBLIC Main Workflow

The PUBLIC main user journey (Charter §6 + OWNER §2):

```
Access root URL (FR-040) — directly shows published offer list (no separate home page per OWNER §3)
  -> Browse published offers as cards
  -> Optionally use simple text search (FR-050) — title, company, location
  -> Click "Voir l'offre" (FR-041)
  -> Read full detail (formatting preserved)
  -> Read application modalities (informational only — BR-040)
```

### 7.4 Critical E2E Scenario (per OWNER §20)

```
ADMIN
  -> Login (FR-001)
  -> Create offer (FR-020) with title + description + optional fields
  -> Save as DRAFT (FR-022) — offer NOT visible publicly
  -> Find offer in admin list (FR-010) — status DRAFT visible
  -> Edit (FR-021) — modify some fields
  -> Save — offer still DRAFT (FR-022, BR-040)
  -> Publish (FR-030) — offer transitions to PUBLISHED; published_at is recorded

PUBLIC
  -> Open root URL (FR-040) — offer is visible as a card
  -> Click "Voir l'offre" (FR-041) — offer detail displays correctly
  -> Verify all entered fields are displayed per Section 10.2
  -> Verify no "Apply" button, no logo, no share (Charter §8)

ADMIN
  -> Suspend offer (FR-031) — offer transitions to SUSPENDED

PUBLIC
  -> Root URL — offer no longer visible
  -> Direct URL to offer detail — returns not-found (FR-042)

ADMIN
  -> Republish offer (FR-032) — offer transitions back to PUBLISHED; published_at preserved

PUBLIC
  -> Root URL — offer is visible again

ADMIN
  -> Archive offer (FR-033) — offer transitions to ARCHIVED (terminal)

PUBLIC
  -> Root URL — offer no longer visible
  -> Direct URL — returns not-found

ADMIN
  -> Administrative offer list — offer is still visible with status ARCHIVED
  -> Verify offer content is preserved (FR-034, BR-024)
  -> Verify no V1 action can transition the offer out of ARCHIVED (BR-024)
```

This scenario is the minimum verifiable functional demonstration of V1. It must work end-to-end before V1 can be considered delivered.

---

## 8. Data Requirements

This section defines **logical product data**, not physical database design. Per S5 §14, SQL tables, indexes, foreign keys, ORM schemas, and column types belong to S6.

### 8.1 Offer Entity

**Business name:** Offer

**Purpose:** A single job offer published (or to be published) by the JOURDAIN EMPLOI administration.

**Key attributes (business fields) — corrected per OWNER §14:**

**Required fields (ADMIN-entered):**

| # | Field | Required | Source |
|---|---|---|---|
| 1 | title | Yes | Charter §7; OWNER §14 |
| 2 | description (formatted text) | Yes | Charter §7; OWNER §14, §5 |

**Optional fields (ADMIN-entered):**

| # | Field | Required | Source |
|---|---|---|---|
| 3 | company | Optional | Charter §7; OWNER §14 |
| 4 | sector | Optional | Charter §7; OWNER §14 |
| 5 | category | Optional | Charter §7; OWNER §14 |
| 6 | contract_type | Optional | Charter §7; OWNER §14 |
| 7 | education_level | Optional | Charter §7; OWNER §14 |
| 8 | experience | Optional | Charter §7; OWNER §14 |
| 9 | location | Optional | Charter §7; OWNER §14 |
| 10 | source_publication_date | Optional | OWNER §12, §14 (distinct from published_at) |
| 11 | application_deadline | Optional | OWNER §12, §14 |
| 12 | source_name | Optional | Charter §7; OWNER §7, §14 |
| 13 | source_url | Optional (validated when present — BR-080) | Charter §7; OWNER §7, §13, §14 |
| 14 | application_modalities (text) | Optional | Charter §7; OWNER §6, §14 |
| 15 | application_email | Optional (validated when present — BR-080) | OWNER §6, §13, §14 |
| 16 | application_url | Optional (validated when present — BR-080) | OWNER §6, §13, §14 |

**System-generated fields (NOT entered by ADMIN — OWNER §14 AUTOMATIQUES):**

| # | Field | Source | Visibility |
|---|---|---|---|
| 17 | published_at | System — set on first publication (FR-030); preserved on republication (FR-032) | Public (used for default sort — BR-070) |
| 18 | created_at | System — set on offer creation | Internal only |
| 19 | updated_at | System — updated on every save | Internal only |
| 20 | status | System-managed (one of DRAFT, PUBLISHED, SUSPENDED, ARCHIVED) | Internal (admin-visible) |
| 21 | id | System — unique identifier | Internal |

**Field count summary:**
- Required (ADMIN-entered): **2** (title, description)
- Optional (ADMIN-entered): **14** (company, sector, category, contract_type, education_level, experience, location, source_publication_date, application_deadline, source_name, source_url, application_modalities, application_email, application_url)
- System-generated (internal or system-managed): **5** (published_at, created_at, updated_at, status, id)
- Total business fields: **21**

The form remains compact: 2 required + 14 optional = 16 ADMIN-editable fields, grouped logically (identity, job info, dates, source, application). No decorative or duplicate fields.

**Note on date model correction (OWNER §12):**
- The previous draft had a single `publication_date` (ambiguously merging source and JOURDAIN publication) and a separate `expiration_date`. OWNER §12 corrected this:
  - `source_publication_date` (ADMIN-entered, optional) is now distinct from `published_at` (system-generated).
  - `expiration_date` is removed from V1 — `application_deadline` covers the deadline-stated-in-offer need, and there is no automated expiration in V1 (BR-026, BR-062, BR-063).
- This correction adds one field (separating source_publication_date from published_at) and removes one field (expiration_date), net change: +0 ADMIN-entered fields, +1 system-generated field. The total ADMIN-editable count is 16, matching OWNER §14 enumeration.

**Identity / uniqueness:** Each offer has a unique system id (DR-010). No business uniqueness on title+company+date — duplicates are allowed (an ADMIN may legitimately create two similar offers).

**Ownership:** Offers are owned by the system (JOURDAIN EMPLOI). In V1, all ADMINs have equal access to all offers (no per-ADMIN ownership). Fantomas has full access per AISE §21.

**Business lifecycle:** See Section 7.1.

**History / audit needs:** Minimal in V1. The system maintains created_at, updated_at, published_at (DR-030). No full audit log of who-did-what in V1 (deferred — see DR-030/DR-040).

**Retention:** Archived offers are retained indefinitely in V1 (FR-034). No automatic deletion (BR-024). Physical deletion is OUT OF SCOPE V1 (Section 17).

**Data quality rules:**
- title must be non-empty after whitespace trimming (BR-030)
- description must be non-empty after whitespace trimming (BR-030)
- application_email, when provided, must be a valid email format (BR-080, FR-024)
- application_url and source_url, when provided, must be valid URL format (BR-080, FR-024)
- source_publication_date and application_deadline, when provided, must be valid dates (no time component needed in V1)
- status is constrained to the 4-state enum (BR-020)

**CRUD modules for Entreprises / Secteurs / Catégories (OWNER §15):** V1 does NOT require separate CRUD modules for Entreprises, Secteurs, or Catégories. These are primarily information attached to an offer, not standalone managed entities. S6 may choose the simplest compatible technical representation (free text, enum, reference table) — that is an S6 decision (TD-021).

### 8.2 ADMIN User Entity

**Business name:** ADMIN user

**Purpose:** An ordinary administration account that can authenticate and manage offers.

**Key attributes (business fields):**

| # | Field | Required | Source |
|---|---|---|---|
| 1 | login identifier | Yes | Charter §7; OWNER §1, §2 |
| 2 | password (hashed) | Yes | Charter §7; OWNER §1, §2 |

**Identity / uniqueness:** The login identifier is unique.

**Lifecycle:** Out of V1 scope — V1 does not include ADMIN account self-management (creation, deletion, password reset flows). The initial ADMIN account(s) are created via a bootstrap mechanism (defined in S6/S7) or by Fantomas. ADMIN account management UI is deferred (see DR-050).

### 8.3 Fantomas Principal

**Business name:** Fantomas

**Purpose:** Special system principal for bootstrap, recovery, and break-glass operations per AISE §14 and §21.

**Key attributes (business fields):**

| # | Field | Required | Source |
|---|---|---|---|
| 1 | login identifier | Yes — value: "Fantomas" | Charter §7; OWNER §20 |
| 2 | password (hashed) | Yes — initial value OWNER-specified (NOT stored in repository per S0 §13) | Charter §7; OWNER §20; S0 §13 |

**Identity / uniqueness:** Single Fantomas principal per JOURDAIN EMPLOI instance.

**Privilege inheritance (per AISE §21, OWNER §20):**
- Every operation authorized for the future SUPER_ADMIN role must also be authorized for Fantomas.
- SUPER_ADMIN does NOT automatically inherit Fantomas-only capabilities.
- The distinction between effective SUPER_ADMIN capabilities and Fantomas identity is preserved.

**Note on SUPER_ADMIN:** The Charter mentions a "future SUPER_ADMIN role" but does not require it in V1. V1 has only ADMIN (ordinary) and Fantomas (special). A formal SUPER_ADMIN role is DEFERRED (see DR-051) — Fantomas covers the highest-privilege need in V1.

**Lifecycle:** The initial Fantomas credential is OWNER-specified and injected via S0 §25 External Parameter Gate at implementation time (S10). It must be rotated upon first use (Charter §7). Fantomas password reset / rotation flows are deferred to S6/S7 technical decisions.

**Technical authentication mechanism:** Out of S5 scope — deferred to S6 (see S6 Technical Decision Inputs, Section 19, TD-012).

**V1 interface:** Fantomas is NOT exposed as a regular role in the day-to-day ADMIN interface. The ADMIN interface remains simple (single ADMIN role) — Fantomas does not complexify it (OWNER §20).

---

## 9. Permissions

### 9.1 Permission Matrix

| Action | PUBLIC | ADMIN | FANTOMAS |
|---|---|---|---|
| View public offer list (root URL) | ALLOWED | ALLOWED | ALLOWED |
| View public offer detail | ALLOWED | ALLOWED | ALLOWED |
| Use public simple text search | ALLOWED | ALLOWED | ALLOWED |
| View administrative offer list | DENIED | ALLOWED | ALLOWED |
| View administrative offer detail (any status) | DENIED | ALLOWED | ALLOWED |
| Create offer | DENIED | ALLOWED | ALLOWED |
| Edit offer (any status) | DENIED | ALLOWED | ALLOWED |
| Save offer as DRAFT | DENIED | ALLOWED | ALLOWED |
| Publish offer (DRAFT → PUBLISHED) | DENIED | ALLOWED | ALLOWED |
| Suspend offer (PUBLISHED → SUSPENDED) | DENIED | ALLOWED | ALLOWED |
| Republish offer (SUSPENDED → PUBLISHED) | DENIED | ALLOWED | ALLOWED |
| Archive offer (any → ARCHIVED) | DENIED | ALLOWED | ALLOWED |
| Republish from ARCHIVED | DENIED | DENIED in V1 (ARCHIVED is terminal) | DENIED in V1 |
| Delete offer (physical) | DENIED | DENIED in V1 (OUT OF SCOPE) | DENIED in V1 (OUT OF SCOPE) |
| Authenticate to back-office | N/A | ALLOWED (login + password) | ALLOWED (break-glass auth) |
| Bootstrap initial ADMIN account | N/A | DENIED (no ADMIN exists yet) | ALLOWED (Fantomas-specific capability) |
| Recover from auth failure | N/A | DENIED | ALLOWED (Fantomas-specific capability) |
| Public registration / candidate account | N/A (DENIED — no mechanism) | N/A | N/A |

### 9.2 Permission Requirements

```
ID:            PERM-001
TITLE:         Public read access to published offers
REQUIREMENT:   Any unauthenticated visitor may view the public offer list (at root URL) and the public detail of any PUBLISHED offer. No other read access is granted to the public. No public registration or candidate account.
SOURCE:        Charter §7, §8; OWNER §2, §3; FR-040, FR-041, FR-042
STATUS:        CONFIRMED
PRIORITY:      MUST
```

```
ID:            PERM-002
TITLE:         ADMIN full offer lifecycle
REQUIREMENT:   An authenticated ADMIN may perform the full offer lifecycle on all offers: create, edit, save, publish, suspend, republish, archive. Physical deletion is NOT authorized in V1 (OUT OF SCOPE). Republication from ARCHIVED is NOT authorized in V1 (ARCHIVED is terminal).
SOURCE:        Charter §7; FR-020, FR-021, FR-022, FR-025, FR-030, FR-031, FR-032, FR-033
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
REQUIREMENT:   Fantomas has at minimum all ADMIN capabilities plus Fantomas-specific bootstrap / recovery / break-glass capabilities per AISE §14 and §21. ADMIN does NOT inherit Fantomas-specific capabilities. The V1 ordinary ADMIN interface is not complexified by Fantomas.
SOURCE:        Charter §7; AISE S0 §14, §21; OWNER §20
STATUS:        CONFIRMED
PRIORITY:      MUST
```

---

## 10. Public Display — Offer Card and Detail

### 10.1 Offer Card (public list, at root URL)

Each PUBLISHED offer is displayed in the public list as a card showing, when available, the following elements (per Charter §7 and OWNER §10):

| Element | Display rule |
|---|---|
| Title | Always displayed |
| Company | Displayed if present; if absent, OMITTED (no placeholder, no fabricated name — BR-033) |
| Location | Displayed if present; omitted if absent (no placeholder) |
| Contract type | Displayed if present; omitted if absent (no placeholder) |
| published_at (formatted as publication date on JOURDAIN EMPLOI) | Always displayed (every PUBLISHED offer has published_at per BR-022) |
| application_deadline | Displayed if present; omitted if absent |
| Action "Voir l'offre" | Always displayed; links to the offer's public detail page |

**Excluded from card (Charter §8):** logos, social share buttons, "Postuler" button, "Entreprise non communiquée" placeholder (omit instead per BR-033).

### 10.2 Offer Detail (public page)

The public detail page displays, when available (per Charter §7 and OWNER §10):

| Element | Display rule |
|---|---|
| Title | Always displayed |
| Company | Displayed if present; if absent, display "Entreprise non communiquée" (BR-033) |
| Sector / Category | Displayed if present; omitted if absent |
| Contract type | Displayed if present; omitted if absent |
| Education level | Displayed if present; omitted if absent |
| Experience | Displayed if present; omitted if absent |
| Location | Displayed if present; omitted if absent |
| Dates: source_publication_date, published_at, application_deadline | Displayed if present; published_at always displayed (every PUBLISHED offer has it) |
| Full description | Always displayed; preserves formatting (BR-034) |
| Application modalities block | Displayed if any of application_modalities, application_email, application_url is present; displayed as a "How to apply" block; no "Apply" button (BR-040); email rendered as a mailto link, URL rendered as a link |
| Source block | Displayed if source_name or source_url is present; source_url rendered as a link |

**Excluded from detail (Charter §8):** logos, social share, "Postuler" button, CV upload, favorites, messaging.

---

## 11. Integration Requirements

V1 has no external integration requirements.

```
ID:            INT-001
TITLE:         No external integration in V1
REQUIREMENT:   V1 does NOT integrate with any external system. No syndication, no public API, no import pipeline, no notifications, no payment, no third-party authentication provider as a user-facing feature. Internal endpoints required for Next.js operation are an implementation detail of S6 and are NOT a public product API.
SOURCE:        Charter §9; OWNER §18
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
ID:            FR-024-ERR
TITLE:         URL/email field validation feedback
REQUIREMENT:   When the ADMIN enters an invalid URL or email in a relevant field (application_email, application_url, source_url), the system shall indicate which field is invalid and preserve the rest of the form values. The offer shall NOT be saved until the invalid values are corrected or removed.
SOURCE:        FR-024, BR-080; standard UX practice
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

See FR-060 (public) and FR-061 (administrative) — both CONFIRMED per OWNER §7.

---

## 13. Non-Functional Requirements

### 13.1 Performance

```
ID:            NFR-001
TITLE:         Public page response time
REQUIREMENT:   Public pages (offer list, offer detail) shall display their primary content within a reasonable time for a small editorial portal. Specific quantitative target: TARGET TO BE DEFINED in S6 (this is a SHOULD, not a blocker for S5).
SOURCE:        Charter §10 (priority 5: performance — ordered after simplicity, correctness, security, maintainability)
STATUS:        CONFIRMED — requirement; quantitative target deferred to S6
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
SOURCE:        Charter §7; S0 §13, §25; OWNER §20
STATUS:        CONFIRMED — requirement; mechanism deferred to S6/S7
PRIORITY:      MUST
```

### 13.3 Availability

V1 has no formal uptime SLO (Charter §13 — success is functional, not quantitative). Availability is "best effort" within Vercel's free or standard tier (Charter §10 — priority 7: low operating cost). No high-availability requirement for V1.

### 13.4 Accessibility

```
ID:            NFR-030
TITLE:         Reasonable web accessibility
REQUIREMENT:   The V1 shall respect reasonable web accessibility: keyboard navigation, comprehensible labels, usable forms, readable contrast, correct semantic structure. The detailed technical standard (WCAG level, assistive technology compliance) will be examined at the appropriate technical stage if necessary.
SOURCE:        OWNER revision decision §8 (CONFIRMED)
STATUS:        CONFIRMED  [former ASSUMPTION A8 — resolved by OWNER §8]
PRIORITY:      SHOULD
ACCEPTANCE:    GIVEN a visitor (including one using keyboard navigation or a screen reader)
               WHEN the visitor navigates the public interface or the ADMIN interface
               THEN the interface is navigable by keyboard
               AND form fields have comprehensible labels
               AND contrast is readable
               AND the HTML structure uses semantic elements appropriately
```

### 13.5 Localization

```
ID:            NFR-040
TITLE:         French only
REQUIREMENT:   The V1 user interface (public and administrative) shall be in French. Multilingual support is OUT OF SCOPE V1 (Charter §8; OWNER §18). The technical i18n architecture is an S6 decision; V1 may use a simple French-only implementation without an i18n framework.
SOURCE:        Charter §8, §10; OWNER §18
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 13.6 Auditability

```
ID:            NFR-050
TITLE:         Minimal audit data
REQUIREMENT:   The system shall maintain minimal audit data per offer: created_at, updated_at, published_at. A full audit log (who did what, when, with what values) is NOT required for V1 (deferred — see DR-030/DR-040).
SOURCE:        Charter §10; OWNER §12
STATUS:        CONFIRMED
PRIORITY:      MUST
```

### 13.7 Data Integrity

```
ID:            NFR-060
TITLE:         Offer integrity across lifecycle
REQUIREMENT:   The system shall preserve offer content integrity across status transitions (DRAFT → PUBLISHED → SUSPENDED → PUBLISHED → ARCHIVED). No content field shall be modified as a side effect of a status transition. Only the status field and updated_at change on status transitions. published_at is preserved across all transitions after first publication.
SOURCE:        BR-022, BR-023, BR-024; FR-031, FR-032, FR-033
STATUS:        CONFIRMED
PRIORITY:      MUST
```

---

## 14. Constraints

The constraints from Charter §10 apply. Key restatements relevant to S5:

- **Mono-tenant**: V1 is a single JOURDAIN EMPLOI instance (Charter §9; OWNER §1). Multi-tenancy is OUT OF SCOPE V1.
- **French only**: V1 UI is French (Charter §10; OWNER §2). Multilingual is OUT OF SCOPE V1.
- **Manual offer creation only**: No automated import (Charter §7; OWNER §3 + §6 + §7).
- **Single ordinary ADMIN role**: No complex RBAC for ordinary users (Charter §3, §7; OWNER §4 + §15). Fantomas is the only other principal (PERM-004).
- **No CRUD modules for Entreprises/Secteurs/Catégories**: These are info attached to offers, not standalone managed entities (OWNER §15).
- **No architecture-heavy stack**: No microservices, Kubernetes, Kafka, Elasticsearch (Charter §10).
- **Production separated from Preview**: Vercel environments (Charter §10).
- **AISE process constraints**: §13 secret handling, §14/§21 Fantomas, §23 zero scheduled work, §24 contract preservation, §25 external parameter gate.
- **Volumetry**: Editorial portal scale, no quantitative capacity assumption (Charter §10; OWNER §12).
- **UX/UI references**: OWNER-provided screenshots are the orientation (Charter §10; OWNER §10).
- **No separate marketing home page**: root URL serves the published offers list directly (OWNER §3).
- **Priority order** (when two priorities conflict, the lower-numbered wins): 1. Simplicity of use, 2. Correct functioning, 3. Security, 4. Maintainability, 5. Performance, 6. Low complexity, 7. Low operating cost.

---

## 15. Assumptions

All previous ASSUMPTION items (A1–A8) have been resolved by OWNER revision decisions §1–§13. The agent has not silently promoted any ASSUMPTION to CONFIRMED — each promotion is grounded in an explicit OWNER revision decision referenced in the relevant requirement.

**Remaining ASSUMPTION items: NONE.**

Reclassification summary:

| Former ID | Former assumption | Resolution | New state | Section |
|-----------|-------------------|------------|-----------|---------|
| A1 | Admin logout is available | OWNER §2 | CONFIRMED (FR-002) | 5.1 |
| A2 | Admin offer list has simple status filter + title search | OWNER §4 | CONFIRMED (FR-012 MUST + FR-013 SHOULD) | 5.2 |
| A3 | Public offer list has simple text search | OWNER §5 | CONFIRMED (FR-050 SHOULD) | 5.6 |
| A4 | Minimal home page is provided | OWNER §3 | OUT OF SCOPE V1 (FR-040 directly serves offer list at root) | 5.5, 14 |
| A5 | Tie-breaker in public sort is deterministic | OWNER §6 | CONFIRMED (BR-071 SHOULD) | 6.6 |
| A6 | Empty public offer list displays informational message | OWNER §7 | CONFIRMED (FR-060 MUST) | 5.7 |
| A7 | Empty administrative offer list displays CTA | OWNER §7 | CONFIRMED (FR-061 MUST) | 5.7 |
| A8 | Public interface follows reasonable accessibility practices | OWNER §8 | CONFIRMED (NFR-030 SHOULD) | 13.4 |

The previous count inconsistency (S5 mentioned "9 assumptions A1-A8" — there were only 8 IDs) is corrected: there were 8 ASSUMPTION items (A1–A8), all now resolved.

---

## 16. Open Questions

All previous OPEN QUESTION items (OQ-1 through OQ-6) have been resolved by OWNER revision decisions §3, §4, §5, §9, §10, §11.

**Remaining OPEN QUESTIONS: NONE.**

**Blocking open questions: 0.**

Reclassification summary:

| Former ID | Former question | Resolution | New state |
|-----------|-----------------|------------|-----------|
| OQ-1 | Home page: dedicated page or root = offer list? | OWNER §3 | RESOLVED — root URL serves offer list directly; no separate home page (FR-040) |
| OQ-2 | Public simple text search in V1? | OWNER §5 | RESOLVED — CONFIRMED as SHOULD (FR-050), search on title + company + location |
| OQ-3 | Admin filter scope | OWNER §4 | RESOLVED — status filter MUST (FR-012) + title search SHOULD (FR-013) |
| OQ-4 | Unknown company display | OWNER §9 | RESOLVED — omit on card, "Entreprise non communiquée" on detail (BR-033) |
| OQ-5 | Duplicate offer action | OWNER §10 | RESOLVED — OUT OF SCOPE V1 (Section 17) |
| OQ-6 | Preview mode before publishing | OWNER §11 | RESOLVED — OUT OF SCOPE V1 (Section 17); ADMIN re-reads DRAFT in form before publishing |

---

## 17. Out of Scope V1 (confirmed by OWNER revision)

The following items are CONFIRMED OUT OF SCOPE V1. They are not "deferred for a future version that may slip in" — they are explicit boundaries. Any future re-introduction requires OWNER approval and a new AISE scope decision.

| ID | Out-of-scope item | Source | Rationale |
|---|---|---|---|
| OOS-001 | Company logos | Charter §8; OWNER §18 | Excluded |
| OOS-002 | "Apply" button / in-app application submission | Charter §8; OWNER §6, §18 | Modalities are informational only (BR-040) |
| OOS-003 | Social sharing (Facebook, WhatsApp, LinkedIn, generic) | Charter §8; OWNER §18 | Excluded |
| OOS-004 | Candidate accounts | Charter §8; OWNER §2, §18 | No public registration (FR-004) |
| OOS-005 | CV / resume upload | Charter §8; OWNER §18 | Excluded |
| OOS-006 | Favorites / bookmarks | Charter §8; OWNER §18 | Excluded |
| OOS-007 | Messaging | Charter §8; OWNER §18 | Excluded |
| OOS-008 | Internal application workflow | Charter §8; OWNER §6, §18 | Excluded |
| OOS-009 | Recruiter space | Charter §8; OWNER §18 | Excluded |
| OOS-010 | Payment functionality | Charter §8; OWNER §18 | Excluded |
| OOS-011 | AI matching | Charter §8; OWNER §18 | Excluded |
| OOS-012 | Mobile application (native iOS/Android) | Charter §8; OWNER §18 | Excluded |
| OOS-013 | Notifications (email, push, SMS) | Charter §8; OWNER §18 | Excluded |
| OOS-014 | Automatic import of offers | Charter §7; OWNER §3, §7, §18 | Manual creation only |
| OOS-015 | Public API | Charter §8; OWNER §18 | Internal Next.js endpoints are S6 implementation, not a public product API |
| OOS-016 | Multilingual support | Charter §8; OWNER §2, §18 | French only (NFR-040) |
| OOS-017 | Multi-tenant | Charter §8; OWNER §1, §18 | Single JOURDAIN EMPLOI instance |
| OOS-018 | Complex RBAC for ordinary users | Charter §7; OWNER §4, §18 | Single ADMIN role (PERM-002) |
| OOS-019 | Physical deletion of offers | OWNER §17 | Archiving is preferred; no destructive deletion in V1 |
| OOS-020 | Republication from ARCHIVED status | OWNER §16 | ARCHIVED is terminal in V1 |
| OOS-021 | Automated expiration (auto-archive or auto-suspend on application_deadline) | OWNER §12; S0 §23 | No scheduled work; ADMIN archives manually |
| OOS-022 | Separate "expiration_date" concept | OWNER §12 | Removed from V1 (BR-063); application_deadline covers the deadline need |
| OOS-023 | Duplicate offer action | OWNER §10 | OUT OF SCOPE V1; may be added in a future version |
| OOS-024 | Preview mode (separate preview screen) | OWNER §11 | OUT OF SCOPE V1; ADMIN re-reads DRAFT in form before publishing |
| OOS-025 | Multi-criteria advanced search / facets | OWNER §5 | V1 has at most simple text search (FR-050) |
| OOS-026 | Separate marketing home page | OWNER §3 | Root URL serves offer list directly (FR-040) |
| OOS-027 | CRUD modules for Entreprises / Secteurs / Catégories | OWNER §15 | These are info attached to offers, not standalone entities |
| OOS-028 | Public registration / self-service account management | OWNER §2 | Account creation is administrative only (FR-004) |
| OOS-029 | Editorial revalidation workflow on PUBLISHED offer edit | OWNER §19 | No revalidation; PUBLISHED offer stays PUBLISHED after edit (FR-025) |
| OOS-030 | Automatic status transition on date passage | OWNER §12; S0 §23 | No automatic transitions (BR-026, FR-035) |

---

## 18. Deferred Requirements (true future decisions only)

The following items remain DEFERRED — they are genuine future decisions (technical or product) that are NOT yet decided in V1 but are not explicitly excluded forever. They will be re-examined in a future version or at S6/S7.

| ID | Deferred item | Source | Why deferred |
|---|---|---|---|
| DR-010 | Specific format of the offer unique id (UUID, sequential, slug, etc.) | S5 §6 / S6 boundary | Technical decision → S6 (TD-001) |
| DR-020 | Specific email validation format / regex / library | OWNER §13 (requirement CONFIRMED; mechanism DEFERRED) | S6/S10 technical decision |
| DR-021 | Specific URL validation format / library | OWNER §13 (requirement CONFIRMED; mechanism DEFERRED) | S6/S10 technical decision |
| DR-030 | Full audit log (who/what/when) | NFR-050 | V1 maintains minimal audit (created_at, updated_at, published_at). Full audit is a future product decision. |
| DR-040 | Full audit log implementation | NFR-050 | Same as DR-030. |
| DR-050 | ADMIN account management UI (create, list, deactivate, password reset) | Section 8.2 | V1 bootstraps initial ADMIN via Fantomas or deployment; no self-service UI in V1. Future product decision. |
| DR-051 | Formal SUPER_ADMIN role | Charter §7; Section 8.3 | Charter mentions "future SUPER_ADMIN"; V1 uses ADMIN + Fantomas only. Future product decision. |
| DR-160 | GDPR detailed constraints (data minimization, retention rules, consent flows if any) | Charter §10 — Deferred Decision D1 | S6 territory (TD-018) |
| DR-170 | Data residency / hosting region constraints | Charter §10 — Deferred Decision D3 | S6 territory (TD-019) |

The previously-listed items that are now CONFIRMED OUT OF SCOPE V1 (and therefore no longer DEFERRED) are: physical deletion (was DR-060 → OOS-019), archiving transitions / republication from ARCHIVED (was DR-070 → OOS-020), automated expiration (was DR-071 → OOS-021), duplicate action (was DR-080 → OOS-023), preview mode (was DR-090 → OOS-024), advanced search (was DR-100 → OOS-025), public API (was DR-110 → OOS-015), notifications (was DR-120 → OOS-013), multilingual (was DR-130 → OOS-016), multi-tenant (was DR-140 → OOS-017), complex RBAC (was DR-150 → OOS-018).

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
| TD-009 | Description editor choice (rich-text or markdown) | BR-034 — technical choice is S6 |
| TD-010 | Authentication mechanism for ADMIN (session, JWT, etc.) | FR-001, NFR-012 — mechanism is S6 |
| TD-011 | Password hashing mechanism | NFR-010 — mechanism is S6 |
| TD-012 | Fantomas authentication and authorization architecture | Charter §7; PERM-004; AISE §14, §21 — architecture is S6/S7 |
| TD-013 | Database schema (tables, columns, indexes, foreign keys) | Section 8 — logical data only; physical schema is S6 |
| TD-014 | Internal API endpoint design (NOT a public API) | INT-001 — implementation detail of S6 |
| TD-015 | Testing strategy and tools | Charter §10 — "outils de tests adaptés" |
| TD-016 | Deployment topology (Preview vs Production environments) | Charter §10 — Production separated from Preview |
| TD-017 | Caching strategy (if any) | NFR-001 — S6 territory |
| TD-018 | GDPR detailed constraints | Charter §10 — Deferred Decision D1 |
| TD-019 | Data residency / hosting region constraints | Charter §10 — Deferred Decision D3 |
| TD-020 | Bootstrap mechanism for initial ADMIN and Fantomas credentials | Section 8.3; PERM-004; S0 §25 — S6/S7 decision |
| TD-021 | Representation of Entreprises / Secteurs / Catégories (free text, enum, reference table) | OWNER §15 — S6 chooses the simplest compatible representation |
| TD-022 | Date display format and timezone handling for public-facing dates | BR-060, BR-061 — S6 decision |
| TD-023 | Pagination mechanism for offer lists (admin and public) | FR-010, FR-040 — S6 decision |

---

## 20. Approval / Baseline Status

**APPROVED BY OWNER on 2026-09-14.**

OWNER has explicitly approved this baseline at canonical commit `9ec4a08b467a4a3909fa9bc0a72bf02e4c682418` with the following acknowledgment:

> J'approuve explicitement le baseline fonctionnel S5 de JOURDAIN EMPLOI : docs/product/PRODUCT_REQUIREMENTS.md — Commit canonique approuvé : 9ec4a08b467a4a3909fa9bc0a72bf02e4c682418 — Le cahier des charges fonctionnel S5 est APPROUVÉ.

OWNER-confirmed functional decisions (excerpt of the approval):

- 4 statuses V1: DRAFT, PUBLISHED, SUSPENDED, ARCHIVED — ARCHIVED terminal in V1
- Save ≠ publish; publication is an explicit ADMIN action
- A modified PUBLISHED offer remains PUBLISHED unless explicit suspend/archive
- No physical deletion in V1; no automatic expiration; no republication from ARCHIVED in V1
- Required fields: title, description; all other fields optional
- Date model: source_publication_date, application_deadline, published_at, created_at, updated_at (distinct); published_at is JOURDAIN-generated and serves public sort; expiration_date does not exist in V1
- Root URL may directly show the published offers list; public sort by published_at descending
- Public simple search = SHOULD; Admin status filter = required; Admin simple search = SHOULD
- No CRUD modules for Entreprises/Secteurs/Catégories in V1
- No Apply button, no internal application workflow, no Duplicate action, no Preview mode, no candidate account, no sharing, no multilingual, no public API, no multi-tenant, no complex RBAC
- Fantomas remains a distinct system principal from ordinary ADMIN per the previously approved contract

OWNER-accepted DEFERRED DECISIONS (genuinely future, non-blocking for S5 closure):

- DR-010 — id format (S6)
- DR-020 / DR-021 — email/URL validation formats (S6/S10)
- DR-030 / DR-040 — full audit log (future product decision)
- DR-050 — ADMIN account management UI (future product decision)
- DR-051 — formal SUPER_ADMIN role (future product decision)
- DR-160 — GDPR detailed constraints (Charter D1 — S6)
- DR-170 — data residency (Charter D3 — S6)

Per AISE S5 §23 and §24, the baseline is now FROZEN as the canonical intended state. Any future modification requires a material change record and OWNER approval.

Per AISE S5 §29, S5 transitions PROJECT_STATE to:
- AISE PHASE: S5 — CLOSED / PASS
- PRODUCT REQUIREMENTS: APPROVED
- TECHNICAL SPECIFICATION: NOT STARTED (S6)
- NEXT RECOMMENDED: S6 — Technical Specification

S6 begins only after explicit OWNER GO.

| Field | Value |
|---|---|
| Document status | OWNER APPROVED — S5 CLOSED / PASS |
| Charter reference | `docs/planning/PROJECT_CHARTER.md` at `fa377c1` |
| Charter approval date | 2026-09-13 |
| S5 initial draft date | 2026-09-14 |
| S5 revision date | 2026-09-14 (after OWNER revision decisions §1–§23) |
| S5 OWNER approval date | 2026-09-14 |
| Approved baseline commit | `9ec4a08b467a4a3909fa9bc0a72bf02e4c682418` |
| Next recommended component | S6 — Technical Specification |

---

## 21. Requirement Quality Gate Self-Check (per S5 §31)

| Check | Result |
|---|---|
| Ambiguous critical requirements | 0 (every MUST requirement has ACCEPTANCE criteria) |
| Contradictory unresolved critical requirements | 0 (no contradictions identified; BR-020 + transitions are consistent; FR-025 + BR-040 are consistent; date model is unambiguous per BR-060/BR-061/BR-062/BR-063) |
| Blocking product open questions | 0 (all OQ resolved by OWNER revision decisions) |
| Critical requirements without acceptance | 0 (all FR-/BR-/PERM-/NFR-MUST have acceptance or testable rule) |
| Orphan MUST requirements | 0 (every requirement traces to Charter §7 or §8 or OWNER S5 decision) |
| Uncovered MUST Charter objectives | 0 (Charter §7 admin lifecycle fully covered; Charter §7 public fully covered; Charter §7 Fantomas covered; Charter §8 exclusions covered by Section 17) |
| Technical implementation as requirement | 0 (no library, framework, schema, or API endpoint chosen — all deferred to S6 via TD-001 through TD-023) |
| ASSUMPTION count | 0 (all A1–A8 resolved) |
| OPEN count | 0 (all OQ-1 through OQ-6 resolved) |
| DEFERRED count | 9 (only genuine future decisions: DR-010, DR-020, DR-021, DR-030, DR-040, DR-050, DR-051, DR-160, DR-170) |
| OUT OF SCOPE V1 count | 30 (OOS-001 through OOS-030) |
| Functionality both CONFIRMED and DEFERRED | 0 (no overlap — every functional item is in exactly one category) |
| All MUST requirements have acceptance criteria | YES |
| Lifecycle coherent | YES (BR-020 + FR-030/031/032/033 transitions align; ARCHIVED is terminal per BR-024 and OOS-020) |
| Public visibility coherent | YES (BR-025 + FR-040/041/042 align; only PUBLISHED is publicly visible) |

**Verdict: REQUIREMENTS QUALITY GATE: PASS.**

The baseline is ready for OWNER review and approval.

---

## 22. Traceability Matrix (S4 → S5)

| Charter objective (S4) | S5 coverage |
|---|---|
| Project purpose: simple publication + consultation portal | Sections 3, 5.5, 7, 10 |
| Users: ADMIN + Public + Fantomas | Section 4, 8.2, 8.3 |
| Admin back-office: auth, create, edit, save, publish, suspend, archive, list | FR-001, FR-002, FR-003, FR-004, FR-010–FR-013, FR-020–FR-025, FR-030–FR-035, PERM-002 |
| Public: list, open, detail, application modalities | FR-040, FR-041, FR-042, FR-050, FR-060, BR-040 |
| Offer data fields (title, description required; others optional) | Section 8.1, BR-030, BR-031 |
| Never invent absent info | BR-032, BR-033 |
| Description formatting | BR-034, TD-009 |
| Application modalities informational only | BR-040 |
| Source optional (name + URL) | BR-050, Section 8.1 |
| Lifecycle: DRAFT, PUBLISHED, SUSPENDED, ARCHIVED | BR-020, BR-021, BR-022, BR-023, BR-024, BR-025, BR-026 |
| Save ≠ publish | BR-021, BR-040, FR-022 |
| Modification of PUBLISHED offer stays PUBLISHED | FR-025, OWNER §19 |
| Archiving preserves content; no auto-delete | FR-034, BR-024, OOS-019 |
| Date model (corrected) | BR-060, BR-061, BR-062, BR-063, Section 8.1 |
| Public card display | Section 10.1 |
| Public detail display | Section 10.2 |
| Unknown company presentation | BR-033, OWNER §9 |
| Public default sort by published_at desc | BR-070, BR-071 |
| Admin simple list with status filter | FR-010, FR-011, FR-012, FR-013 |
| No marketing home page (root = offer list) | FR-040, OWNER §3, OOS-026 |
| Empty states (public + admin) | FR-060, FR-061, OWNER §7 |
| Reasonable web accessibility | NFR-030, OWNER §8 |
| French only | NFR-040, OOS-016 |
| Mono-tenant | Section 14, OOS-017 |
| No CRUD modules for Entreprises/Secteurs/Catégories | Section 8.1 (note), OOS-027, TD-021 |
| Fantomas principal (AISE §14, §21) | Section 8.3, PERM-004, NFR-013 |
| Exclusions V1 (logos, Apply, share, accounts, CV, favorites, messaging, recruiter, payment, AI matching, mobile, notifications, import, public API, multilingual, multi-tenant, complex RBAC) | Section 17 (OOS-001 through OOS-030) |
| Priority order (1–7) | Section 14 |

All Charter objectives are covered by at least one S5 requirement or are explicitly listed in the Out of Scope V1 table. No orphan S5 requirements. No uncovered MUST Charter objectives.

---

## 23. Summary of Counts

| Category | Count |
|---|---|
| Functional Requirements (FR) | 30 (FR-001 through FR-061; includes 4 error/edge FRs numbered FR-001-ERR, FR-023-ERR, FR-024-ERR, FR-042-ERR; main FRs: 26) |
| Business Rules (BR) | 17 (BR-020 through BR-080) |
| Permissions (PERM) | 4 (PERM-001 through PERM-004) |
| Integration Requirements (INT) | 1 (INT-001) |
| Non-Functional Requirements (NFR) | 9 (NFR-001 through NFR-060) |
| **Total requirement records** | **61** |
| ASSUMPTION items | 0 (all resolved) |
| OPEN question items | 0 (all resolved) |
| DEFERRED items (genuine future) | 9 (DR-010, DR-020, DR-021, DR-030, DR-040, DR-050, DR-051, DR-160, DR-170) |
| OUT OF SCOPE V1 items | 30 (OOS-001 through OOS-030) |
| S6 Technical Decision Inputs | 23 (TD-001 through TD-023) |
| Offer business fields | 21 (2 required + 14 optional + 5 system-managed) |
| Offer lifecycle states | 4 (DRAFT, PUBLISHED, SUSPENDED, ARCHIVED) |
| Date model | 3 distinct date types: ADMIN-entered (source_publication_date, application_deadline), system-generated (published_at, created_at, updated_at); no separate expiration_date |

Priority distribution:
- MUST: 53
- SHOULD: 7
- COULD: 0
- DEFERRED priority: 0 (deferred items are in Section 18 with their own table)

Evidence state distribution:
- CONFIRMED: 61 (100% of requirement records)
- ASSUMPTION: 0
- OPEN: 0
- DEFERRED status: 0 (the 9 deferred items are in Section 18, not as requirement records with STATUS field)

**Verdict: CHARTER READY FOR OWNER APPROVAL = YES.**
