# PROJECT CHARTER — JOURDAIN EMPLOI

**Document type:** AISE S4 — Project Discovery / Charter
**Status:** FINAL DRAFT — READY FOR OWNER APPROVAL
**Date:** 2026-09-10 (initial draft), 2026-09-13 (finalized after OWNER revision decisions)
**Project:** JOURDAIN EMPLOI
**Canonical repository:** `github.com/alexkanga/jourdain`
**Canonical branch:** `main`
**Canonical HEAD at draft time:** `9b2cabd511dacb1f954e825ed3858ffb7c62fec3`

This charter is governed by the AISE protocol S4 (`docs/engineering/AISE_PROJECT_DISCOVERY_CHARTER.md`). It defines **what the project is and why it exists**, not the detailed product requirements (S5) nor the technical architecture (S6).

Every factual claim in this charter carries one of three evidence states:

- **CONFIRMED** — directly stated by OWNER, or verifiable from authoritative source.
- **ASSUMPTION** — reasonable inference consistent with OWNER intent, but not explicitly confirmed. Every ASSUMPTION is presented for OWNER review.
- **OPEN QUESTION** — materially unresolved, decision-relevant. Every OPEN QUESTION is presented to OWNER with enough context for a decision.
- **DEFERRED DECISION** — not resolved at S4, but explicitly NOT a blocker for S5 or V1. Will be examined at the appropriate later AISE stage (typically S6 technical specification).

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

The ordinary administration team is small (single-digit administrators). The V1 ordinary interface uses a single ADMIN role; no complex RBAC is required for V1. The exact number of administrators is not necessary to complete S4 — V1 must support a small administrative team without a mandatory quantitative assumption. [CONFIRMED — OWNER revision decision §4 + §13]

## 4. Current State / Pain Points

OWNER has not described the current state of job-offer publication at JOURDAIN EMPLOI. Whether offers are currently published via email, social media, PDF, another job board, or not at all is not stated. This is not a blocker for V1: the V1 charter records the absence of a dedicated JOURDAIN EMPLOI publication portal as the confirmed motivation, without claiming to replace a specific existing system. [CONFIRMED — OWNER revision decision §11 + §14; former Q2 reclassified as DEFERRED DECISION — D2]

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

Measurable success targets: the V1 is primarily functional, not based on quantitative traffic or adoption metrics. Quantitative success criteria (number of offers supported, page load time, uptime SLO, audience metrics) are explicitly NOT required as a V1 delivery condition. The V1 success criteria are functional — see Section 13. [CONFIRMED — OWNER revision decision §11]

## 7. High-Level Scope

The V1 scope covers the following functional areas:

**Administration back-office (authenticated, single ordinary role: ADMIN):**
- Authentication of the administration (login). [CONFIRMED — OWNER revision decision §4]
- Consultation of the administrative list of offers (all statuses). [CONFIRMED — OWNER revision decision §4]
- Creation of an offer. [CONFIRMED — OWNER revision decision §4]
- Recording of an offer (saving it without publishing). [CONFIRMED — OWNER revision decision §4]
- Modification of an offer. [CONFIRMED — OWNER revision decision §4]
- Publication of an offer. [CONFIRMED — OWNER revision decision §4]
- Suspension of a published offer. [CONFIRMED — OWNER revision decision §4]
- Archiving of an offer. [CONFIRMED — OWNER revision decision §4]

The V1 ordinary interface is intentionally simple: a single ADMIN role, no complex RBAC. [CONFIRMED — OWNER revision decision §4]

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

**Public portal (unauthenticated) — main user journey:**

The public main journey is: List of published offers → "Voir l'offre" → Read the full detail. [CONFIRMED — OWNER revision decision §5]

- Consultation of the list of published offers. [CONFIRMED — OWNER revision decision §5]
- Opening a published offer ("Voir l'offre" action). [CONFIRMED — OWNER revision decision §5]
- Consultation of the full detail of an offer. [CONFIRMED — OWNER revision decision §5]
- Consultation of the application modalities when they are available. [CONFIRMED — OWNER revision decision §5]

The public does not need an account. [CONFIRMED — OWNER revision decision §5]

**Offer data fields (V1):**

Required fields:
- Title (required). [CONFIRMED — OWNER revision decision §16]
- Description (required). [CONFIRMED — OWNER revision decision §16]

Optional fields (an absent optional field must NOT prevent recording or publishing — see Core data rules below):
- Company (optional). [CONFIRMED — OWNER revision decision §16]
- Sector (optional). [CONFIRMED — OWNER revision decision §16]
- Category (optional). [CONFIRMED — OWNER revision decision §16]
- Contract type (optional). [CONFIRMED — OWNER revision decision §16]
- Education level (optional). [CONFIRMED — OWNER revision decision §16]
- Experience (optional). [CONFIRMED — OWNER revision decision §16]
- Location (optional, especially when unknown). [CONFIRMED — OWNER revision decision §16]
- Expiry / closing date (optional). [CONFIRMED — OWNER revision decision §16]
- Source (optional). When known, the administration can record: source name, source URL. [CONFIRMED — OWNER revision decision §6 + §16]
- Application modalities / information (optional). [CONFIRMED — OWNER revision decision §16]
- Publication date. [CONFIRMED]

**Public offer card display** (when data is available): title, company, location, contract type, publication date, expiry date, "Voir l'offre" action. [CONFIRMED]

**Public offer detail display** (when data is available): title, company, main information, dates, full description, application modalities, source. [CONFIRMED]

**Core data rules:**
- The system must never invent information absent from the source offer. [CONFIRMED — OWNER revision decision §16]
- An absent optional field must not prevent recording or publication. [CONFIRMED — OWNER revision decision §16]

**Offer creation mode:**
- Offers are created manually by the administration. [CONFIRMED — OWNER revision decision §3]
- No automatic import or collection mechanism in V1. [CONFIRMED — OWNER revision decision §3 + §6]

**Archiving behavior:**
- An archived offer is retained in the database. [CONFIRMED — OWNER revision decision §7]
- No automatic deletion of archived offers in V1. [CONFIRMED — OWNER revision decision §7]
- A precise retention duration is not required to start V1. [CONFIRMED — OWNER revision decision §7]

## 8. Out of Scope (V1)

The following are explicitly excluded from V1:

- Company logos. [CONFIRMED — OWNER revision decision §17]
- "Apply" button (any kind of in-app application mechanism). [CONFIRMED — OWNER revision decision §17]
- Social sharing (Facebook, WhatsApp, LinkedIn, generic share). [CONFIRMED — OWNER revision decision §17]
- Candidate accounts. [CONFIRMED — OWNER revision decision §17]
- CV / resume upload. [CONFIRMED — OWNER revision decision §17]
- Favorites / bookmarks. [CONFIRMED — OWNER revision decision §17]
- Messaging (between candidates and administration, or between any users). [CONFIRMED — OWNER revision decision §17]
- Internal application (candidates applying through JOURDAIN EMPLOI). [CONFIRMED — OWNER revision decision §17]
- Recruiter space (any third-party recruiter features). [CONFIRMED — OWNER revision decision §17]
- Payment (any payment functionality). [CONFIRMED — OWNER revision decision §17]
- AI matching (between offers and candidates, or any AI-driven recommendation). [CONFIRMED — OWNER revision decision §17]
- Mobile application (native iOS/Android). [CONFIRMED — OWNER revision decision §17]
- Notifications (email, push, SMS, any kind). [CONFIRMED — OWNER revision decision §9 + §17]
- Automatic import of offers (no automated collection or import pipeline). [CONFIRMED — OWNER revision decision §3 + §17]
- Public API (no public product API). Internal endpoints required for Next.js operation will be defined in S6 but are NOT a public product API. [CONFIRMED — OWNER revision decision §8 + §17]
- Multilingual support (V1 is French only). [CONFIRMED — OWNER revision decision §2 + §17]
- Multi-tenant (V1 is a single application operated by JOURDAIN EMPLOI). [CONFIRMED — OWNER revision decision §1 + §17]
- Complex RBAC (V1 uses a single ordinary ADMIN role; Fantomas is the only other principal and is governed by AISE §14/§21). [CONFIRMED — OWNER revision decision §4 + §17]

These items are excluded from V1 by OWNER decision. They are not "future scope that may slip in" — they are explicit boundaries. Any future re-introduction of one of these items requires OWNER approval and a new AISE scope decision (likely a new S4 round or a CONTRACT_DIVERGENCE handling).

## 9. Project Boundary

V1 of JOURDAIN EMPLOI is a self-contained, mono-tenant web portal operated by JOURDAIN EMPLOI. [CONFIRMED — OWNER revision decision §1]

**Where the project begins:**
- The web application that the administration uses to manage offers.
- The web application that the public uses to consult published offers.
- The data store that holds offers.
- The hosting environment that serves both interfaces. [CONFIRMED]

**Where the project ends:**
- No integration with external recruitment systems in V1. [CONFIRMED]
- No syndication, RSS, or public API in V1. Internal endpoints required for Next.js operation are NOT a public product API and will be defined in S6. [CONFIRMED — OWNER revision decision §8]
- No import pipeline from external job boards in V1. Offers are entered manually by the administration. [CONFIRMED — OWNER revision decision §3 + §6]
- No outbound notifications (email, push, SMS) in V1. [CONFIRMED — OWNER revision decision §9]
- No multilingual support in V1. [CONFIRMED — OWNER revision decision §2]

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
- The charter is written in French (OWNER's working language). The V1 application UI is French only. Multilingual support is out of scope for V1. [CONFIRMED — OWNER revision decision §2]
- GDPR compliance: the handling of potentially personal data (e.g., contact information in application modalities) is acknowledged. Detailed GDPR and data-residency constraints are NOT a blocker for S4 or V1 functional scope; they will be examined at the appropriate technical stage (S6). [CONFIRMED — OWNER revision decision §14; former A5 / Q8 reclassified as DEFERRED DECISION — D1/D3]

**Operational mode:**
- V1 is a single application operated by JOURDAIN EMPLOI (mono-tenant). [CONFIRMED — OWNER revision decision §1]

**Volumetry:**
- Exact volumetry is not known today. V1 starts with a normal editorial job-offer portal volumetry — no quantitative capacity assumption is required. S6 will choose a simple architecture that can evolve without premature oversizing. This phrase is NOT to be turned into a quantitative capacity assumption. [CONFIRMED — OWNER revision decision §12]

**UX/UI references:**
- The screenshots provided by OWNER constitute the reference UX/UI orientation for V1. Principles: simple interface, low visual overload, sober offer cards, readability first, no logos, no sharing, no Apply button. [CONFIRMED — OWNER revision decision §10]

## 11. Assumptions

All previous ASSUMPTION items (A1–A7) have been resolved by OWNER revision decisions and are now CONFIRMED (see Sections 7, 9, 10). The agent has not silently promoted ASSUMPTION to CONFIRMED — each promotion is grounded in an explicit OWNER revision decision referenced in the relevant section.

**Remaining ASSUMPTION items: NONE.**

Reclassification summary:

| Former ID | Former assumption | Resolution | New state |
|-----------|-------------------|------------|-----------|
| A1 | No public read API in V1 | OWNER revision §8 | CONFIRMED (Section 9) |
| A2 | Offers entered manually (no automated import) | OWNER revision §3 + §6 | CONFIRMED (Section 9) |
| A3 | No outbound notifications in V1 | OWNER revision §9 | CONFIRMED (Section 9) |
| A4 | UI is French only | OWNER revision §2 | CONFIRMED (Section 10) |
| A5 | GDPR compliance required | OWNER revision §14 — not a blocker for S4/V1 | DEFERRED DECISION D1 (Section 10) |
| A6 | Mono-tenant | OWNER revision §1 | CONFIRMED (Section 9) |
| A7 | Small admin team, single ADMIN role, no complex RBAC | OWNER revision §4 + §13 | CONFIRMED (Section 3 + Section 7) |

## 12. Dependencies

**Hard dependencies (blockers if absent):**
- A hosting account on Vercel. [CONFIRMED — required by OWNER preference, but account creation is out of S4 scope]
- A PostgreSQL database on Neon. [CONFIRMED — required by OWNER preference, but account creation is out of S4 scope]
- A canonical GitHub repository (already exists: `github.com/alexkanga/jourdain`). [CONFIRMED — present]
- OWNER-approved product requirements (S5 output). [CONFIRMED — required for next phase]
- OWNER-approved technical specification (S6 output). [CONFIRMED — required before implementation]

**Soft dependencies (nice-to-haves):**
- OWNER-provided screenshots for UX/UI orientation. [CONFIRMED — OWNER revision decision §10]

## 13. Success Definition

The V1 success criteria are primarily functional, not quantitative. The V1 is successful if the following user journeys work correctly:

**ADMIN journey (functional success criterion):**

Login → List of offers → New offer → Data entry → Save → Find the offer → Modify → Publish → Suspend / Archive. [CONFIRMED — OWNER revision decision §11]

**PUBLIC journey (functional success criterion):**

Access the list of published offers → Open an offer → Read its full detail. [CONFIRMED — OWNER revision decision §11]

No quantitative audience metric (traffic, conversion, adoption count) is required as a V1 delivery condition. [CONFIRMED — OWNER revision decision §11]

General V1 success conditions (carried from earlier sections):

1. The administration can authenticate and access a private back-office. [CONFIRMED]
2. The administration can perform the complete offer lifecycle: create, record, modify, publish, suspend, archive. [CONFIRMED]
3. The administration can consult the list of all offers. [CONFIRMED]
4. The public can consult the list of published offers. [CONFIRMED]
5. The public can open a published offer and read its full detail, including application modalities when available. [CONFIRMED]
6. The system respects the priority order in Section 10 (simplicity first, then correctness, then security, etc.). [CONFIRMED]

## 14. Material Risks

| Risk | Likelihood | Impact | Notes |
|------|------------|--------|-------|
| Scope creep toward a recruitment platform | Medium | High | The V1 boundary is firm (Section 8); any drift risks turning a small project into a large one. |
| Technical complexity drift | Low | Medium | OWNER preferences (Next.js, Neon, Vercel) are reasonable, but the cumulative complexity must remain proportional to V1 scope. |
| Data privacy / GDPR | Medium | High | Job offers may contain personal contact information. Detailed GDPR constraints deferred to S6 (D1). Not a blocker for S5/V1 functional scope. |
| Hosted dependency on third parties (Vercel, Neon) | Low | Medium | Both are reliable, but an outage or pricing change could affect V1 operation. Acceptable for V1 per OWNER preferences. |
| Fantomas bootstrap credential mishandling | Medium | High | The initial Fantomas password is OWNER-specified and must not be stored in the repository (S0 §13). If accidentally committed, GitHub Secret Scanning may revoke access; if left unchanged after bootstrap, the system is exposed. Mitigation: rotate on first use, inject via §25 External Parameter Gate. |
| Fantomas privilege misuse | Low | High | Fantomas has highest privileges; misuse or compromise could compromise the entire system. Mitigation: break-glass use only, audit log, rotation. Technical controls deferred to S6/S7. |

Risks previously associated with undefined success metrics, undefined "source offer" concept, and undefined administrative roles have been removed — these items are now CONFIRMED by OWNER revision decisions §3, §4, §6, §11, §13.

This list is not exhaustive — it captures risks identifiable at charter level. Detailed risk analysis happens in S5/S6.

## 15. Open Questions / Decisions

All previous OPEN QUESTION items (Q1–Q8) have been resolved by OWNER revision decisions or explicitly reclassified as DEFERRED DECISIONS that are NOT blockers for S5 or V1.

**Remaining OPEN QUESTION items: NONE.**

**DEFERRED DECISION items** (NOT blockers for S5 or V1 — will be examined at the appropriate later AISE stage, typically S6):

| ID | Deferred decision | Why it is NOT a blocker for S5 / V1 | Stage where it will be examined |
|----|-------------------|--------------------------------------|--------------------------------|
| D1 | Detailed GDPR / data-privacy constraints (data minimization, retention rules, consent flows if any) | OWNER revision §14 explicitly states that detailed regulatory constraints should NOT become a functional S4 blocker. The functional V1 scope (Sections 7–9) does not depend on these details. | S6 (technical specification) |
| D2 | Current state of job-offer publication at JOURDAIN EMPLOI (is there an existing system being replaced? migration scope?) | OWNER revision §11 + §14 establish that V1 success is functional and migration scope is not a V1 requirement. If a migration need surfaces later, it will be handled as a separate workstream. | S5 or later, only if OWNER identifies a migration need |
| D3 | Data residency / hosting region constraints | OWNER revision §14 explicitly defers regulatory/geographic constraints to the appropriate technical stage. Vercel and Neon default regions are acceptable for V1 unless a specific constraint is identified. | S6 (technical specification) |

The reclassification is grounded in explicit OWNER revision decisions §11, §12, §13, §14. No OPEN QUESTION has been silently closed — each closure or deferral is traceable to a specific OWNER decision.

If OWNER resolves any DEFERRED DECISION before S5 entry, it can be promoted to CONFIRMED in a subsequent charter revision. If a DEFERRED DECISION becomes materially relevant during S5, it will be surfaced as a new OPEN QUESTION at that time.

## 16. Evidence Register

Summary of evidence states across all charter claims:

| Evidence State | Count (approximate) |
|----------------|----------------------|
| CONFIRMED | ~110 (project identity, scope, exclusions, fields, lifecycle, priorities, technical preferences, Fantomas principal, all resolved OWNER revision decisions §1–§13, §15–§17) |
| ASSUMPTION | 0 (all previous A1–A7 have been resolved — see Section 11 reclassification summary) |
| OPEN QUESTION | 0 (all previous Q1–Q8 have been resolved or reclassified as DEFERRED DECISIONS — see Section 15) |
| DEFERRED DECISION | 3 (D1 GDPR details, D2 migration scope, D3 data residency — all explicitly NOT blockers for S5 or V1, per OWNER revision §14) |

The charter is now dominated by CONFIRMED elements. No ASSUMPTION or OPEN QUESTION remains. Three DEFERRED DECISIONS are explicitly tracked and explicitly NOT blockers — they will be examined at the appropriate later AISE stage (typically S6).

Note on the Fantomas bootstrap credential: the existence of an OWNER-specified initial password is CONFIRMED, but the literal value is intentionally NOT recorded in this repository (per S0 §13). The literal value will be injected via S0 §25 External Parameter Gate at implementation time (S10) through a secure channel.

Verdict: **CHARTER READY FOR OWNER APPROVAL = YES.** All material charter claims are CONFIRMED. The 3 DEFERRED DECISIONS are explicitly NOT blockers for S5 or V1. The charter is bounded to S4 (WHAT / WHY / USERS / SCOPE / CONSTRAINTS) and does NOT pre-empt S5 (product requirements) or S6 (technical architecture).

---

## Charter Approval

This charter is a **FINAL DRAFT** presented for OWNER review and explicit approval. It is NOT valid until OWNER explicitly approves it.

All previous ASSUMPTION items have been resolved. All previous OPEN QUESTION items have been resolved or reclassified as DEFERRED DECISIONS (not blockers for S5 or V1). The charter is ready for OWNER approval.

OWNER may:
- **Approve** — the charter is frozen and S4 is complete; PROJECT_STATE is updated to S4 CLOSED / PASS — CHARTER APPROVED.
- **Request changes** — S4 revises and re-presents.
- **Provide additional information** — S4 incorporates and re-classifies.

Per AISE S4 §8: an OWNER's absence of objection is NOT approval — explicit acknowledgment is required.

---

## Forward References

- S5 — Product Requirements / Cahier des Charges (`docs/engineering/AISE_PRODUCT_REQUIREMENTS.md`)
- S6 — Technical Specification (`docs/engineering/AISE_TECHNICAL_SPECIFICATION.md`)

S4 does NOT invent S5+ contents prematurely. The charter bounds S5; it does not pre-fill it.
