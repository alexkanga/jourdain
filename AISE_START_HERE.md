# AISE UNIVERSAL PORTABLE — START HERE

This ZIP contains only the **universal AISE software-engineering method** extracted from the supplied `docs` package. Application-specific product, architecture, planning, migration, security-gate, WS and historical project documents are intentionally excluded.

## Install

1. Create or open the target Git repository.
2. Extract this ZIP at the **repository root**.
3. Verify that `docs/engineering/AI_SOFTWARE_ENGINEERING_OS.md` exists.
4. Commit the AISE control plane before application implementation whenever practical.
5. Start the engineering agent with `AISE_NEW_PROJECT_START_PROMPT.md` for a greenfield project, or `AISE_EXISTING_PROJECT_START_PROMPT.md` for an already implemented project.

## Core doctrine

- NEVER DEVELOP FROM MEMORY. DEVELOP FROM VERIFIED STATE.
- One verified change at a time.
- Factual state comes from repository/runtime evidence.
- Intended state comes from OWNER-approved contracts.
- Factual ≠ intended → CONTRACT DIVERGENCE DETECTED.
- UNKNOWN → INVESTIGATE. NEVER UNKNOWN → WORKAROUND.
- No scheduled/background work by default.
- No external credentials requested before the exact boundary where they are needed.
- Credential available ≠ target verified.
- No Production action without explicit OWNER PROD GO.
- Fantomas/Ghost inherits all SUPER_ADMIN capabilities plus its break-glass capabilities.

## New-project lifecycle

```text
S1 Universal Launcher
→ S2 Task Router
→ S3 New Project Bootstrap
→ S4 Project Discovery / Charter
→ S5 Product Requirements
→ S6 Technical Specification
→ S7 Project Manifest + ADR
→ S8 Roadmap / Milestone Design
→ S9 Module Contract / Work Package
→ S10 Implementation Execution
→ S11 Verification & Acceptance
→ S12 Release Readiness / Preproduction
→ S13 Production Deployment & Verification
→ S14 Operational Handover / Baseline Closure
```

Each major stage requires its own OWNER GO. Completion of one stage does not authorize the next.

## Existing-project / future-work routes

```text
NEW PROJECT             → S3, then S4-S14
MODULE / FEATURE CHANGE → R1
HOTFIX                  → R2
RECOVERY                → R3
INVESTIGATION           → R4
CONTRACT DIVERGENCE     → R5
GOVERNANCE CHANGE       → R6
EXISTING/BROWNFIELD     → R7
```

Always enter a work session through S1 and let S2 classify the task.

## Minimum Owner input for a new application

- Project working name
- Short idea/problem statement
- Target users
- Main business objective
- Known constraints
- Known technology preferences, if any (otherwise leave undecided for S6)

Then issue `OWNER GO S3`.
