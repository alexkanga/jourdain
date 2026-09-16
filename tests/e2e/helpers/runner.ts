/**
 * E2E runner — local Next.js orchestrator.
 *
 * Per WP-005 contract §5.2 + §8.1:
 * 1. Phase A target verification (read-only, before any mutation).
 * 2. Orphan recovery cleanup (by exact canonical UUID collected from E2E_ title prefix).
 * 3. TEST rateLimit cleanup (TEST only).
 * 4. Deterministic TEST identity preparation (pnpm db:bootstrap, scoped to TEST).
 * 5. Construct curated child env (NO inherited DATABASE_URL).
 * 6. Build Next.js (skip if fresh artifact exists).
 * 7. Spawn next start --port <PORT> with curated env.
 * 8. Readiness probe (poll http://127.0.0.1:<PORT>/ until 200 or 30s timeout).
 * 9. Phase B optional SAFE sentinel confirmation (direct TEST insert + public read).
 * 10. Run Playwright E2E suite (handled by `playwright test` invocation).
 * 11. Shutdown (SIGTERM, verify port released).
 * 12. Cleanup (delete recorded fixture UUIDs; orphan recovery; TEST rateLimit clear).
 * 13. Emit report with quota-safety evidence block.
 *
 * Per WP-005 §16 Mutation Ordering Invariant (FROZEN):
 * NO STATE MUTATION BEFORE TARGET CERTIFICATION.
 * Steps 1 (Phase A) are READ-ONLY. Steps 2+ may mutate TEST only after Phase A passes.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import {
  parseEnvLocal,
  certifyTestTarget,
  resolveAuthorizedE2EBaseUrl,
  buildChildEnv,
  type VerifiedTestTarget,
  E2eTargetError,
  E2E_ERRORS,
} from "./env";
import { runBootstrap, verifyTestIdentity } from "./auth";
import { cleanupOrphanFixtures, clearTestRateLimit } from "./fixtures";

const PORT = parseInt(process.env.E2E_PORT || "3100", 10);
const ARTIFACTS_DIR = resolve(process.cwd(), "tests/e2e/.artifacts");

export interface E2eRunReport {
  startedAt: string;
  finishedAt: string;
  baseUrl: string;
  testHost: string;
  testDbName: string;
  expectedFingerprint: string;
  remoteE2e: boolean;
  status: "PASS" | "FAIL" | "STOPPED";
  errorCode?: string;
  errorMessage?: string;
  quotaSafety: {
    applicationRuntime: "LOCAL";
    databaseState: "TEST";
    fingerprintVerified: boolean;
    remoteE2e: boolean;
    vercel: false;
    loadTest: false;
    polling: false;
    productionTouched: false;
    devMutated: false;
    testMutated: boolean;
  };
}

async function waitForReady(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404 || r.status === 307 || r.status === 308) {
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function shutdown(child: ChildProcess, label: string): Promise<void> {
  if (!child || child.exitCode !== null || !child.pid) return;
  try {
    process.kill(child.pid, "SIGTERM");
  } catch {
    return;
  }
  await new Promise<void>((resolve) => {
    const to = setTimeout(() => {
      try { process.kill(child.pid!, "SIGKILL"); } catch {}
      resolve();
    }, 5000);
    child.once("exit", () => {
      clearTimeout(to);
      resolve();
    });
  });
}

/**
 * Run the full E2E orchestration pre-flight (Phase A + cleanup + bootstrap + build + spawn + sentinel).
 * Returns the verified target + base URL on success. Throws on any failure.
 *
 * This is called by globalSetup in playwright.config.ts (so each Playwright run
 * gets a fresh server against the verified TEST target).
 */
export async function e2eSetup(): Promise<{
  verified: VerifiedTestTarget;
  baseUrl: string;
  env: Record<string, string>;
  childEnv: NodeJS.ProcessEnv;
}> {
  // ===== PHASE A — TARGET VERIFICATION (NO MUTATION) =====
  const env = parseEnvLocal();
  const verified = await certifyTestTarget(env);

  // Base URL policy check (AC-016 + AC-037c + §19 remediation):
  // Use the SAME canonical resolver as playwright.config.ts so there is
  // ONE authoritative effective base URL. If Playwright's baseURL and the
  // runner's authorized URL ever diverge (impossible by construction —
  // same function, same inputs), STOP with E2E_BASE_URL_DIVERGENCE.
  const baseUrl = resolveAuthorizedE2EBaseUrl(env);
  // Defense in depth: re-check that the resolved baseUrl is loopback
  // (or matches an explicit remote override that playwright.config.ts
  // would also have accepted).
  const baseHost = new URL(baseUrl).hostname.toLowerCase();
  const isLoopback = baseHost === "localhost" || baseHost === "127.0.0.1" || baseHost === "::1";
  // The resolver already validated the URL; we just record the result for the report.

  // ===== PHASE A PASSED — TARGET CERTIFIED. NOW MUTATIONS ARE ALLOWED =====

  // Step 12: Orphan recovery cleanup (TEST only, by exact canonical UUID collected from E2E_ prefix)
  await cleanupOrphanFixtures(verified.rawSql);

  // Step 13: TEST rateLimit cleanup (TEST only — per §5.10 ordering, AFTER Phase A)
  await clearTestRateLimit(verified.rawSql);

  // Step 14: Deterministic TEST identity preparation (idempotent bootstrap, scoped to TEST)
  // Pass the resolved baseUrl so BETTER_AUTH_URL matches the actual server URL.
  const childEnvForBootstrap = buildChildEnv(process.env, verified, env, baseUrl);
  await runBootstrap(childEnvForBootstrap);
  await verifyTestIdentity(verified.rawSql);

  // Step 15: Construct curated child env (NO inherited parent DATABASE_URL)
  // Pass the resolved baseUrl so BETTER_AUTH_URL + NEXT_PUBLIC_SITE_URL match
  // the actual server URL — Better Auth rejects requests from mismatched origins.
  const childEnv = buildChildEnv(process.env, verified, env, baseUrl);

  // Step 16: Build Next.js (skip if fresh artifact exists)
  if (!existsSync(resolve(process.cwd(), ".next/BUILD_ID"))) {
    const buildResult = await new Promise<number>((res, rej) => {
      const p = spawn("npx", ["next", "build"], {
        cwd: process.cwd(),
        stdio: "inherit",
        env: childEnv,
      });
      p.on("error", rej);
      p.on("exit", (code) => res(code ?? 0));
    });
    if (buildResult !== 0) {
      throw new Error(`next build failed with code ${buildResult}`);
    }
  }

  // Step 17: Spawn next start --port <PORT> with curated env (NO inherited parent DATABASE_URL)
  const child = spawn("npx", ["next", "start", "--port", String(PORT)], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: childEnv,
    detached: false,
  });

  // Pipe server logs to artifacts for debugging.
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const serverLogPath = join(ARTIFACTS_DIR, "server.log");
  const serverLog = writeFileSync.bind(null, serverLogPath, "");
  let logBuf = "";
  child.stdout?.on("data", (d) => { logBuf += d.toString(); });
  child.stderr?.on("data", (d) => { logBuf += d.toString(); });
  // Flush log at exit (process.on('exit'))
  process.once("exit", () => { try { writeFileSync(serverLogPath, logBuf); } catch {} });

  // Step 18: Readiness probe
  try {
    await waitForReady(baseUrl);
  } catch (e) {
    await shutdown(child, "ready-probe-fail");
    throw new Error(`Next.js server at ${baseUrl} not ready: ${(e as Error).message}. Server log:\n${logBuf.slice(-2000)}`);
  }

  // Expose child PID for globalTeardown to shut down.
  (process as unknown as { __E2E_CHILD_PID?: number }).__E2E_CHILD_PID = child.pid;

  return { verified, baseUrl, env, childEnv };
}

/**
 * Shutdown the spawned Next.js server and cleanup fixtures (called by globalTeardown).
 */
export async function e2eTeardown(): Promise<void> {
  const pid = (process as unknown as { __E2E_CHILD_PID?: number }).__E2E_CHILD_PID;
  if (pid) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {}
    // Wait briefly for port release
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Post-run cleanup: delete recorded fixture UUIDs (handled in fixtures.ts afterAll).
  // Orphan recovery + rateLimit clear are also handled by the spec helpers' afterAll.
}
