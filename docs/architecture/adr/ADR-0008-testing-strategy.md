# ADR-0008 — Testing Strategy: Vitest + RTL + Playwright, Real DB in Integration

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-024
RELATED REQ IDS:  NFR-060, OWNER S6 §21

CONTEXT:
V1 requires verifiable acceptance of the critical user journey (admin login → create → publish → public visible → suspend → republish → archive → preserved). S6 §18 mandates that critical integration boundaries must NOT be mocked merely to manufacture PASS.

DECISION:
Four testing layers:
1. Unit/logic: Vitest — pure functions, Zod schemas, capability checks (can()). No I/O.
2. Component: React Testing Library + Vitest — UI components in isolation. Server Actions mocked.
3. Integration: Vitest + real Neon preview branch — Server Actions end-to-end against a real PostgreSQL. DB is NEVER mocked. Auth is mocked at the session level for non-auth tests; real Better Auth flow for auth-focused tests.
4. E2E: Playwright — 15-step critical user journey per OWNER S6 §21 against a Vercel Preview deployment (or local Next.js server) with a dedicated Neon preview branch.

Critical E2E scenario: admin login → create DRAFT → save → edit → publish → public list visible → public detail correct → suspend → public 404 → republish → public visible → archive → public 404 → admin list shows ARCHIVED with content preserved → logout.

ALTERNATIVES CONSIDERED:
- Mock DB in integration tests — rejected: S6 §18 mandates real DB for integration tests; mocks hide SQL errors, schema mismatches, and Drizzle type issues.
- Jest instead of Vitest — rejected: Vitest is faster, has native ESM/TypeScript support, and integrates better with Vite-based Next.js.
- Cypress instead of Playwright — rejected: Playwright is faster, has better cross-browser support, and is more aligned with the modern ecosystem.

RATIONALE:
Vitest is the standard testing tool for Vite/Next.js projects. RTL is the standard for component testing. Playwright is the standard for E2E. Real DB in integration tests catches real SQL/schema issues that mocks would hide. The 15-step E2E covers the entire offer lifecycle + public visibility transitions.

CONSEQUENCES:
+ Integration tests catch real SQL and schema errors.
+ E2E proves the critical user journey works end-to-end.
+ No mock-manufactured PASS.
- Integration tests require a real Neon preview branch (CI setup cost).
- E2E takes longer to run (mitigated by opt-in via label on PRs; always on main).

VERIFICATION:
CI runs all layers. Integration tests connect to a real DB. E2E runs against a real deployment. No test layer mocks the database.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-024), S6 §18 (testing architecture), S6 §18.4 (critical E2E scenario)
