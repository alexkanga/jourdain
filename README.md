# JOURDAIN EMPLOI

This repository is governed by the canonical AI Software Engineering OS
(AISE). Engineering work in this repository must follow AISE protocols
S0–S14 and R1–R7.

## Project status

- **Project:** JOURDAIN EMPLOI
- **AISE phase:** S9 — WP-001 (Application Foundation) authorized
- **Status:** S10 implementation of WP-001
- **AISE source commit:** `2991df51c1fa692f892452c361081c626f028cd0`
- **AISE manifest:** `docs/engineering/AISE_MANIFEST.md`
- **Project state:** `docs/planning/PROJECT_STATE.md`

## What exists

- AISE governance control plane (S0–S14 + R1–R7) installed and canonical.
- OWNER-APPROVED PROJECT_CHARTER, PRODUCT_REQUIREMENTS,
  TECHNICAL_SPECIFICATION, PROJECT_MANIFEST, 10 ACCEPTED ADRs,
  DELIVERY_ROADMAP, and WP-001 work package contract.
- Next.js application foundation (WP-001):
  - Next.js App Router with TypeScript strict
  - Tailwind CSS
  - ESLint + Prettier
  - Vitest with React Testing Library (smoke test)

## How to run

```bash
pnpm install
pnpm dev        # Start dev server on http://localhost:3000
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript type checking
pnpm test       # Run Vitest tests
pnpm build      # Build for production
```

## AISE entry point

Follow S1 — Universal Launcher (`docs/engineering/AISE_UNIVERSAL_LAUNCHER.md`).
