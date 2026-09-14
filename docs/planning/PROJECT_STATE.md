# PROJECT STATE — JOURDAIN EMPLOI

This file is the canonical continuity document for the project. It is
maintained as engineering progresses and supersedes any chat history or
agent memory. New agents should read this file (together with the AISE
control plane) to understand where the project stands.

## Current phase

PROJECT:                JOURDAIN EMPLOI
AISE PHASE:             S6 — TECHNICAL SPECIFICATION
STATUS:                 CLOSED PASS — TECHNICAL SPECIFICATION APPROVED
CHARTER APPROVED:       YES
CHARTER PATH:           docs/planning/PROJECT_CHARTER.md
CHARTER APPROVAL DATE:  2026-09-13
PRODUCT REQUIREMENTS APPROVED: YES
PRODUCT REQUIREMENTS PATH: docs/product/PRODUCT_REQUIREMENTS.md
PRODUCT REQUIREMENTS APPROVAL DATE: 2026-09-14
TECHNICAL SPECIFICATION APPROVED: YES
TECHNICAL SPECIFICATION PATH: docs/architecture/TECHNICAL_SPECIFICATION.md
TECHNICAL SPECIFICATION APPROVAL DATE: 2026-09-15
CANONICAL BRANCH:       main
CANONICAL HEAD:         7c85323c557476672a1e227e8773b0fa45459ff4
REMOTE:                 configured (origin → git@github.com-aise-alexkanga-jourdain:alexkanga/jourdain.git)
REMOTE HEAD:            7c85323c557476672a1e227e8773b0fa45459ff4
LOCAL = REMOTE:         YES
AISE SOURCE COMMIT:     2991df51c1fa692f892452c361081c626f028cd0
COMPLETED COMPONENTS:   S0, S1, S2, S3, S4, S5, S6 installed and canonical
PRODUCT DISCOVERY:      CLOSED PASS — CHARTER APPROVED (S4)
PRODUCT REQUIREMENTS:   CLOSED PASS — PRODUCT REQUIREMENTS APPROVED (S5)
TECHNICAL SPECIFICATION: CLOSED PASS — TECHNICAL SPECIFICATION APPROVED (S6)
PROJECT MANIFEST/ADR:   NOT STARTED (S7)
ROADMAP:                NOT STARTED (S8)
IMPLEMENTATION:         NOT STARTED (S10)
DEFERRED DECISIONS:     Charter-level: D1 (GDPR details — S6 resolved by TD-018), D2 (migration scope — only if needed), D3 (data residency — S6 resolved by TD-019). S5-level: DR-010 (id format — resolved by TD-015), DR-020/021 (validation formats — resolved by TD-008), DR-030/040 (full audit log — future), DR-050 (admin UI — future), DR-051 (SUPER_ADMIN role — future), DR-160 (GDPR — deferred per Charter D1), DR-170 (data residency — deferred per Charter D3). All explicitly non-blocking for S7 or V1.
NEXT AUTHORIZED:        NONE until OWNER GO
NEXT RECOMMENDED:       S7 — Project Manifest + ADR

## What exists

- AISE governance control plane: S0–S14 + R1–R7, vendored canonical
  snapshot from source commit 2991df51c1fa692f892452c361081c626f028cd0.
- AISE manifest: `docs/engineering/AISE_MANIFEST.md`.
- This project state file: `docs/planning/PROJECT_STATE.md`.
- Minimal README: `README.md`.

## What does NOT exist (intentional, per S3 / S4 / S5 / S6 boundaries)

- No application code.
- No Next.js application scaffolded.
- No database (Neon or otherwise) created.
- No Vercel project or environment configured.
- No authentication provider configured.
- No CI/CD pipeline.
- No scheduled work, cron, or background automation (S0 §23 default).
- No project manifest / ADRs (S7 — next recommended stage).
- No roadmap (S8).
- No implementation (S10).

## What exists now (after S6 closure)

- AISE governance control plane: S0–S14 + R1–R7, vendored canonical
  snapshot from source commit 2991df51c1fa692f892452c361081c626f028cd0.
- AISE manifest: `docs/engineering/AISE_MANIFEST.md`.
- This project state file: `docs/planning/PROJECT_STATE.md`.
- Minimal README: `README.md`.
- **OWNER-APPROVED PROJECT CHARTER**: `docs/planning/PROJECT_CHARTER.md`
  (frozen at canonical commit `fa377c1feba5a111c07e0f40d094245fdadc727d`,
  approved by OWNER on 2026-09-13).
- **OWNER-APPROVED PRODUCT REQUIREMENTS**: `docs/product/PRODUCT_REQUIREMENTS.md`
  (frozen at canonical commit `9ec4a08b467a4a3909fa9bc0a72bf02e4c682418`,
  approved by OWNER on 2026-09-14).
  Contains 65 CONFIRMED requirements (30 FR + 21 BR + 4 PERM + 1 INT + 9 NFR),
  0 ASSUMPTION, 0 OPEN QUESTION, 9 DEFERRED decisions (genuine future), 30 OUT OF SCOPE V1 items.
- **OWNER-APPROVED TECHNICAL SPECIFICATION**: `docs/architecture/TECHNICAL_SPECIFICATION.md`
  (frozen at canonical commit `7c85323c557476672a1e227e8773b0fa45459ff4`,
  approved by OWNER on 2026-09-15).
  Contains 31 technical decisions (30 DECIDED + 1 MANDATED),
  15 ADR candidates for S7, 0 OPEN, 0 PROVISIONAL.

## OWNER-provided inputs (recorded as-is, evidence for S4/S5/S6)

These inputs were supplied by OWNER during the NEW PROJECT START and
S3 authorization. They are recorded here factually as inputs for later
AISE stages. They are NOT specifications. They will be reviewed,
refined, expanded, and possibly revised during S4 (charter), S5
(product requirements), and S6 (technical specification). Recording
them here is factual; expanding them into requirements, architecture,
or code would be premature execution forbidden by S3.

### Project identity

- Project name: JOURDAIN EMPLOI
- One-sentence purpose: V1 d'un portail simple de publication et de
  consultation d'offres d'emploi.
- Scope framing: ce n'est PAS encore une plateforme complète de
  recrutement.

### Functional framing (V1)

Administration:
- Authentification de l'administration.
- Création d'une offre.
- Enregistrement d'une offre.
- Modification d'une offre.
- Publication d'une offre.
- Suspension ou archivage.
- Consultation de la liste des offres administratives.

Public:
- Consulter la liste des offres publiées.
- Ouvrir une offre.
- Consulter le détail complet de l'offre.
- Consulter les modalités de candidature lorsqu'elles sont disponibles.

### Business rules (V1)

- Titre: obligatoire.
- Description: obligatoire.
- Entreprise: facultatif.
- Secteur: facultatif.
- Catégorie: facultatif.
- Type de contrat: facultatif.
- Niveau d'étude: facultatif.
- Expérience: facultatif.
- Localisation: facultative lorsqu'elle n'est pas connue.
- Ne jamais inventer une information absente de l'offre source.
- Aucune donnée facultative absente ne doit empêcher inutilement la
  publication.

### Public interface (V1)

Carte d'offre:
- Titre.
- Entreprise si disponible.
- Lieu si disponible.
- Type de contrat si disponible.
- Date de publication.
- Date limite / expiration si disponible.
- Bouton « Voir l'offre ».

Détail d'une offre:
- Titre.
- Entreprise si disponible.
- Informations principales disponibles.
- Dates.
- Description complète.
- Modalités de candidature.
- Éventuellement la source.

### Exclusions V1 (explicitly excluded from this version)

- Pas de logo d'entreprise.
- Pas de bouton Postuler.
- Pas de partage.
- Pas de Facebook.
- Pas de WhatsApp.
- Pas de LinkedIn.
- Pas de compte candidat.
- Pas de CV.
- Pas de favoris.
- Pas de messagerie.
- Pas de candidature interne.
- Pas d'espace recruteur.
- Pas de paiement.
- Pas de matching IA.
- Pas d'application mobile.

### Technology preferences (OWNER-stated, NOT yet decided)

These are OWNER preferences recorded as input for S6. They are NOT
canonical technical decisions yet. Final selection happens in S6 /
S7, as architecte senior, au plus simple et au plus proportionné.

Preferred stack (OWNER-stated):
- React.
- Next.js.
- TypeScript.
- Next.js App Router.
- Vercel.
- PostgreSQL Neon.
- Environnement Production séparé des environnements Preview.

Envisaged tools around Next.js (OWNER-stated, non figés):
- Zod.
- Drizzle ou Prisma.
- TanStack Query lorsque réellement utile.
- React Hook Form lorsque pertinent.
- Tailwind CSS.
- shadcn/ui.
- Outils de tests adaptés.

Architectural constraint (OWNER-stated):
- Pas de microservices, Kubernetes, Kafka, Elasticsearch ou autre
  architecture lourde sans nécessité démontrée.

### Priorities (OWNER-stated, ordered)

1. Simplicité d'utilisation.
2. Fonctionnement correct.
3. Sécurité.
4. Maintenabilité.
5. Performance.
6. Faible complexité.
7. Faible coût d'exploitation.

## Constraints carried forward

- AISE FROZEN rule §24 (Contract Preservation) applies to all future
  work: never adapt valid evidence to defective implementation.
- AISE FROZEN rule §25 (External Parameter Gate) applies: do not
  request external parameters preemptively. Secrets (DATABASE_URL,
  Vercel tokens, etc.) will be requested only at the exact S10/S13
  boundary where they are genuinely required.
- AISE §23 (Zero Scheduled Work): no cron, no scheduled tasks, no
  background monitoring unless explicitly OWNER-authorized.

## Stop contract

S6 is CLOSED / PASS — TECHNICAL SPECIFICATION APPROVED. S7 has NOT
started. S7 begins only after explicit OWNER GO.

NEXT RECOMMENDED COMPONENT: S7 — Project Manifest + ADR
NEXT ACTION: OWNER GO REQUIRED
