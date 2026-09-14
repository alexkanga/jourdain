# ADR-0006 — Database Environment Isolation: Production / Preview / Local

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-019
RELATED REQ IDS:  Charter §10 (Production separated from Preview — MANDATED)

CONTEXT:
Charter §10 MANDATES that the Production environment is separated from Preview environments. A Vercel Preview deployment must never accidentally write to the Production database. Local development must never accidentally write to Production.

DECISION:
Three environment tiers with strict database isolation:
- Production: Neon main branch (dedicated, single, protected). Vercel Production env vars.
- Preview: Neon preview branch (auto-provisioned per PR by Neon-Vercel integration; isolated, ephemeral). Vercel Preview env vars.
- Local: local PostgreSQL or developer-specific Neon branch (NEVER the production main branch). `.env.local` (not committed).

Target verification (S0 §25) before any Production write:
1. Check `process.env.VERCEL_ENV === 'production'`.
2. Check `DATABASE_URL` host matches the production Neon hostname.
3. If target not verified → STOP, no write.

ALTERNATIVES CONSIDERED:
- Shared database with row-level isolation — rejected: fragile; a single query without the tenant filter leaks data; contradicts the MANDATED strict separation.
- Dedicated staging environment (separate from Preview) — rejected: Vercel Preview + Neon preview branches cover the need; a separate staging tier adds cost and operational complexity not justified for V1.

RATIONALE:
Neon's branch-based model naturally provides isolated copies per PR. The Neon-Vercel integration auto-provisions ephemeral preview branches. Vercel's environment-variable separation (Production ≠ Preview) is enforced by the platform. The developer's `.env.local` is the only local config and must point to a non-production database. This is the simplest strict-isolation model compatible with Vercel + Neon.

CONSEQUENCES:
+ Production data is never touched by Preview or Local dev.
+ Each PR gets its own isolated DB copy (auto-provisioned, auto-deleted).
+ Target verification prevents accidental production writes from Preview code paths.
- Neon preview branches consume Neon resources (acceptable for V1 scale; ephemeral, auto-cleaned).
- Operator must verify DATABASE_URL before running migrations against Production (documented in TD-018).

VERIFICATION:
CI: verify `.env.example` has no real secrets (S0 §13). Deploy: verify Vercel Production env vars are distinct from Preview env vars. Bootstrap: verify target before any createUser call.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-019), S6 §20 (configuration/environments), S6 §20.4 (target verification)
