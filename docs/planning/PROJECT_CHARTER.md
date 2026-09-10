# PROJECT CHARTER — JOURDAIN EMPLOI

**Document type:** AISE S4 — Project Discovery / Charter
**Status:** DRAFT — PENDING OWNER APPROVAL
**Date:** 2026-09-10
**Project:** JOURDAIN EMPLOI
**Canonical repository:** `github.com/alexkanga/jourdain`
**Canonical branch:** `main`
**Canonical HEAD at draft time:** `9b2cabd511dacb1f954e825ed3858ffb7c62fec3`

This charter is governed by the AISE protocol S4 (`docs/engineering/AISE_PROJECT_DISCOVERY_CHARTER.md`). It defines **what the project is and why it exists**, not the detailed product requirements (S5) nor the technical architecture (S6).

Every factual claim in this charter carries one of three evidence states:

- **CONFIRMED** — directly stated by OWNER, or verifiable from authoritative source.
- **ASSUMPTION** — reasonable inference consistent with OWNER intent, but not explicitly confirmed. Every ASSUMPTION is presented for OWNER review.
- **OPEN QUESTION** — materially unresolved, decision-relevant. Every OPEN QUESTION is presented to OWNER with enough context for a decision.

---

## 1. Project Purpose

JOURDAIN EMPLOI exists to provide the JOURDAIN EMPLOI administration with a simple, operational web portal to publish job offers and to allow the public to consult those offers and their full details. [CONFIRMED]

The V1 is deliberately narrow in scope: it is a publication and consultation portal for job offers, not a full recruitment platform. [CONFIRMED]

## 2. Problem or Opportunity

The administration of JOURDAIN EMPLOI needs a way to record, manage, and publish job offers, and the public needs a way to discover and read those offers with their complete details and application modalities. [CONFIRMED]

The V1 addresses the absence of a dedicated, simple, controlled publication channel for JOURDAIN EMPLOI job offers. [CONFIRMED]

The opportunity is to deliver real, working value with the smallest possible surface area — administration of offers on one side, public consultation on the other — without entering the territory of a recruitment platform. [CONFIRMED]

## 3. Users / Stakeholders

Two distinct ordinary user groups are confirmed for V1:

1. **Administration JOURDAIN EMPLOI** — the team responsible for recording, managing, and publishing job offers. [CONFIRMED]
2. **Public visitors** — anyone who consults the published offers without authentication. [CONFIRMED]

No other ordinary user group is in scope for V1. Specifically, the following are explicitly excluded (see Section 8 — Out of Scope): candidates with accounts, recruiters with dedicated spaces, partners, advertisers. [CONFIRMED]

In addition to ordinary users, the project must include a dedicated **system principal** called **Fantomas** (the JOURDAIN EMPLOI instantiation of the AISE canonical Ghost/Fantomas break-glass principal mandated by S0 §14 and S0 §21). [CONFIRMED]

Fantomas is NOT an ordinary user. Fantomas is a special system principal distinct from the administrative users and must not be treated as a simple ADMIN account. Fantomas serves the bootstrap, recovery, and break-glass functions required by AISE. The functional role, capabilities, and lifecycle of Fantomas are described in Section 7. [CONFIRMED]

The exact number of ordinary administrative users, their roles, and the granularity of permissions among ordinary administrators is not specified by OWNER. [OPEN QUESTION — Q1]

## 4. Current State / Pain Points

OWNER has not described the current state of job-offer publication at JOURDAIN EMPLOI. Whether offers are currently published via email, social media, PDF, another job board, or not at all is not stated. [OPEN QUESTION — Q2]

The charter therefore records the absence of a dedicated JOURDAIN EMPLOI publication portal as the confirmed motivation, without claiming to replace a specific existing system. [CONFIRMED]

## 5. Vision

After V1 succeeds, the JOURDAIN EMPLOI administration can record a job offer through a dedicated authenticated interface, choose when to publish it, suspend or archive it as needed, and the public can browse the list of published offers and open any one of them to read its full content, including application modalities when available. [CONFIRMED]

The vision is deliberately bounded: V1 does not aspire to be a recruitment platform, does not handle applications, and does not match candidates to offers. [CONFIRMED]

## 6. Objectives

V1 must achieve the following outcomes:

1. The administration can authenticate and access a private back-office to manage offers. [CONFIRMED]
2. The administration can perform the full lifecycle of an offer: create, record, modify, publish, suspend, archive. [CONFIRMED]
3. The administration can consult the list of all offers regardless of status. [CONFIRMED]
4. The public can consult the list of published offers. [CONFIRMED]
5. The public can open a published offer and read its full detail, including application modalities when available. [CONFIRMED]
6. The system remains simple to use, correct in operation, secure, maintainable, performant, low-complexity, and low-cost to operate (per the priority order in Section 10). [CONFIRMED]

Measurable success targets (e.g., number of offers supported, page load time, uptime SLO) are not specified by OWNER. [OPEN QUESTION — Q3]

## 7. High-Level Scope

The V1 scope covers the following functional areas:

**Administration back-office (authenticated):**
- Authentication of the administration. [CONFIRMED]
- Creation of an offer. [CONFIRMED]
- Recording of an offer (saving it without publishing). [CONFIRMED]
- Modification of an offer. [CONFIRMED]
- Publication of an offer. [CONFIRMED]
- Suspension of a published offer. [CONFIRMED]
- Archiving of an offer. [CONFIRMED]
- Consultation of the administrative list of offers (all statuses). [CONFIRMED]

**System principal — Fantomas (Ghost/Fantomas break-glass principal):**

JOURDAIN EMPLOI V1 must include a dedicated system principal named **Fantomas**, instantiating the AISE canonical Ghost/Fantomas break-glass principal mandated by S0 §14 (FANTOMAS / GHOST) and S0 §21 (FANTOMAS PRIVILEGE INHERITANCE). [CONFIRMED]

Functional identity (OWNER-confirmed):
- Principal name: **Fantomas**. [CONFIRMED]
- Initial login identifier: **Fantomas** (used at bootstrap time). [CONFIRMED]
- Initial bootstrap credential: OWNER has specified an initial password scheme. The literal password value is **NOT recorded in this repository** (per S0 §13 Secret Handling — frozen rule). The literal value will be injected at implementation time through the S0 §25 External Parameter Gate via a secure channel (secret manager / environment variable / deployment-time configuration), and must be rotated upon first use. [CONFIRMED — requirement; the literal secret is OUT of repository scope]

Functional role and capabilities (OWNER-confirmed, per AISE §14 and §21):
- Fantomas is the highest-privileged system principal of JOURDAIN EMPLOI. [CONFIRMED]
- Fantomas has at minimum all the capabilities of the future SUPER_ADMIN role. [CONFIRMED]
- Fantomas additionally retains the bootstrap, recovery, and break-glass capabilities mandated by AISE §14. [CONFIRMED]
- Fantomas is distinct from ordinary ADMIN users and must not be treated as a simple administrative account. [CONFIRMED]
- Fantomas remains usable for exceptional system operations per AISE doctrine (bootstrap of the first privileged administrator, recovery when the ordinary authentication path or its primary dependency is unavailable, controlled emergency administrative access). [CONFIRMED]

Privilege inheritance (per AISE §21, OWNER-confirmed as applicable to JOURDAIN EMPLOI):
- Every operation authorized for SUPER_ADMIN must also be authorized for Fantomas. [CONFIRMED]
- SUPER_ADMIN does not automatically inherit Fantomas-only capabilities. [CONFIRMED]
- The distinction between effective SUPER_ADMIN capabilities and Fantomas identity is preserved. [CONFIRMED]

V1 ordinary interface (OWNER-confirmed):
- The V1 ordinary interface is NOT complexified with multiple roles. [CONFIRMED]
- The ordinary daily role remains a single **ADMIN** role. [CONFIRMED]
- Fantomas remains a special system principal, distinct from ordinary administrative users, and is not exposed as a regular role in the day-to-day interface. [CONFIRMED]

Design treatment (forward references to later AISE stages — NOT specified in S4):
- Functional requirements and expected behavior of Fantomas: S5. [CONFIRMED — routing decision]
- Authentication and authorization architecture for Fantomas: S6. [CONFIRMED — routing decision]
- Canonical technical decision / ADR if needed: S7. [CONFIRMED — routing decision]
- Work Package then implementation: S9 / S10. [CONFIRMED — routing decision]

S4 does NOT specify the technical implementation of Fantomas (no auth scheme, no password hashing algorithm, no session model, no database schema, no API). S4 records the functional requirement and the AISE mandate. Technical decisions are deferred to S6/S7. [CONFIRMED — S4 boundary]

**Public portal (unauthenticated):**
- Consultation of the list of published offers. [CONFIRMED]
- Opening of a published offer. [CONFIRMED]
- Consultation of the full detail of an offer. [CONFIRMED]
- Consultation of the application modalities when they are available. [CONFIRMED]

**Offer data fields (V1):**
- Title (required). [CONFIRMED]
- Description (required). [CONFIRMED]
- Company (optional). [CONFIRMED]
- Sector (optional). [CONFIRMED]
- Category (optional). [CONFIRMED]
- Contract type (optional). [CONFIRMED]
- Education level (optional). [CONFIRMED]
- Experience (optional). [CONFIRMED]
- Location (optional when unknown). [CONFIRMED]
- Publication date. [CONFIRMED]
- Expiry / closing date (optional). [CONFIRMED]
- Application modalities (optional). [CONFIRMED]
- Source (optional). [CONFIRMED]

**Public offer card display** (when data is available): title, company, location, contract type, publication date, expiry date, "Voir l'offre" action. [CONFIRMED]

**Public offer detail display** (when data is available): title, company, main information, dates, full description, application modalities, source. [CONFIRMED]

**Core data rules:**
- The system must never invent information absent from the source offer. [CONFIRMED]
- An absent optional field must not prevent publication. [CONFIRMED]

## 8. Out of Scope (V1)

The following are explicitly excluded from V1:

- Company logos. [CONFIRMED]
- "Apply" button (any kind of in-app application mechanism). [CONFIRMED]
- Social sharing (Facebook, WhatsApp, LinkedIn, generic share). [CONFIRMED]
- Candidate accounts. [CONFIRMED]
- CV / resume upload. [CONFIRMED]
- Favorites / bookmarks. [CONFIRMED]
- Messaging (between candidates and administration, or between any users). [CONFIRMED]
- Internal application (candidates applying through JOURDAIN EMPLOI). [CONFIRMED]
- Recruiter space (any third-party recruiter features). [CONFIRMED]
- Payment (any payment functionality). [CONFIRMED]
- AI matching (between offers and candidates, or any AI-driven recommendation). [CONFIRMED]
- Mobile application (native iOS/Android). [CONFIRMED]

These items are excluded from V1 by OWNER decision. They are not "future scope that may slip in" — they are explicit boundaries. Any future re-introduction of one of these items requires OWNER approval and a new AISE scope decision (likely a new S4 round or a CONTRACT_DIVERGENCE handling).

## 9. Project Boundary

V1 of JOURDAIN EMPLOI is a self-contained web portal. [CONFIRMED]

**Where the project begins:**
- The web application that the administration uses to manage offers.
- The web application that the public uses to consult published offers.
- The data store that holds offers.
- The hosting environment that serves both interfaces. [CONFIRMED]

**Where the project ends:**
- No integration with external recruitment systems in V1. [CONFIRMED]
- No syndication, RSS, or public API in V1. [ASSUMPTION — A1: no public read API is required for V1.]
- No import pipeline from external job boards in V1. [ASSUMPTION — A2: offers are entered manually by the administration. OWNER mentions "offre source" in the data rules, which suggests offers may originate from an external source; the mechanism by which an offer enters the system is unspecified. See Q4.]
- No outbound notifications (email, push, SMS) in V1. [ASSUMPTION — A3: based on the V1 scope and exclusions list which does not mention notifications.]

## 10. Constraints

**Technical constraints OWNER-stated (recorded as preferences for S6, not architecture decisions):**
- React. [CONFIRMED — preference]
- Next.js. [CONFIRMED — preference]
- TypeScript. [CONFIRMED — preference]
- Next.js App Router. [CONFIRMED — preference]
- Vercel as hosting platform. [CONFIRMED — preference]
- PostgreSQL Neon as database. [CONFIRMED — preference]
- Production environment separated from Preview environments. [CONFIRMED — constraint]

These preferences are recorded as inputs for S6 (Technical Specification). S4 does not evaluate, validate, or select among them. The final architecture decision happens in S6/S7.

**Architectural constraint:**
- No microservices, Kubernetes, Kafka, Elasticsearch, or other heavy architecture unless demonstrated necessary. [CONFIRMED]

**Process constraints:**
- All engineering work must follow AISE S0–S14 + R1–R7 protocols. [CONFIRMED]
- AISE FROZEN rules apply: §24 Contract Preservation, §25 External Parameter Gate. [CONFIRMED]
- AISE §13 Secret Handling (frozen): no passwords, tokens, database URLs, private keys, or production credentials may be stored in repository files. The Fantomas bootstrap password is therefore not recorded in this charter; its literal value will be injected via §25 at implementation time. [CONFIRMED]
- AISE §14 / §21 Ghost/Fantomas: JOURDAIN EMPLOI must include a Fantomas system principal with the capabilities and privilege inheritance semantics mandated by these sections. [CONFIRMED]
- AISE §23 (Zero Scheduled Work): no cron, no background monitoring, no recurring tasks without explicit OWNER authorization. [CONFIRMED]

**Priority order (OWNER-confirmed):**
1. Simplicity of use. [CONFIRMED]
2. Correct functioning. [CONFIRMED]
3. Security. [CONFIRMED]
4. Maintainability. [CONFIRMED]
5. Performance. [CONFIRMED]
6. Low complexity. [CONFIRMED]
7. Low operating cost. [CONFIRMED]

When two priorities conflict, the lower-numbered priority wins. This ordering is a confirmed governance rule for V1 decisions.

**Regulatory / language:**
- The charter is written in French (OWNER's working language). The application's UI language is assumed French. [ASSUMPTION — A4]
- GDPR compliance is assumed required given the handling of potentially personal data (e.g., contact information in application modalities) and the operating geography. [ASSUMPTION — A5]

## 11. Assumptions

All ASSUMPTION items in this charter, listed for OWNER review:

| ID | Assumption | Section |
|----|------------|---------|
| A1 | No public read API is required for V1. | 9. Project Boundary |
| A2 | Offers are entered manually by the administration (no automated import pipeline in V1). | 9. Project Boundary |
| A3 | No outbound notifications (email, push, SMS) are required in V1. | 9. Project Boundary |
| A4 | The application's UI language is French. | 10. Constraints |
| A5 | GDPR compliance is required. | 10. Constraints |
| A6 | The application is mono-tenant — a single JOURDAIN EMPLOI instance, not a multi-organization platform. | 9. Project Boundary (implicit) |
| A7 | The ordinary administration team is small (single-digit administrators); no fine-grained permission model is required in V1 for ordinary admins (the single ordinary daily role is ADMIN). This assumption does NOT apply to Fantomas, whose role and capabilities are CONFIRMED in Section 7. | 3. Users / Stakeholders |

Each ASSUMPTION will remain ASSUMPTION in the final charter unless OWNER explicitly confirms or corrects it. The agent must not upgrade ASSUMPTION to CONFIRMED silently (S4 §10 No silent promotion).

## 12. Dependencies

**Hard dependencies (blockers if absent):**
- A hosting account on Vercel. [CONFIRMED — required by OWNER preference, but account creation is out of S4 scope]
- A PostgreSQL database on Neon. [CONFIRMED — required by OWNER preference, but account creation is out of S4 scope]
- A canonical GitHub repository (already exists: `github.com/alexkanga/jourdain`). [CONFIRMED — present]
- OWNER-approved product requirements (S5 output). [CONFIRMED — required for next phase]
- OWNER-approved technical specification (S6 output). [CONFIRMED — required before implementation]

**Soft dependencies (nice-to-haves):**
- OWNER-provided design references for the public interface ("proches des références visuelles fournies"). [CONFIRMED — mentioned by OWNER; specific references not yet provided. See Q5.]
- OWNER-defined success metrics. [OPEN QUESTION — Q3]

## 13. Success Definition

V1 is successful when:

1. The administration can authenticate and access a private back-office. [CONFIRMED]
2. The administration can perform the complete offer lifecycle: create, record, modify, publish, suspend, archive. [CONFIRMED]
3. The administration can consult the list of all offers. [CONFIRMED]
4. The public can consult the list of published offers. [CONFIRMED]
5. The public can open a published offer and read its full detail, including application modalities when available. [CONFIRMED]
6. The system respects the priority order in Section 10 (simplicity first, then correctness, then security, etc.). [CONFIRMED]

Quantitative success criteria (number of offers supported, page load time, uptime SLO, adoption metrics) are not specified by OWNER. [OPEN QUESTION — Q3]

## 14. Material Risks

| Risk | Likelihood | Impact | Notes |
|------|------------|--------|-------|
| Scope creep toward a recruitment platform | Medium | High | The V1 boundary is firm (Section 8); any drift risks turning a small project into a large one. |
| Undefined success metrics | High | Medium | Without quantitative targets, "success" is subjective. See Q3. |
| Undefined "source offer" concept | Medium | Medium | OWNER mentions "offre source" in data rules; if offers come from external sources, an import process may be needed. See Q4. |
| Undefined administrative roles | Medium | Low-Medium | If multiple ordinary administrators exist, the absence of a permission model may create governance issues. See Q1. Fantomas is excluded from this risk (its role is CONFIRMED). |
| Technical complexity drift | Low | Medium | OWNER preferences (Next.js, Neon, Vercel) are reasonable, but the cumulative complexity must remain proportional to V1 scope. |
| Data privacy / GDPR | Medium | High | Job offers may contain personal contact information; GDPR compliance assumed required (A5) but not specified. |
| Hosted dependency on third parties (Vercel, Neon) | Low | Medium | Both are reliable, but an outage or pricing change could affect V1 operation. Acceptable for V1 per OWNER preferences. |
| Fantomas bootstrap credential mishandling | Medium | High | The initial Fantomas password is OWNER-specified and must not be stored in the repository (S0 §13). If accidentally committed, GitHub Secret Scanning may revoke access; if left unchanged after bootstrap, the system is exposed. Mitigation: rotate on first use, inject via §25 External Parameter Gate. |
| Fantomas privilege misuse | Low | High | Fantomas has highest privileges; misuse or compromise could compromise the entire system. Mitigation: break-glass use only, audit log, rotation. Technical controls deferred to S6/S7. |

This list is not exhaustive — it captures risks identifiable at charter level. Detailed risk analysis happens in S5/S6.

## 15. Open Questions / Decisions

All OPEN QUESTION items requiring OWNER input before S5:

| ID | Question | Why it matters | Charter impact |
|----|----------|----------------|----------------|
| Q1 | How many administrators will use the back-office? Do they need distinct roles (e.g., editor vs. publisher) or are all administrators equivalent? | Affects authentication model, permission granularity, and audit requirements. | Could shift scope from simple auth to RBAC. |
| Q2 | What is the current state of job-offer publication at JOURDAIN EMPLOI? Is there an existing system being replaced? | Affects migration scope and whether "source offer" implies imports. | Could add a migration workstream. |
| Q3 | What are the quantitative success criteria for V1? (e.g., offers supported, page load time, uptime SLO) | Without metrics, success is subjective. | Affects S5 acceptance criteria and S11 verification. |
| Q4 | What does "offre source" mean in practice? Are offers entered manually, imported from another system, or both? | Affects whether V1 needs an import feature or only manual entry. | Could expand scope (import pipeline) or confirm current scope (manual entry only). |
| Q5 | What are the specific visual references OWNER mentions for the public interface? | Affects S5 UI requirements and S6 UI architecture decisions. | May inform S6 but does not change V1 scope. |
| Q6 | Is the application strictly French-language, or does it need to support other languages in V1? | Affects i18n architecture in S6. | Could shift from simple French-only to i18n-aware design. |
| Q7 | What is the expected retention period for archived offers? When can they be deleted? | Affects data lifecycle and storage cost. | Could trigger a deletion/archival policy in S5. |
| Q8 | Are there constraints on where the application is hosted geographically (data residency)? | Affects Vercel region selection and Neon region. | Could constrain technical choices in S6. |

If OWNER resolves all OPEN QUESTIONS, the charter moves to all-CONFIRMED state. If some remain unresolved at S5 entry, they must be tracked through S5/S6 as decision-relevant items.

## 16. Evidence Register

Summary of evidence states across all charter claims:

| Evidence State | Count (approximate) |
|----------------|----------------------|
| CONFIRMED | ~70 (project identity, scope, exclusions, fields, lifecycle, priorities, technical preferences, Fantomas principal identity/role/capabilities/routing) |
| ASSUMPTION | 7 (A1–A7, listed in Section 11) |
| OPEN QUESTION | 8 (Q1–Q8, listed in Section 15) |

The charter is dominated by CONFIRMED elements because OWNER has provided a rich, structured input — including the Fantomas system principal as an additional confirmed requirement. The ASSUMPTION and OPEN QUESTION items are explicit and surfaced for OWNER review — none are buried.

Note on the Fantomas bootstrap credential: the existence of an OWNER-specified initial password is CONFIRMED, but the literal value is intentionally NOT recorded in this repository (per S0 §13). The literal value will be injected via S0 §25 External Parameter Gate at implementation time (S10) through a secure channel.

---

## Charter Approval

This charter is a DRAFT presented for OWNER review. It is NOT valid until OWNER explicitly approves it.

OWNER may:
- **Approve** — the charter is frozen and S4 is complete.
- **Request changes** — S4 revises and re-presents.
- **Provide additional information** — S4 incorporates and re-classifies.
- **Resolve OPEN QUESTIONS** — S4 updates the charter accordingly.
- **Confirm or correct ASSUMPTIONS** — S4 promotes to CONFIRMED or removes.

Per AISE S4 §8: an OWNER's absence of objection is NOT approval — explicit acknowledgment is required.

---

## Forward References

- S5 — Product Requirements / Cahier des Charges (`docs/engineering/AISE_PRODUCT_REQUIREMENTS.md`)
- S6 — Technical Specification (`docs/engineering/AISE_TECHNICAL_SPECIFICATION.md`)

S4 does NOT invent S5+ contents prematurely. The charter bounds S5; it does not pre-fill it.
