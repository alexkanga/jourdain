# AISE — METHOD OF USE AND STAGES

## A. First installation in a greenfield project

**Step 1 — Install AISE.** Extract this ZIP at repository root. Do not copy application-specific documents from another project.

**Step 2 — Launch S1/S2.** Give the agent `AISE_NEW_PROJECT_START_PROMPT.md`. The agent verifies Git and AISE, then S2 should route a true greenfield project to `NEW_PROJECT → S3`.

**Step 3 — OWNER GO S3.** S3 establishes the AISE-governed repository and project continuity artifacts. It must not start architecture or coding.

**Step 4 — OWNER GO S4.** Define WHY, WHO and project boundary. Output: approved Project Charter.

**Step 5 — OWNER GO S5.** Define WHAT the product must do. Output: Product Requirements / Cahier des charges.

**Step 6 — OWNER GO S6.** Define HOW the approved requirements will be realized: architecture, stack, data, interfaces, security, tests, environments, deployment.

**Step 7 — OWNER GO S7.** Record durable technical memory and ADRs.

**Step 8 — OWNER GO S8.** Convert the approved scope into milestones and delivery order.

**Step 9 — OWNER GO S9.** Authorize one exact Work Package.

**Step 10 — S10.** Implement only the authorized Work Package; test, fix observed defects, verify, review diff, commit/push as authorized.

**Step 11 — S11.** Independently verify conformance to approved intent.

**Step 12 — S12.** Establish release readiness/preproduction. S12 PASS does not authorize Production.

**Step 13 — OWNER PROD GO + S13.** Deploy the exact approved release to the verified Production target and verify it there.

**Step 14 — S14.** Record the new verified factual baseline so another agent can continue without chat memory. STOP.

## B. Every later session

Always start with S1 Universal Launcher. S2 classifies the requested unit and routes it. Do not replay S3-S14 for a normal change.

## C. Existing application that did not start with AISE

Do **not** run S3 against implemented software. Use `AISE_EXISTING_PROJECT_START_PROMPT.md`; S2 routes to R7 Brownfield Adoption, which discovers and establishes a trustworthy baseline prospectively without fabricating historical AISE compliance.

## D. Owner-GO discipline

`PLANNED` does not mean `AUTHORIZED`. An agent may finish all necessary work inside one authorized unit, but it must stop before the next major unit. Production requires explicit `OWNER PROD GO` tied to the exact release/target.
