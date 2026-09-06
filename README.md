# JOURDAIN EMPLOI

This repository is governed by the canonical AI Software Engineering OS
(AISE). Engineering work in this repository must follow AISE protocols
S0–S14 and R1–R7.

## Bootstrap status

- **Project:** JOURDAIN EMPLOI
- **AISE phase:** S3 — NEW PROJECT BOOTSTRAP
- **Status:** BOOTSTRAP CANONICAL READY
- **AISE source commit:** 2991df51c1fa692f892452c361081c626f028cd0
- **AISE manifest:** `docs/engineering/AISE_MANIFEST.md`
- **Project state:** `docs/planning/PROJECT_STATE.md`

## What exists now

- The AISE governance control plane (S0–S14 + R1–R7) is installed and
  canonical.
- A project continuity document (`docs/planning/PROJECT_STATE.md`)
  records the current phase and the next authorized action.
- No application code, no infrastructure, no database, no hosting
  configuration has been created. This is intentional. S3 forbids
  premature application scaffolding and premature infrastructure.

## What does NOT exist yet (intentional)

- No product charter (S4).
- No product requirements / cahier des charges (S5).
- No technical specification (S6).
- No project manifest + ADRs (S7).
- No roadmap / milestone design (S8).
- No module contract (S9).
- No implementation (S10).
- No Next.js application, no Neon database, no Vercel configuration.

These will be produced in their proper AISE sequence, each requiring
explicit OWNER GO.

## How to enter an engineering session

Follow S1 — Universal Launcher (`docs/engineering/AISE_UNIVERSAL_LAUNCHER.md`):

1. Establish verified repository state (branch, HEAD, worktree).
2. Read the canonical documents relevant to the authorized unit only.
3. Classify the work with S2 — Task Router
   (`docs/engineering/AISE_TASK_ROUTER.md`).
4. Execute the routed protocol. Do not develop from memory.

## Current phase and next step

- Current phase: S3 — NEW PROJECT BOOTSTRAP (CLOSED).
- Next recommended component: **S4 — Project Discovery / Charter**
  (`docs/engineering/AISE_PROJECT_DISCOVERY_CHARTER.md`).
- Next action: **OWNER GO REQUIRED**.

S3 does not authorize S4. S4 begins only after explicit OWNER
authorization.
