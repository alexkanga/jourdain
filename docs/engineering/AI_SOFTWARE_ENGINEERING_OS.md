AI SOFTWARE ENGINEERING OS
======================================================================

Version: 0.4
Status: CLOSED / PASS / CANONICAL
Distribution: UNIVERSAL PORTABLE
Frozen Rules: §24 CONTRACT PRESERVATION · §25 EXTERNAL PARAMETER GATE · §26 REMOTE RUNTIME COST & QUOTA SAFETY · §27 PRODUCT DELIVERY FIRST & COMPLEXITY BUDGET · §28 DATABASE CONTINUITY & RECONSTRUCTION DOCTRINE

Operational implementation:
  S1 — AISE Universal Launcher → docs/engineering/AISE_UNIVERSAL_LAUNCHER.md
  S2 — AISE Task Router → docs/engineering/AISE_TASK_ROUTER.md
  S3 — AISE New Project Bootstrap → docs/engineering/AISE_NEW_PROJECT_BOOTSTRAP.md
  S4 — AISE Project Discovery / Charter → docs/engineering/AISE_PROJECT_DISCOVERY_CHARTER.md
  S5 — AISE Product Requirements → docs/engineering/AISE_PRODUCT_REQUIREMENTS.md
  S6 — AISE Technical Specification → docs/engineering/AISE_TECHNICAL_SPECIFICATION.md
  S7 — AISE Project Manifest + ADR → docs/engineering/AISE_PROJECT_MANIFEST_ADR.md
  S8 — AISE Roadmap / Milestone Design → docs/engineering/AISE_ROADMAP_MILESTONE_DESIGN.md
  S9 — AISE Module Contract / Work Package → docs/engineering/AISE_MODULE_CONTRACT_WORK_PACKAGE.md
  S10 — AISE Implementation Execution → docs/engineering/AISE_IMPLEMENTATION_EXECUTION.md
  S11 — AISE Verification & Acceptance → docs/engineering/AISE_VERIFICATION_ACCEPTANCE.md
  S12 — AISE Release Readiness / Preproduction → docs/engineering/AISE_RELEASE_READINESS_PREPRODUCTION.md
  S13 — AISE Production Deployment & Verification → docs/engineering/AISE_PRODUCTION_DEPLOYMENT_VERIFICATION.md
  S14 — AISE Operational Handover / Baseline Closure → docs/engineering/AISE_OPERATIONAL_HANDOVER_BASELINE_CLOSURE.md
  R1 — AISE Module / Change Protocol → docs/engineering/AISE_MODULE_CHANGE_PROTOCOL.md
  R2 — AISE Hotfix Protocol → docs/engineering/AISE_HOTFIX_PROTOCOL.md
  R3 — AISE Recovery Protocol → docs/engineering/AISE_RECOVERY_PROTOCOL.md
  R4 — AISE Investigation Protocol → docs/engineering/AISE_INVESTIGATION_PROTOCOL.md
  R5 — AISE Contract Divergence Protocol → docs/engineering/AISE_CONTRACT_DIVERGENCE_PROTOCOL.md
  R6 — AISE Governance Change Protocol → docs/engineering/AISE_GOVERNANCE_CHANGE_PROTOCOL.md
  R7 — AISE Brownfield Adoption Protocol → docs/engineering/AISE_BROWNFIELD_ADOPTION_PROTOCOL.md

Canonical component topology and lifecycle:
  AISE_ROADMAP → docs/engineering/AISE_ROADMAP.md

======================================================================
0. PURPOSE
======================================================================

AI SOFTWARE ENGINEERING OS defines HOW AI-assisted software engineering
must be executed.

It does NOT define the business requirements of a specific application.

Primary objective:

deterministic
maintainable
agent-independent
human-maintainable
minimum-complexity

software development.

Core principles:

NEVER DEVELOP FROM MEMORY.

DEVELOP FROM VERIFIED STATE.

ONE VERIFIED CHANGE AT A TIME.

DESIGN ENOUGH
→ IMPLEMENT
→ TEST
→ FIX OBSERVED DEFECTS
→ VERIFY
→ COMMIT
→ PUSH
→ CLOSE
→ CONTINUE ONLY AFTER OWNER GO.

======================================================================
1. TWO PLANES OF TRUTH
======================================================================

A. FACTUAL CURRENT STATE

Established from verified evidence such as:

canonical Git repository
branch
HEAD
current files
migrations
schema
executed tests
verified runtime/deployment state

B. INTENDED STATE

Established from:

OWNER-approved product requirements
accepted project manifest/technical specification
accepted architecture decisions
approved module/workstream contract

If factual state and intended state differ:

REPORT THE DIVERGENCE.

Do not silently rewrite either side.

Conversation history and AI memory are contextual aids only.

They are not sufficient project truth.

======================================================================
2. TASK ROUTER
======================================================================

Before work classify the primary task:

NEW_PROJECT
PROJECT_INTAKE
NEW_MODULE
FEATURE_CHANGE
HOTFIX
INVESTIGATION
MIGRATION
RECOVERY
RELEASE
CONTRACT_DIVERGENCE

CONTRACT_DIVERGENCE triggers when observed factual behavior
does not match OWNER-approved intended behavior.

Required before action:

CLASSIFY
  → IMPLEMENTATION DEFECT → HOTFIX
  → TEST DEFECT → TEST CORRECTION
  → FIXTURE/DATA DEFECT → DATA/FIXTURE CORRECTION
  → ENVIRONMENT DEFECT → ENVIRONMENT RECOVERY
  → SPECIFICATION AMBIGUITY → OWNER DECISION
  → UNKNOWN → INVESTIGATION

UNKNOWN → WORKAROUND is PROHIBITED.

Do not create a workaround before the cause is classified.

Do not turn a small defect into an architecture project.

Do not treat INVESTIGATION as authorization to modify software.

======================================================================
3. MANDATORY RE-ENTRY GATE
======================================================================

Before every implementation unit verify at minimum:

repository root
origin
branch
HEAD
worktree
last known checkpoint
current authorized unit

If expected state != actual state:

STOP IMPLEMENTATION.

Resolve only the blocking divergence necessary to restore a known base.

Do not automatically perform historical archaeology.

If OWNER explicitly accepts a clean canonical GitHub baseline,
abandoned local work does not need to be reconstructed.

======================================================================
4. ONE AUTHORIZED UNIT AT A TIME
======================================================================

Only one functional unit may be IN_PROGRESS.

Each unit must define enough of:

OBJECTIVE
IN SCOPE
OUT OF SCOPE
DEPENDENCIES
BUSINESS RULES
ACCEPTANCE CRITERIA
REQUIRED TESTS
DEFINITION OF DONE

to implement it safely.

Completion of one unit does not authorize the next.

OWNER GO is required for the next major unit.

======================================================================
5. DEFAULT DEVELOPMENT LOOP
======================================================================

For every authorized implementation unit:

VERIFIED BASE
→ INSPECT RELEVANT EXISTING IMPLEMENTATION
→ REUSE CANONICAL COMPONENTS
→ IMPLEMENT MINIMUM SUFFICIENT CHANGE
→ TARGETED TESTS
→ FIX OBSERVED DEFECTS
→ REQUIRED QUALITY GATES
→ FUNCTIONAL VERIFICATION WHEN REQUIRED
→ REVIEW GIT DIFF
→ COMMIT
→ PUSH CHECKPOINT
→ UPDATE PROJECT STATE
→ CLOSED
→ STOP

Never automatically continue into the next module.

======================================================================
6. MAINTAINABLE CODE / NO SPAGHETTI
======================================================================

Future code must follow the canonical architecture already present unless
an approved architecture decision explicitly changes it.

Prefer:

cohesive modules
clear naming
explicit contracts
separation of responsibilities
canonical services
canonical data-access patterns
typed boundaries
reusable business logic
small understandable changes
testability

Keep appropriately separated:

BUSINESS LOGIC
DATA ACCESS
VALIDATION
AUTHORIZATION
PRESENTATION / UI

Avoid:

duplicated business logic
parallel service implementations
parallel API conventions
giant mixed-responsibility modules
UI containing hidden business rules
database access bypassing canonical conventions
speculative abstractions
unrelated refactoring
framework proliferation
magic business constants

A human developer must be able to maintain the application without
reading historical AI conversations.

======================================================================
7. INSPECT BEFORE CREATE
======================================================================

Before creating a:

service
API route
database table
migration
component
validator
calculation engine
state store
utility

search for the canonical existing implementation.

IF EXISTS:
reuse or extend it.

IF PARTIAL:
extend only the minimum necessary layer.

IF ABSENT:
create it according to current architecture.

Never create a parallel architecture simply because it is easier.

======================================================================
8. INVESTIGATION VS IMPLEMENTATION
======================================================================

INVESTIGATION is read-only by default.

Authorized investigation actions:

READ
SEARCH
TRACE
REPRODUCE
COMPARE
DIAGNOSE

Investigation does NOT automatically authorize:

code changes
database changes
migrations
dependency changes
commits
pushes

A defect investigation should establish:

SYMPTOM
EXPECTED
ACTUAL
ROOT CAUSE
MINIMAL FIX

Then implementation may proceed when authorized.

======================================================================
9. HOTFIX PROTOCOL
======================================================================

HOTFIX follows:

VERIFIED BASE
→ REPRODUCE DEFECT
→ IDENTIFY ROOT CAUSE
→ IMPLEMENT MINIMUM FIX
→ ADD/UPDATE REGRESSION TEST
→ TARGETED TESTS
→ REQUIRED QUALITY GATES
→ FUNCTIONAL VERIFICATION
→ REVIEW DIFF
→ COMMIT
→ PUSH
→ CLOSED
→ STOP

Do not broaden a hotfix into unrelated cleanup.

======================================================================
10. TEST DISCIPLINE
======================================================================

A failing test means:

CAUSE UNKNOWN.

It does not automatically mean:

CODE WRONG

or:

TEST WRONG.

Determine expected behavior first.

Fix the correct layer.

Never weaken a valid test merely to obtain PASS.

Use the smallest useful test level first:

PURE
→ SERVICE
→ INTEGRATION
→ API
→ UI
→ E2E

Use real E2E when the real user workflow itself is an acceptance
criterion.

Mocks do not replace required real integration evidence.

======================================================================
11. DATABASE / MIGRATION DISCIPLINE
======================================================================

Never modify database schema merely to make code or a test pass.

If code and database disagree, classify first:

WRONG ENVIRONMENT
WRONG DATABASE
MISSING MIGRATION
OUTDATED DATABASE
OUTDATED CODE
SCHEMA DRIFT
WRONG ASSUMPTION

Schema changes must use the project's canonical migration mechanism.

Never introduce a competing migration system.

Production DB writes require explicit authorization.

For database-backed projects, maintain a Database Continuity &
Reconstruction Dossier (DCD) per §28. Database contract changes
MUST trigger a DCD update before work unit closure.

======================================================================
12. GIT DISCIPLINE
======================================================================

Default:

ONE AGENT
ONE WORKTREE
ONE GIT WRITER

Before implementation verify:

branch
HEAD
worktree

Before commit:

review git diff
review scope

Commit only files belonging to the authorized unit.

Do not include:

unrelated files
temporary files
debug files
secrets
future-module work

A meaningful CLOSED unit must receive a durable Git checkpoint.

Push the checkpoint to the canonical remote.

Completed work must not rely exclusively on local commits.

======================================================================
13. DEFECT / TECHNICAL DEBT POLICY
======================================================================

Fix observed defects that materially affect the authorized unit.

Do not create a repository-wide audit because one local defect appears.

Critical/material blockers prevent closure.

Non-blocking observations go to backlog.

A backlog item is not automatically authorized work.

Do not automatically create:

TECHNICAL DEBT PROJECT
ARCHITECTURE HARDENING PROJECT
TEST EXPANSION PROJECT
LINT CLEANUP PROJECT
GENERAL REFACTOR PROJECT

unless:

OWNER explicitly prioritizes it

or

it materially blocks authorized functionality

or

an observed production defect requires it.

======================================================================
14. BREAK-GLASS GHOST / FANTOMAS PRINCIPLE
======================================================================

Every future application governed by AI SOFTWARE ENGINEERING OS must
include a planned break-glass system principal concept, referred to
generically as:

GHOST / FANTOMAS.

PURPOSE:

bootstrap the first privileged administrator;

provide controlled emergency administrative access;

support recovery when ordinary authentication or its primary dependency
is unavailable;

provide the privileged capabilities necessary to restore/manage the
application during exceptional situations.

AUTHORIZATION:

Ghost/Fantomas is intentionally capable of full privileged access after
successful break-glass authentication.

The exact implementation is PROJECT-SPECIFIC.

The OS mandates the CAPABILITY.

It does NOT mandate any project's exact implementation.

Where technically feasible, Ghost/Fantomas should not depend exclusively
on the same authentication/database path it is intended to recover.

The implementation still depends on the minimum application/runtime
infrastructure necessary for the application itself to execute.

Project implementation must define the controls necessary for:

authentication
access
secret/configuration handling
auditability
bootstrap/recovery behavior

according to the project's architecture.

======================================================================
15. ENVIRONMENTS
======================================================================

Before any mutation know the target environment.

DEV
TEST
PREVIEW
STAGING
PRODUCTION

are not interchangeable.

Production is not implicitly writable during development.

Production mutation requires explicit authorization.

======================================================================
16. RELEASE
======================================================================

MODULE COMPLETION and PRODUCTION RELEASE are separate gates.

Typical release:

REQUIRED MODULES CLOSED
→ FULL REQUIRED QUALITY GATES
→ PREVIEW/PREPROD WHEN APPLICABLE
→ OWNER PROD GO
→ PRODUCTION DEPLOY
→ SMOKE VERIFICATION
→ RELEASE CLOSED

Never infer Production authorization.

======================================================================
17. PROJECT STATE
======================================================================

The repository must maintain concise project continuity.

PROJECT_STATE should indicate at minimum:

canonical baseline/current checkpoint
last closed unit
current authorized work
next authorized action
migration head
blockers
deferred items

The repository carries continuity.

The AI conversation does not.

======================================================================
18. AGENT HANDOFF
======================================================================

A new competent agent should be able to continue development using:

GIT REPOSITORY
+
AI SOFTWARE ENGINEERING OS
+
PRODUCT REQUIREMENTS
+
PROJECT MANIFEST
+
ROADMAP
+
PROJECT STATE

A handoff should not require historical conversation reconstruction.

======================================================================
19. STOP CONDITIONS
======================================================================

STOP implementation when materially relevant:

wrong repository
wrong branch
unexpected HEAD
unexplained Git state
unknown destructive DB state
unapproved schema change
architecture conflict
required scope expansion beyond authorization

Do not improvise through material uncertainty.

======================================================================
20. MINIMUM COMPLEXITY
======================================================================

Governance exists to make development simpler and safer.

Avoid process theatre.

Use the smallest amount of:

documentation
analysis
testing
review
automation

that provides reliable evidence for the authorized change.

Do not turn methodology into a parallel software project.

Preferred rhythm:

DESIGN ENOUGH
→ IMPLEMENT
→ TEST
→ FIX OBSERVED DEFECTS
→ VERIFY
→ COMMIT
→ PUSH
→ CONTINUE AFTER OWNER GO.

======================================================================
21. FANTOMAS PRIVILEGE INHERITANCE
======================================================================

Fantomas / Ghost is the highest-privileged system principal.

  FANTOMAS
  = ALL SUPER_ADMIN CAPABILITIES
  + FANTOMAS-SPECIFIC CAPABILITIES

Every SUPER_ADMIN-authorized operation must also be authorized to
Fantomas.

SUPER_ADMIN does not automatically inherit Fantomas-only capabilities.

Authorization architecture distinguishes:

  effective SUPER_ADMIN capabilities

from:

  Fantomas identity.

Example implementation pattern:

  hasSuperAdminCapabilities(platformRole): true for super_admin | ghost
  requireSuperAdminCapability(platformRole): throws FORBIDDEN otherwise
  isFantomas(platformRole): true only for ghost

======================================================================
22. CANONICAL REMOTE RESTART RULE
======================================================================

Unpushed local work is non-canonical.

When continuity of local work is uncertain:

do not perform Git archaeology or local-work recovery by default.

Restart from verified canonical remote state and rebuild the authorized
unit.

======================================================================
23. ZERO SCHEDULED WORK / OWNER-ONLY AUTOMATION
======================================================================

DEFAULT

AISE default for every managed project:

  CRON = 0
  SCHEDULED TASKS = 0
  BACKGROUND MONITORING = 0
  RECURRING DEVELOPMENT REVIEW = 0
  PERIODIC AUTONOMOUS AUDIT = 0

------------------------------------------------------------
EXPLICIT OWNER AUTHORIZATION
------------------------------------------------------------

An AI agent MUST NOT create, enable, configure, schedule, or start:

  - cron jobs
  - scheduled tasks
  - recurring tasks
  - GitHub Actions schedule triggers
  - Vercel Cron
  - periodic workers
  - background monitoring
  - recurring development reviews
  - autonomous maintenance loops
  - periodic audits
  - scheduled deployments
  - scheduled DB operations
  - polling loops intended to continue work later
  - recurring agent execution

without EXPLICIT OWNER authorization for that specific automation.

Silence is NOT authorization.

------------------------------------------------------------
NO IMPLIED AUTHORIZATION
------------------------------------------------------------

Instructions such as:

  "continue"
  "continue autonomously"
  "keep checking"
  "monitor"
  "review regularly"
  "ongoing development"
  "verify later"
  "continue reviewing"

DO NOT authorize scheduled or background execution.

Normal development authorization is NOT automation authorization.

------------------------------------------------------------
NO SELF-AUTHORIZATION
------------------------------------------------------------

An AI agent cannot authorize its own scheduled execution.

A self-generated statement such as:

  "Now let me set up a cron job for ongoing development review"

has ZERO authorization value.

Only explicit OWNER approval counts.

------------------------------------------------------------
SYNCHRONOUS-FIRST
------------------------------------------------------------

Engineering work is synchronous by default.

If asked to:

  verify CI          → verify now
  review code        → review now
  audit              → audit now
  check state        → check now

Do NOT transform these into future recurring tasks.

------------------------------------------------------------
STOP MEANS STOP
------------------------------------------------------------

When an authorized work unit reaches STOP:

the agent stops.

It MUST NOT create a background mechanism to continue later.

A new major unit requires a new OWNER GO.

------------------------------------------------------------
IF AUTOMATION SEEMS USEFUL
------------------------------------------------------------

The agent MAY recommend automation to OWNER.

It MUST NOT create it unless OWNER explicitly authorizes it.

------------------------------------------------------------
AUTHORIZATION MINIMUM
------------------------------------------------------------

Before creating scheduled work, OWNER approval must clearly cover:

  1. purpose
  2. trigger / cadence
  3. target / system
  4. duration or stopping condition

If unclear:

  DO NOT CREATE.

------------------------------------------------------------
INCIDENT PROCEDURE
------------------------------------------------------------

If unauthorized scheduled work is discovered:

  1. STOP unrelated work.
  2. Identify the task.
  3. Do not replace it.
  4. Remove / disable it when OWNER authorizes.
  5. Verify ZERO scheduled state.
  6. Record governance correction where appropriate.
  7. Resume only after OWNER GO.

------------------------------------------------------------
UNIVERSAL RULE
------------------------------------------------------------

This rule applies to every AISE-managed project.

Project-specific automation is an exception requiring explicit OWNER
authorization.

======================================================================
24. FROZEN CONTRACT PRESERVATION
======================================================================

FROZEN — OWNER-approved universal invariant.
Agents may apply and refine implementation details around it
but may not weaken or remove its semantic protections
without explicit OWNER approval.

------------------------------------------------------------
24.1 CORE PRINCIPLE
------------------------------------------------------------

NEVER ADAPT VALID EVIDENCE TO A DEFECTIVE IMPLEMENTATION.

When factual implementation behavior conflicts with an
OWNER-approved contract, requirement, specification, ADR,
invariant, or acceptance criterion:

  the implementation is SUSPECT FIRST.

The agent MUST NOT silently change the intended state
to match current implementation behavior.

  APPROVED INTENT → drives implementation.
  CURRENT IMPLEMENTATION → does NOT redefine approved intent.

------------------------------------------------------------
24.2 TWO TRUTH PLANES (reinforcement)
------------------------------------------------------------

A. FACTUAL STATE

What currently exists or happens: repository, code, schema,
migrations, runtime, database, deployment, tests, observed outputs,
actual query predicates, actual tool/environment state.

B. INTENDED STATE

What has been explicitly approved: product requirements,
module contract, ADR, invariant, acceptance criterion,
OWNER decision, frozen rule.

When FACTUAL STATE ≠ INTENDED STATE:

  STATUS: CONTRACT DIVERGENCE DETECTED

Do NOT silently resolve the divergence.

------------------------------------------------------------
24.3 PROHIBITED COMPENSATING ADAPTATIONS
------------------------------------------------------------
The following are MUST NOT / PROHIBITED:

- Changing expected test values to match a defect.
- Weakening valid assertions.
- Deleting a valid regression test.
- Changing fixture data so the defect is no longer triggered.
- Designing a seed around defective behavior.
- Modifying mocks to hide a defect.
- Modifying environment assumptions to fit bad results.
- Changing unrelated configuration to make a test pass.
- Bypassing canonical business logic.
- Implementing a duplicate business calculator inside a
  seed/test/SQL.
- Disabling or weakening type checking.
- Globally disabling lint rules to hide a defect.
- Excluding broken code from compilation merely to obtain PASS,
  without independent architectural justification.
- Excluding directories/files from quality gates without
  independent architectural justification.
- Changing an OWNER-approved business rule without OWNER approval.

------------------------------------------------------------
24.4 DIVERGENCE CLASSIFICATION
------------------------------------------------------------

When observed behavior differs from approved expected behavior,
the agent MUST classify the divergence BEFORE modifying evidence.

Allowed classifications:

  A. IMPLEMENTATION DEFECT
  B. TEST DEFECT
  C. FIXTURE / DATA DEFECT
  D. ENVIRONMENT / INFRASTRUCTURE DEFECT
  E. SPECIFICATION AMBIGUITY
  F. UNKNOWN

Until proven: CAUSE = UNKNOWN.

  UNKNOWN → INVESTIGATE.
  NEVER  UNKNOWN → WORKAROUND.

------------------------------------------------------------
24.5 IMPLEMENTATION DEFECT PROCEDURE
------------------------------------------------------------

When approved intended behavior is clear and implementation
violates it:

  STATUS: IMPLEMENTATION DEFECT CONFIRMED

Required sequence:

1. STOP adapting tests/fixtures/environment.
2. Preserve the reproducing evidence.
3. Identify the smallest proven root cause.
4. Implement the minimum correct code change.
5. Add or preserve regression tests.
6. Run targeted tests.
7. Run normal quality gates.
8. Re-run the ORIGINAL reproduction unchanged.
9. Verify factual behavior now matches intended behavior.

The fixture/test that exposed the defect should normally
remain valid.

------------------------------------------------------------
24.6 TEST DEFECT PROCEDURE
------------------------------------------------------------

A failing test is NOT evidence that the test is wrong.

A test may be changed only when evidence proves:

  TEST DEFECT CONFIRMED

Examples: expectation contradicts approved contract;
setup models an impossible state;
assertion targets deprecated approved behavior.

Never weaken a valid assertion merely to obtain PASS.

------------------------------------------------------------
24.7 FIXTURE / DATA DEFECT PROCEDURE
------------------------------------------------------------

Fixture/data modification is authorized only when:

- implementation conforms to approved intent; AND
- the fixture/data violates the canonical model or approved contract.

  STATUS: FIXTURE DEFECT CONFIRMED

Then: modify fixture-owned data only.
Do not change unrelated application behavior.
Do not modify unrelated production/reference data
merely to make fixture validation easier.

------------------------------------------------------------
24.8 ENVIRONMENT TARGET VERIFICATION
------------------------------------------------------------

If the target environment cannot be proven,
NO WRITE is authorized.

Examples:

- Expected Preview but connected to SQLite.
- Expected PostgreSQL but connected elsewhere.
- Expected feature head but deployed commit is unknown.
- Expected non-production database but target identity
  cannot be proven.

  STATUS: ENVIRONMENT TARGET UNVERIFIED
  ACTION: STOP BEFORE WRITE.

Do not substitute local state and report it as
Preview/Production validation.

------------------------------------------------------------
24.9 SPECIFICATION AMBIGUITY
------------------------------------------------------------

If both current implementation and proposed expected behavior
are plausible and intended state does not resolve the question:

  STATUS: SPECIFICATION DECISION REQUIRED

The agent must:

- describe factual behavior;
- describe competing interpretations;
- identify impact;
- request OWNER decision.

The agent may NOT invent a new business rule.

------------------------------------------------------------
24.10 NO QUALITY-GATE EVASION
------------------------------------------------------------

A quality gate exposing an unrelated temporary artifact
does NOT authorize weakening the quality gate.

  temporary broken seed → remove/fix temporary seed.
  NOT: temporary broken seed → exclude scripts from compilation.

  lint error → fix proven error.
  NOT: disable lint globally.

  failing test → classify/fix cause.
  NOT: remove test from suite.

  type error → fix/remove invalid artifact.
  NOT: exclude directory merely to make build green.

QUALITY GATES MAY NOT BE RELAXED AS A COMPENSING
WORKAROUND.

If a tooling/configuration change is independently
architecturally required, it must be justified on its own merits.

------------------------------------------------------------
24.11 CANONICAL VALIDATION PATH
------------------------------------------------------------

Validation should exercise the authoritative production/business
implementation whenever reasonably possible.

DO NOT PROVE IMPLEMENTATION A BY REIMPLEMENTING A
AS IMPLEMENTATION B.

Tests may compute simple expected constants, but must not
silently create a second competing business engine.

Use canonical services/functions for final authoritative
verification.

------------------------------------------------------------
24.12 REPRODUCTION PRESERVATION
------------------------------------------------------------

When valid evidence exposes a confirmed defect:

  preserve the minimal reproduction until the fix is complete.

  BEFORE FIX → reproduction demonstrates the defect.
  AFTER FIX  → SAME reproduction passes.

Do NOT replace the reproduction with an easier scenario.
This provides evidence that the root cause was actually corrected.

------------------------------------------------------------
24.13 OWNER-APPROVED CONTRACT CHANGE PROCEDURE
------------------------------------------------------------

Implementation may reveal that the approved contract itself
should change. That is allowed, but only through:

  DIVERGENCE DETECTED
  → evidence
  → proposed contract change
  → OWNER GO
  → update intended-state documentation
  → implementation
  → tests
  → verification

The agent cannot self-authorize a contract change.

------------------------------------------------------------
24.14 DIVERGENCE REPORTING FORMAT
------------------------------------------------------------

When a contract divergence is detected, use this format:

  CONTRACT DIVERGENCE DETECTED

  FACTUAL STATE: <what the system currently does>
  INTENDED STATE: <what approved contract requires>
  EVIDENCE: <minimal objective evidence>
  CLASSIFICATION:
    IMPLEMENTATION DEFECT
    / TEST DEFECT
    / FIXTURE DEFECT
    / ENVIRONMENT DEFECT
    / SPECIFICATION AMBIGUITY
    / UNKNOWN
  COMPENSATING WORKAROUND APPLIED: NO
  CORRECTIVE ACTION: <what is authorized>
  OWNER DECISION REQUIRED: YES / NO

------------------------------------------------------------
24.15 STOP TRIGGERS
------------------------------------------------------------

If the agent is about to reason in a way equivalent to:

  "I'll design the fixture accordingly."
  "I'll change expected output to what the code returns."
  "I'll exclude this file so the build passes."
  "I'll disable this check temporarily."
  "I'll use another calculation because the real service fails."
  "I'll alter unrelated configuration so this scenario works."

  → STOP.

Return to divergence classification.
No workaround may proceed until the cause is classified.

------------------------------------------------------------
24.16 UNIVERSAL INVARIANT
------------------------------------------------------------

TESTS AND FIXTURES ARE EVIDENCE.
THEY ARE NOT TOOLS FOR MANUFACTURING PASS.

A PASS is trustworthy only when:

  IMPLEMENTATION + TEST + FIXTURE + ENVIRONMENT

all conform to the same approved intended state.

------------------------------------------------------------
24.17 SESSION REMINDER
------------------------------------------------------------

Compact form for session context:

  CONTRACT PRESERVATION

  Never adapt tests, fixtures, seeds, mocks, quality gates,
  or environment configuration merely to make defective
  implementation behavior pass.

  When factual behavior conflicts with OWNER-approved intended
  behavior:

    1. classify the divergence;
    2. prove whether implementation, test, fixture, environment,
       or specification is wrong;
    3. correct the proven cause;
    4. re-run the original evidence unchanged.

  UNKNOWN → INVESTIGATE.
  NEVER  UNKNOWN → WORKAROUND.

  The agent may not silently redefine the contract
  or manufacture PASS.

------------------------------------------------------------
24.18 CASE EXAMPLE
------------------------------------------------------------

  INTENDED:   Results for Classroom A / Period 1 only.
  FACTUAL:    Service also consumes assessments from Period 2
              or Classroom B.
  PROHIBITED: Change fixture so all periods/classes contain
              identical values.
  REQUIRED:   Classify divergence → confirm implementation
              defect → fix query scoping → run original
              fixture again.

======================================================================

======================================================================
25. FROZEN EXTERNAL PARAMETER GATE
======================================================================

FROZEN — OWNER-approved universal invariant.

DO NOT REQUEST EXTERNAL PARAMETERS PREEMPTIVELY.

Proceed autonomously until the currently authorized unit reaches an
operation that genuinely requires an external parameter, credential,
external identifier, connection setting, or authenticated capability.

At that exact boundary:

1. inspect whether the required parameter/capability already exists;
2. verify whether it is appropriate for the intended target;
3. if valid, continue;
4. if unavailable, STOP only at that external boundary;
5. report exactly what is required, why, where, with what scope;
6. preserve all completed work;
7. record the exact RESUME POINT;
8. after configuration, verify availability and target;
9. resume from that exact point;
10. do NOT repeat completed work unnecessarily.

Missing external parameter ≠ implementation defect.

Classify as: EXTERNAL PARAMETER BLOCKER.

Three parameter categories:

  A. PROJECT PARAMETER
     (business configuration: school name, academic year, thresholds)

  B. EXTERNAL NON-SECRET PARAMETER
     (repository URL, project identifier, API base URL)

  C. EXTERNAL SECRET / CREDENTIAL
     (GitHub PAT, DATABASE_URL, API key, OAuth secret, private key)

CREDENTIAL AVAILABLE ≠ TARGET VERIFIED.

Before any external write operation:
  TARGET NOT VERIFIED → NO WRITE.

Do NOT store, echo, or expose secret values in source code,
repository files, commits, PRs, documentation, logs, or shell history.

Request only MINIMUM REQUIRED EXTERNAL PRIVILEGE.

S10 defines the operational implementation of this invariant.

======================================================================
25.1 CANONICAL ENVIRONMENT RESOURCE NAMING
======================================================================

UNIVERSAL RULE — applies to every AISE-managed project.

For any external resource that has separate targets per environment
(database, cache, API, storage, message broker, etc.):

  PROD_<RESOURCE>_URL     Explicit reference to the Production resource.
  DEV_<RESOURCE>_URL      Explicit reference to the Development resource.
  TEST_<RESOURCE>_URL     Explicit reference to the Test resource.
  <RESOURCE>_URL          Runtime alias used by the application.
                          Points ONLY to the target authorized for the
                          current execution context.

SEMANTICS:

  PROD_<RESOURCE>_URL
    = explicit Production resource reference.
    Must NOT be present in Development or Test environments unless an
    operation explicitly requires Production access AND is authorized.

  DEV_<RESOURCE>_URL
    = explicit Development resource reference.

  TEST_<RESOURCE>_URL
    = explicit Test resource reference.

  <RESOURCE>_URL
    = runtime alias. It does NOT automatically mean Production.
    Its target depends on the authorized execution context:

    Development:  <RESOURCE>_URL → DEV_<RESOURCE>_URL
    Test:         <RESOURCE>_URL → TEST_<RESOURCE>_URL (or TEST used directly)
    Production:   <RESOURCE>_URL → PROD_<RESOURCE>_URL
    Preview:      <RESOURCE>_URL → isolated Preview resource for that deployment

  Application code must NOT select Production/Development/Test itself.
  The execution environment provides the correct alias value.

SECURITY INVARIANT:

  A Development or Test environment must NOT receive Production
  credentials unless an operation explicitly requires Production AND
  is authorized.

  In Development:
    DATABASE_URL → DEV_DATABASE_URL
    PROD_DATABASE_URL → absent / inaccessible

  In Test:
    DATABASE_URL (or TEST_DATABASE_URL) → TEST target
    PROD_DATABASE_URL → absent / inaccessible

PREVIEW ENVIRONMENTS:

  Preview environments may be dynamic. The universal rule is:

    Preview runtime → <RESOURCE>_URL → Preview resource explicitly
    isolated for that deployment.

  Preview must NEVER silently point to Production.
  A permanent PREVIEW_<RESOURCE>_URL variable is NOT required; the
  platform provides the isolated Preview resource at runtime.

POSITIVE TARGET IDENTIFICATION:

  UNKNOWN TARGET → INVESTIGATE
  UNKNOWN TARGET → STOP BEFORE WRITE

  Before any sensitive operation (migration, bootstrap, destructive
  test, seed, reset, deployment DB, schema mutation):

  The target must be identified POSITIVELY.

  "It is probably not Production" is NOT sufficient justification.

NO SECRET VALUES IN GOVERNANCE:

  AISE governance files may contain:
  - variable names
  - rules
  - logical mappings
  - target classes

  They must NEVER contain:
  - connection strings
  - passwords
  - API keys
  - tokens
  - credentials

GIT / RESOURCE MAPPING CLARIFICATION:

  Git branches and external resource branches (e.g., Neon branches)
  are SEPARATE concepts. They may be associated by environment policy
  but remain distinct resources.

  Example:
    Git branch main ≠ Neon branch main
    Git branch dev  ≠ Neon branch dev

  Association is a policy decision, not an identity equivalence.

======================================================================
26. FROZEN REMOTE RUNTIME COST & QUOTA SAFETY
======================================================================

FROZEN — OWNER-approved universal invariant.

This section establishes universal AISE governance for remote runtime
cost safety, quota safety, and test target safety. It is
provider-neutral and applies equally to all cloud/remote services.

A. LOCAL-FIRST TESTING

Automated development verification should use local execution whenever
local execution can provide equivalent evidence.

B. DEDICATED TEST RESOURCES

Integration and verification data must use resources explicitly
classified as TEST whenever available. DEV is not a substitute for
TEST when a dedicated TEST environment exists.

C. REMOTE IS NOT FREE BY DEFAULT

A remote runtime must never be assumed to be harmless merely because
the provider labels the plan Free, Hobby, Trial, Preview, Developer,
Sandbox, or similar.

D. METERED / QUOTA-LIMITED RESOURCES REQUIRE CONTROL

Repeated automated traffic against a metered or quota-limited remote
runtime requires explicit authorization.

E. PRODUCTION IS NOT A TEST TARGET

Production must never be used as a development integration, E2E,
load, stress, soak, or synthetic-monitoring target without explicit
exceptional authorization.

F. UNKNOWN -> INVESTIGATE

If cost class, quota class, runtime target, environment identity, or
billing impact is UNKNOWN: UNKNOWN -> INVESTIGATE. Never:
UNKNOWN -> RUN ANYWAY.

G. NO SILENT TARGET SUBSTITUTION

A test authorized for LOCAL or TEST must not silently execute against
DEV, PREVIEW, STAGING, PRODUCTION, or another cloud target.

H. EVIDENCE MUST IDENTIFY TARGET

Verification reports must state the actual runtime/environment used.

ENVIRONMENT CLASSIFICATION (universal):

  LOCAL              — local machine, no remote network calls
  TEST               — dedicated test resource, explicitly classified
  DEV / INTEGRATION  — development integration resource
  PREVIEW / STAGING   — pre-release cloud deployment
  PRODUCTION          — live production resource

COST / QUOTA CLASSIFICATION (universal):

  LOCAL_UNMETERED        — no metered cost, no quota
  CONTROLLED_TEST         — dedicated test resource with known limits
  REMOTE_METERED          — usage-based billing
  REMOTE_QUOTA_LIMITED    — free-tier or quota-capped remote resource
  UNKNOWN                 — cost/quota class not determined

Do not assume PREVIEW = TEST.
Do not assume FREE = UNMETERED.
Do not assume LOCAL APP = LOCAL DATA.

DEFAULT AUTHORIZATION MATRIX:

  UNIT TESTS:           default LOCAL; remote normally unnecessary
  INTEGRATION TESTS:    default dedicated TEST resource; DEV not a
                       substitute for TEST; PRODUCTION forbidden
  BROWSER / E2E:        default localhost; data on dedicated TEST;
                       remote PREVIEW requires explicit authorization;
                       PRODUCTION forbidden
  LOAD / STRESS / SOAK: LOCAL or explicitly provisioned load-test
                       environment only; quota-limited remote forbidden
  SYNTHETIC MONITORING: must be explicitly designed and authorized;
                       must not arise accidentally

AUTOMATED REMOTE E2E IS OPT-IN:

  A browser/E2E suite must not automatically point to a remote URL
  merely because a Preview URL exists, a deployment succeeded, or an
  environment variable contains a cloud URL. Default: localhost. A
  remote E2E target requires explicit authorization stating: TARGET,
  ENVIRONMENT CLASS, COST/QUOTA CLASS, PURPOSE, EXPECTED REQUEST VOLUME.

TEST DATA ISOLATION:

  Verification must distinguish APP RUNTIME TARGET from DATABASE /
  STATE TARGET. For destructive test operations (cleanup, truncation,
  reset, bootstrap, rate-limit clearing, fixture insertion), the target
  environment must be positively verified BEFORE execution.

MUTATION ACCOUNTING:

  If a verification clears, resets, inserts, updates, deletes, or
  otherwise changes a resource, that environment was MUTATED. Reports
  must distinguish: APPLICATION DATA MUTATION, TEST SUPPORT DATA
  MUTATION, SCHEMA MUTATION, GOVERNANCE MUTATION.

PREVIEW DEPLOYMENT POLICY:

  For quota-limited platforms, automatic deployment of every temporary
  work branch is NOT the universal default. Work branches: no automatic
  cloud Preview unless project explicitly requires it. Integration/dev
  branches: Preview may be enabled for controlled human validation.
  Release/production branches: deployment per explicit release policy.

HUMAN PREVIEW VS AUTOMATED TEST:

  A Preview deployment may be useful for occasional human validation
  while still being prohibited as an automated high-frequency test
  target.

RETRY / LOOP SAFETY:

  Automated retry loops must not generate uncontrolled traffic against
  REMOTE_METERED or REMOTE_QUOTA_LIMITED resources. Before repeated
  remote execution, inspect: retry count, parallelism, browser workers,
  polling frequency, scheduled checks, synthetic probes.

======================================================================
27. FROZEN PRODUCT DELIVERY FIRST & COMPLEXITY BUDGET
======================================================================

FROZEN — OWNER-approved universal invariant.

This section establishes the primary AISE objective and a complexity
budget for all engineering work.

A. PRIMARY OBJECTIVE

The primary AISE objective is:

build a functional, correct, maintainable, tested application
with the least unnecessary process and infrastructure complexity.

PRODUCT DELIVERY FIRST.

COMPLEXITY MUST BE JUSTIFIED BY A CURRENT VERIFIED NEED.

B. MANDATORY DEVELOPMENT QUALITY

Keep mandatory when applicable to the product:

- clear requirements
- simple architecture
- readable code
- explicit naming
- TypeScript strictness (or equivalent)
- separation of concerns
- input validation where needed by the product
- correct error handling
- avoidance of duplication
- avoidance of dead code
- avoidance of unnecessary abstractions
- secret files excluded from Git
- passwords/tokens not hardcoded
- authentication/authorization required by product functionality
- useful unit/integration/E2E tests
- lint
- typecheck
- tests
- build
- code review
- regression verification before integration

These directly support software correctness and maintainability.

C. COMPLEXITY BUDGET

Any new:

  tool
  service
  framework
  workflow
  environment
  security layer
  infrastructure component
  automation
  governance step

MUST answer:

  WHAT CURRENT VERIFIED PROBLEM DOES THIS SOLVE?

If no current verified problem exists:

  DO NOT ADD IT.

Future hypothetical scale is not sufficient justification.

D. DEFAULT DEFERRED ITEMS

The following are NOT mandatory during normal application development
unless directly required by the product or a verified current problem:

- advanced GitHub branch protection
- complex CI/CD
- multiple remote test environments
- SAST/DAST platforms
- enterprise secret-management systems
- advanced observability
- distributed tracing
- load testing
- synthetic monitoring
- cron monitoring
- infrastructure-as-code
- complex rollback automation
- Kubernetes
- microservices
- redundant infrastructure
- enterprise compliance controls
- sophisticated security hardening unrelated to current product behavior

These may be proposed AFTER functional application completion as:

  POST-DEVELOPMENT RECOMMENDATIONS

They MUST NOT block application delivery by default.

E. SECURITY PRINCIPLE

Do NOT remove basic software security.

Keep only security that is directly relevant to:

- correct authentication
- correct authorization
- validation of user-controlled data
- preventing obvious application vulnerabilities
- protecting credentials/secrets from source control
- safe database access
- preventing accidental Production destruction

Do NOT turn general infrastructure/security hardening into mandatory
development phases.

F. TEST PRINCIPLE

Tests remain first-class engineering work.

Do NOT classify useful tests as unnecessary complexity.

Prefer:

  tests close to development
  local-first execution
  fast feedback
  deterministic behavior

Remote CI execution is optional unless it provides clear current value.
A locally verified test suite is valid engineering evidence.

G. PROCESS SIMPLIFICATION

Default implementation loop should be:

  1. Understand
  2. Design simply
  3. Implement
  4. Test
  5. Review/refactor
  6. Run quality gates
  7. Integrate

Do not add additional phases unless required by the actual work.

S9/S10/S11 may remain as planning / implementation / verification
boundaries, but S9 contracts should be proportionate to the task.

Avoid 100+ acceptance criteria for ordinary application work unless
genuinely necessary.

H. POST-DEVELOPMENT REVIEW

After the application is functionally complete, AISE may produce a
separate:

  POST-DEVELOPMENT IMPROVEMENT REPORT

Possible topics:

  - stronger CI/CD
  - advanced security
  - monitoring
  - backups
  - branch protection
  - performance/load tests
  - observability
  - infrastructure automation
  - disaster recovery

These are recommendations, not retroactive blockers to application
completion.

======================================================================
28. FROZEN DATABASE CONTINUITY & RECONSTRUCTION DOCTRINE
======================================================================

FROZEN — OWNER-approved universal invariant.

A DATABASE-BACKED PROJECT MUST REMAIN RECONSTRUCTIBLE FROM VERIFIED
REPOSITORY STATE.

A. CONSTITUTIONAL PRINCIPLE

Never allow the database contract to exist only in:
  - developer memory
  - a live cloud database
  - ORM code alone
  - undocumented migration history

For every database-backed AISE project, maintain a canonical:
  DATABASE CONTINUITY & RECONSTRUCTION DOSSIER (DCD)

B. DCD DIRECTORY

Initialize docs/database/ with five mandatory artifacts when the
project uses persistent database storage:

  1. DATABASE_SCHEMA_REFERENCE.md — full human-readable schema reference
     (tables, columns, types, nullability, defaults, PK/FK/UNIQUE/CHECK,
     indexes, enums, relationships, delete/update behavior, ORM mapping,
     application responsibility). Explicitly distinguish DATABASE-ENFORCED
     from APPLICATION-ENFORCED business rules.

  2. DATABASE_OBJECT_INVENTORY.md — concise audit-friendly inventory of
     all database objects (schemas, enums, tables, indexes, constraints,
     migration tracking objects). Supports rapid VERIFIED STATE discovery.

  3. DATABASE_REBUILD_RUNBOOK.md — canonical reconstruction procedure from
     EMPTY database. Must use the project's canonical migration mechanism
     (NOT raw schema dumps). Includes prerequisites, env vars, migration
     commands, bootstrap/seed requirements, verification checks, deployment
     binding, STOP conditions. No real secrets.

  4. DATABASE_ENVIRONMENT_AUDIT.md — factual database-state audits per
     environment (DEV/TEST/STAGING/PRODUCTION). Before an environment exists:
     mark NOT YET AVAILABLE. After Production exists: perform read-only
     comparison between schema source, migration chain, and actual deployed
     database. Record: environment, date, application commit, migrations
     applied, object consistency, unexplained mismatches, final status.

  5. DATABASE_SCHEMA.json — machine-readable structural representation
     (schemas, enums, tables, columns, indexes, FKs, unique constraints,
     checks, migrations). NEVER include real user records, passwords,
     hashes, tokens, sessions, connection strings, or secrets.

Projects MAY prefix filenames with the project name.

C. SOURCE OF TRUTH ORDER

  1. CANONICAL MIGRATIONS — executable database evolution/reconstruction
  2. SCHEMA SOURCE / ORM MODEL — canonical application-side schema model
  3. ACTUAL DEPLOYED DATABASE — factual runtime state
  4. docs/database/* — descriptive/recovery documentation

If sources disagree: declare DATABASE CONTRACT DIVERGENCE. Then
investigate. NEVER UNKNOWN → DOCUMENT AS FACT.

D. DCD CREATION TRIGGER

When S6 determines the project uses persistent database storage:
  DATABASE_CONTINUITY_REQUIRED = YES

Initialize docs/database/ during the earliest appropriate implementation
stage. Do not wait until Production release.

E. DCD UPDATE TRIGGER

Any authorized work unit that changes the persistent database contract
MUST trigger a DCD impact review:

  DATABASE_CHANGE = YES → DCD_UPDATE_REQUIRED = YES

Examples: table/column/index/enum/constraint creation/removal/change,
migration creation, bootstrap contract change, persisted role/principal
model change, ORM change, DB engine change, environment topology change,
rebuild process change.

Non-database changes (UI, copy, static images, pure frontend refactor):
  DATABASE_CHANGE = NO → DCD_UPDATE_REQUIRED = NO

F. WORK UNIT CLOSURE RULE

For every database-affecting work unit, closure evidence must include:

  DATABASE_CHANGE: YES/NO
  MIGRATION_STATUS:
  SCHEMA_SOURCE_STATUS:
  DCD_UPDATE_STATUS:
  DATABASE_CONTRACT_DIVERGENCE: NONE/<description>

A database-affecting work unit MUST NOT be declared CLOSED while:
  DCD_UPDATE_STATUS = STALE
  or DATABASE_CONTRACT_DIVERGENCE remains unexplained.

G. DEVELOPMENT LOOP INTEGRATION

For database-affecting implementation, the AISE loop becomes:

  UNDERSTAND VERIFIED STATE
  → DESIGN MINIMAL CHANGE
  → IMPLEMENT
  → CREATE/UPDATE MIGRATION
  → TEST
  → VERIFY SCHEMA CONTRACT
  → UPDATE DCD
  → QUALITY GATES
  → INTEGRATE

Documentation follows VERIFIED implementation. Do not create documentation
before knowing actual implementation state.

H. RELEASE INTEGRATION

Before Production release of a database-backed project, verify:
  migration chain ↔ schema source ↔ target database ↔ DCD

Classify each pair: MATCH / MISMATCH / UNKNOWN.

After Production exists, a read-only Production schema audit SHOULD
become part of release closure when practical and authorized.

I. REBUILD PRINCIPLE

The primary reconstruction path:
  EMPTY DATABASE → canonical migrations → bootstrap/seed → verification
  → runtime configuration → deployment

Schema dumps MAY exist as supplementary forensic references. They MUST
NOT silently replace canonical migrations unless the project's approved
architecture explicitly uses dumps as the migration/rebuild system.

J. DATA BACKUP IS SEPARATE

DCD documents STRUCTURE + RECONSTRUCTION CONTRACT. It does NOT
constitute DATA BACKUP. Schema reconstruction and data restoration are
separate concerns. Do not export sensitive Production data merely to
satisfy DCD.

K. SECURITY

DCD MUST NEVER contain real: database passwords, URLs with embedded
credentials, auth secrets, API tokens, password hashes, session tokens,
private keys. Use variable names/placeholders only.

L. PORTABILITY

The DCD doctrine works with PostgreSQL, MySQL, SQLite, SQL Server,
document databases, and other persistent stores. Adapt object
categories to the actual technology. Do not force PostgreSQL concepts
onto non-PostgreSQL projects.

M. LEGACY / EXISTING PROJECTS

For an existing AISE project that already has a DB but no DCD:
  Do not block all development.
  At the next database-affecting unit or release preparation:
  initialize DCD from VERIFIED STATE.
  Classify unavailable deployed environments as UNKNOWN or NOT YET
  AVAILABLE.

N. REFERENCE IMPLEMENTATION

JOURDAIN EMPLOI serves as the reference example. Its canonical dossier
lives in docs/database/. Do NOT hard-code JOURDAIN-specific tables,
enums, roles, or Neon into generic AISE doctrine.

======================================================================
END AI SOFTWARE ENGINEERING OS 0.4
======================================================================
