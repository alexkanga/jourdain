# Environment Variables — JOURDAIN EMPLOI V1

## Environment Tiers

| Environment | Neon Branch | DATABASE_URL | BETTER_AUTH_URL | NEXT_PUBLIC_SITE_URL |
|---|---|---|---|---|
| LOCAL (dev) | Developer's local or TEST | = TEST_DATABASE_URL or local | `http://localhost:3000` | `http://localhost:3000` |
| LOCAL (E2E) | Neon test branch | = TEST_DATABASE_URL | `http://127.0.0.1:3100` | `http://127.0.0.1:3100` |
| TEST (CI) | Neon test branch (`ep-gentle-rice-b1vxvfsf`) | = TEST_DATABASE_URL | `http://127.0.0.1:3100` | `http://127.0.0.1:3100` |
| DEV-INTEGRATION | Neon dev branch | = DEV_DATABASE_URL | DEV origin URL | DEV origin URL |
| PREVIEW | Neon dev branch | = DEV_DATABASE_URL | Preview origin URL | Preview origin URL |
| PRODUCTION | Neon main branch | = PROD_DATABASE_URL | Production origin URL | Production origin URL |

## Variable Classification

### CI Secrets (GitHub Actions encrypted secrets)

| Variable | Environment | Classification |
|---|---|---|
| `TEST_DATABASE_URL` | TEST/CI | SECRET (server-only) |
| `BETTER_AUTH_SECRET` | TEST/CI | SECRET (server-only, TEST-specific value) |
| `INITIAL_ADMIN_PASSWORD` | TEST/CI | SECRET (bootstrap-only, TEST-specific value) |
| `FANTOMAS_INITIAL_PASSWORD` | TEST/CI | SECRET (bootstrap-only, TEST-specific value) |

### CI Variables (GitHub Actions non-secret variables)

| Variable | Environment | Classification |
|---|---|---|
| `E2E_EXPECTED_TEST_DATABASE_HOST` | TEST/CI | NON-SECRET (E2E-only, identifies DB host not credentials) |
| `BETTER_AUTH_URL` | TEST/CI | NON-SECRET (`http://127.0.0.1:3100` for CI local Next.js) |
| `INITIAL_ADMIN_LOGIN` | TEST/CI | NON-SECRET (`admin1`) |
| `INITIAL_ADMIN_EMAIL` | TEST/CI | NON-SECRET (`admin1@jourdain.local`) |
| `FANTOMAS_EMAIL` | TEST/CI | NON-SECRET (`fantomas@jourdain.local`) |

### Vercel Preview Environment Variables

| Variable | Classification | Value |
|---|---|---|
| `DATABASE_URL` | SECRET | DEV_DATABASE_URL (Neon dev branch — NOT Production, NOT TEST) |
| `BETTER_AUTH_SECRET` | SECRET | Preview-specific value |
| `BETTER_AUTH_URL` | NON-SECRET | Preview origin URL (NOT localhost) |
| `INITIAL_ADMIN_PASSWORD` | SECRET | Preview-specific test value |
| `FANTOMAS_INITIAL_PASSWORD` | SECRET | Preview-specific test value |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Preview origin URL |

### Vercel Production Environment Variables (deferred to S13)

| Variable | Classification | Value |
|---|---|---|
| `DATABASE_URL` | SECRET | PROD_DATABASE_URL (Neon main branch) |
| `BETTER_AUTH_SECRET` | SECRET | Production strong secret |
| `BETTER_AUTH_URL` | NON-SECRET | Production origin URL |
| `INITIAL_ADMIN_PASSWORD` | SECRET | Production strong secret (rotated after first deploy) |
| `FANTOMAS_INITIAL_PASSWORD` | SECRET | Production strong secret (rotated after first deploy) |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | Production origin URL |

**Production secret values are deferred to S13 / explicit OWNER PROD GO.** S10 may prepare variable NAMES and mappings but does NOT require actual Production secret values.

### E2E-Only Variables (local .env.local, NOT Vercel)

| Variable | Classification | Value |
|---|---|---|
| `E2E_BASE_URL` | NON-SECRET | `http://127.0.0.1:3100` (default, must be loopback) |
| `E2E_ALLOW_REMOTE` | NON-SECRET | absent (default — remote E2E forbidden) |
| `E2E_REMOTE_BASE_URL` | NON-SECRET | absent (default) |
| `E2E_REMOTE_AUTHORIZATION_REF` | NON-SECRET | absent (default) |

## Rules

1. **Only variable NAMES belong in documentation.** No values are committed.
2. **`.env.local` holds developer's local values** (gitignored, NOT committed).
3. **GitHub Actions secrets hold CI TEST values** (encrypted, not visible in logs).
4. **GitHub Actions variables hold CI non-secret config** (visible, reusable).
5. **Vercel environment variables hold Preview + Production values** (per Vercel environment).
6. **Neon connection configuration holds the actual database URLs** in the Neon dashboard.
7. **Never commit secrets**, print secrets, or store credentials in documentation.
8. **Zero Production secrets in CI.** PROD_DATABASE_URL and production BETTER_AUTH_SECRET are NEVER in GitHub Actions.
9. **Zero Production credentials in Preview.** Preview uses DEV_DATABASE_URL, not Production.
10. **BETTER_AUTH_URL must match the actual runtime origin per environment.** Never use `localhost` in remote deployment.
11. **Bootstrap credentials can be removed after bootstrap.** The users already exist in the DB after the first bootstrap run.
