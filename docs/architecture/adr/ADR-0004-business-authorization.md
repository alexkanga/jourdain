# ADR-0004 — Business Authorization: principalType + can()/requireCapability() + Fantomas Hierarchy

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-003 (auth-authorization separation)
RELATED REQ IDS:  PERM-001, PERM-002, PERM-003, PERM-004, AISE S0 §14/§21

CONTEXT:
AISE S0 §14 and §21 mandate a Fantomas principal that inherits ALL SUPER_ADMIN capabilities PLUS Fantomas-only break-glass capabilities, where SUPER_ADMIN does NOT inherit Fantomas-only. V1 has a single ordinary ADMIN role and no complex RBAC. Better Auth authenticates but must NOT be the business authorization authority.

DECISION:
- Business principal field: `principalType` (enum: 'ADMIN' | 'FANTOMAS') on the user table — the JOURDAIN EMPLOI source of truth for authorization.
- Better Auth `role` field: reserved for Admin plugin internals; NOT used for business authorization.
- Authorization layer: `can(principal, capability)` / `requireCapability(capability)` in `lib/server/auth/authorization.ts` — INDEPENDENT of Better Auth. Reads `principalType`, NOT `role`.
- Capability matrix:
  - ADMIN_CAPABILITIES: offer:create, offer:edit, offer:save, offer:publish, offer:suspend, offer:republish, offer:archive, admin:login.
  - FANTOMAS_EXTRA_CAPABILITIES: system:bootstrap, system:recovery.
  - Fantomas inherits ADMIN_CAPABILITIES + FANTOMAS_EXTRA_CAPABILITIES.
  - ADMIN does NOT inherit FANTOMAS_EXTRA_CAPABILITIES.
- Future SUPER_ADMIN (DR-051, not in V1): if added, its capabilities must also be accessible to Fantomas. The can() abstraction makes this a localized change.

ALTERNATIVES CONSIDERED:
- Use Better Auth `role` as business authorization source — rejected: couples business logic to auth library internals; violates separation of concerns (OWNER §2); if Better Auth is replaced, authorization semantics would be lost.
- RBAC framework — rejected: V1 has a single ADMIN role; no complex RBAC needed (OWNER §4, §18); can() abstraction covers V1 and is extensible for future SUPER_ADMIN.
- Better Auth Admin plugin as authorization — rejected: the Admin plugin is a technical mechanism for user creation, not a business authorization system (OWNER §3, §6).

RATIONALE:
The separation between authentication (Better Auth) and authorization (can/requireCapability) ensures Fantomas semantics (AISE §14/§21) are preserved regardless of the auth library. principalType is a clean business field, independent of Better Auth's internal role. The can() function is the single place that decides which principalType has which capability — no scattered `if role === ...` checks.

CONSEQUENCES:
+ Authorization logic is library-independent.
+ Fantomas inheritance is explicit and matches AISE §21 exactly.
+ Future SUPER_ADMIN extension is a localized change (add SUPER_ADMIN_CAPABILITIES array; Fantomas inherits it).
+ No complex RBAC framework in V1.
- Two fields on user table (principalType + role) — slight redundancy, justified by separation of concerns.

VERIFICATION:
Unit tests: can('admin', 'offer:publish') === true; can('fantomas', 'system:bootstrap') === true; can('admin', 'system:bootstrap') === false. Integration tests: requireCapability() enforces in each Server Action.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §13 (authorization), AISE S0 §14 (FANTOMAS/GHOST), §21 (privilege inheritance)
