# ADR-0001 — Modular Monolith Next.js Full-Stack

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-001
RELATED REQ IDS:  FR-001–FR-061, NFR-001, NFR-030, OWNER S6 §2

CONTEXT:
V1 is a simple, mono-tenant editorial job-offer portal with no external integrations (S5 INT-001), no public API (OOS-015), no notifications (OOS-013), a single ordinary ADMIN role, and a small admin team. S6 §6 (requirement-driven architecture) prohibits introducing distributed complexity without evidence from approved requirements.

DECISION:
Modular monolith Next.js full-stack. One application serving both public and admin. One PostgreSQL database. Internal module boundaries enforced at the code level (dependency direction rules), not at the network level.

ALTERNATIVES CONSIDERED:
- Separate Next.js + NestJS backend — rejected: OWNER S6 §2 explicitly forbids "backend séparé NestJS"; no approved requirement justifies a separate API service.
- Microservices — rejected: no approved scaling requirement (S6 anti-overarchitecture rule); single admin team, editorial-scale volumetry.
- Next.js + separate REST/GraphQL API — rejected: GraphQL excluded per OWNER S6 anti-overengineering; no external API consumers in V1 (INT-001).

RATIONALE:
Simplest architecture satisfying all approved requirements. Server Components cover server-rendered public pages. Server Actions cover admin mutations. Single deployment unit (Vercel). No network hop between API and UI. Module boundaries enforced via `lib/server/` separation and `server-only` package import.

CONSEQUENCES:
+ Simpler deployment, debugging, and testing.
+ Single codebase, single deployment unit.
+ No distributed consistency machinery needed.
- No independent subsystem scaling without architecture change (acceptable for V1).
- Module boundary violations possible without runtime enforcement (mitigated by CI lint rules).

VERIFICATION:
Implementation must enforce module dependency rules (client components never import from `lib/server/*`). S11 must verify boundary constraints.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §4 (TD-001), S6 §6 (module map)
