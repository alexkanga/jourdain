import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

/**
 * Integration tests — offer CRUD + lifecycle against real TEST_DATABASE_URL.
 *
 * NO DB MOCKS (per ADR-0008). These tests run against the real TEST Neon
 * target (positively verified). Each test creates its own test offers and
 * cleans them up to keep the test isolated.
 *
 * Verifies (per WP-003 contract):
 * - create DRAFT (status='DRAFT', published_at NULL)
 * - edit DRAFT (preserves DRAFT, published_at stays NULL, updated_at changes)
 * - DRAFT → PUBLISHED (publish sets published_at to now())
 * - edit PUBLISHED (preserves PUBLISHED status, preserves published_at, FR-025)
 * - PUBLISHED → SUSPENDED (preserves content + published_at, BR-023)
 * - SUSPENDED → PUBLISHED (preserves published_at, BR-022)
 * - DRAFT/PUBLISHED/SUSPENDED → ARCHIVED (preserves content + published_at)
 * - ARCHIVED soft-restore (BR-024 V1.1):
 *     - ARCHIVED + published_at NULL    → DRAFT     (never-published)
 *     - ARCHIVED + published_at NOT NULL → SUSPENDED (previously-published, NO auto-republish)
 * - Restore preserves published_at (NEVER reset)
 * - invalid transitions rejected server-side (incl. Restore on non-ARCHIVED)
 * - no physical delete path
 * - deadline does NOT mutate status (FR-035)
 * - Tiptap JSON round-trip
 * - ADMIN/FANTOMAS authorization remains principalType-based (verified at
 *   the can() layer in unit tests; here we verify the service layer does
 *   not depend on principalType — authorization is enforced at the Server
 *   Action layer via requireCapability).
 */

function parseEnvLocal(): Record<string, string> {
  const txt = readFileSync("/home/z/my-project/jourdain/.env.local", "utf8");
  const out: Record<string, string> = {};
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    out[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return out;
}

const env = parseEnvLocal();
const TEST_URL = env.TEST_DATABASE_URL!;
if (!TEST_URL) {
  throw new Error("TEST_DATABASE_URL must be set for integration tests");
}

// Force DATABASE_URL to TEST for the offers service (which reads from db/index.ts)
process.env.DATABASE_URL = TEST_URL;

// Imports must be lazy-loaded AFTER process.env.DATABASE_URL is set so the db
// lazy proxy initializes against the TEST target.
async function importOffersService() {
  return await import("../lib/server/services/offers");
}

const rawSql = neon(TEST_URL);

// Test offer IDs created during a test run — cleaned up in afterEach / afterAll.
const createdOfferIds: string[] = [];

async function cleanupTestOffers() {
  if (createdOfferIds.length === 0) return;
  // Use parameterized IN via ANY — neon tagged template supports arrays.
  const ids = createdOfferIds.splice(0);
  // Delete in batches to avoid IN-list issues
  for (const id of ids) {
    await rawSql`DELETE FROM "offers" WHERE id = ${id}`;
  }
}

const SAMPLE_TIPTAP_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Description de test" }],
    },
  ],
};

const SAMPLE_OFFER_INPUT = {
  title: "Test offer — integration",
  description: SAMPLE_TIPTAP_DOC,
  company: "ACME",
  sector: "Tech",
  applicationEmail: "rh@example.com",
  applicationUrl: "https://apply.example.com",
  applicationDeadline: "2026-12-31",
};

beforeAll(async () => {
  // Verify test target reachable
  const r = await rawSql`SELECT 1 AS one`;
  if (!r || r.length === 0) throw new Error("TEST DB not reachable");
});

afterAll(async () => {
  await cleanupTestOffers();
});

describe("offers integration — CRUD + lifecycle (real TEST_DATABASE_URL)", () => {
  let offers: Awaited<ReturnType<typeof importOffersService>>;

  beforeAll(async () => {
    offers = await importOffersService();
  });

  it("create DRAFT — status DRAFT, published_at NULL (BR-021)", async () => {
    const r = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    createdOfferIds.push(r.data.id);
    const row = await offers.getOfferById(r.data.id);
    expect(row).not.toBeNull();
    expect(row!.status).toBe("DRAFT");
    expect(row!.publishedAt).toBeNull();
    expect(row!.title).toBe(SAMPLE_OFFER_INPUT.title);
  });

  it("edit DRAFT — preserves DRAFT status, published_at stays NULL (FR-022)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    const before = await offers.getOfferById(create.data.id);
    expect(before!.status).toBe("DRAFT");
    expect(before!.publishedAt).toBeNull();

    // Wait to ensure updated_at differs
    await new Promise((r) => setTimeout(r, 50));

    const upd = await offers.updateOffer(create.data.id, {
      ...SAMPLE_OFFER_INPUT,
      title: "Test offer — edited",
    });
    expect(upd.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("DRAFT"); // preserved
    expect(after!.publishedAt).toBeNull(); // preserved
    expect(after!.title).toBe("Test offer — edited");
    expect(after!.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
  });

  it("DRAFT → PUBLISHED — publish sets published_at (FR-030, BR-022)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);

    const pub = await offers.publishOffer(create.data.id);
    expect(pub.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("PUBLISHED");
    expect(after!.publishedAt).not.toBeNull();
    // published_at should be approximately now
    const diff = Math.abs(Date.now() - after!.publishedAt!.getTime());
    expect(diff).toBeLessThan(5000); // within 5 seconds
  });

  it("edit PUBLISHED — preserves PUBLISHED status + published_at (FR-025, BR-022)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const before = await offers.getOfferById(create.data.id);
    expect(before!.status).toBe("PUBLISHED");
    const originalPublishedAt = before!.publishedAt!;

    await new Promise((r) => setTimeout(r, 50));

    const upd = await offers.updateOffer(create.data.id, {
      ...SAMPLE_OFFER_INPUT,
      title: "Edited PUBLISHED",
    });
    expect(upd.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("PUBLISHED"); // preserved
    expect(after!.publishedAt!.getTime()).toBe(originalPublishedAt.getTime()); // preserved
    expect(after!.title).toBe("Edited PUBLISHED");
  });

  it("PUBLISHED → SUSPENDED — preserves content + published_at (FR-031, BR-023)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const before = await offers.getOfferById(create.data.id);
    const originalPublishedAt = before!.publishedAt!;

    const sus = await offers.suspendOffer(create.data.id);
    expect(sus.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("SUSPENDED");
    expect(after!.publishedAt!.getTime()).toBe(originalPublishedAt.getTime()); // preserved
    expect(after!.title).toBe(SAMPLE_OFFER_INPUT.title); // content preserved
  });

  it("SUSPENDED → PUBLISHED — preserves published_at NOT overwritten (FR-032, BR-022)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const afterPub = await offers.getOfferById(create.data.id);
    const originalPublishedAt = afterPub!.publishedAt!;

    await new Promise((r) => setTimeout(r, 50));

    await offers.suspendOffer(create.data.id);
    const rep = await offers.republishOffer(create.data.id);
    expect(rep.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("PUBLISHED");
    expect(after!.publishedAt!.getTime()).toBe(originalPublishedAt.getTime()); // PRESERVED, not overwritten
  });

  it("DRAFT → ARCHIVED (FR-033)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    const r = await offers.archiveOffer(create.data.id);
    expect(r.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("ARCHIVED");
    expect(after!.publishedAt).toBeNull(); // was never published
  });

  it("PUBLISHED → ARCHIVED preserves published_at (FR-033, BR-024)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const before = await offers.getOfferById(create.data.id);
    const originalPublishedAt = before!.publishedAt!;
    const r = await offers.archiveOffer(create.data.id);
    expect(r.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("ARCHIVED");
    expect(after!.publishedAt!.getTime()).toBe(originalPublishedAt.getTime());
  });

  it("SUSPENDED → ARCHIVED (FR-033)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    await offers.suspendOffer(create.data.id);
    const r = await offers.archiveOffer(create.data.id);
    expect(r.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("ARCHIVED");
  });

  it("ARCHIVED soft-restore — active lifecycle actions rejected on ARCHIVED (BR-024 V1.1)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    await offers.archiveOffer(create.data.id);

    // Active lifecycle actions (NOT Restore) must be rejected on ARCHIVED.
    const pub = await offers.publishOffer(create.data.id);
    expect(pub.ok).toBe(false);
    const sus = await offers.suspendOffer(create.data.id);
    expect(sus.ok).toBe(false);
    const rep = await offers.republishOffer(create.data.id);
    expect(rep.ok).toBe(false);
    const arc = await offers.archiveOffer(create.data.id);
    expect(arc.ok).toBe(false); // already archived
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("ARCHIVED"); // unchanged
  });

  it("ARCHIVED never-published → Restore → DRAFT (BR-024 V1.1)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    // DRAFT → ARCHIVED directly (never published)
    await offers.archiveOffer(create.data.id);
    const before = await offers.getOfferById(create.data.id);
    expect(before!.status).toBe("ARCHIVED");
    expect(before!.publishedAt).toBeNull();

    const r = await offers.restoreOffer(create.data.id);
    expect(r.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("DRAFT");
    expect(after!.publishedAt).toBeNull(); // never published — still NULL
  });

  it("ARCHIVED previously-published → Restore → SUSPENDED (BR-024 V1.1, NO auto-republish)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const publishedAt = (await offers.getOfferById(create.data.id))!.publishedAt!;
    await offers.archiveOffer(create.data.id);
    const before = await offers.getOfferById(create.data.id);
    expect(before!.status).toBe("ARCHIVED");
    expect(before!.publishedAt).not.toBeNull();

    const r = await offers.restoreOffer(create.data.id);
    expect(r.ok).toBe(true);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("SUSPENDED"); // NOT PUBLISHED — no auto-republish
    expect(after!.publishedAt!.getTime()).toBe(publishedAt.getTime()); // preserved
  });

  it("Restore preserves published_at — previously-published (BR-022, BR-024 V1.1)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const originalPublishedAt = (await offers.getOfferById(create.data.id))!.publishedAt!;
    await offers.suspendOffer(create.data.id);
    await offers.archiveOffer(create.data.id);

    await new Promise((r) => setTimeout(r, 50));

    await offers.restoreOffer(create.data.id);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("SUSPENDED");
    expect(after!.publishedAt!.getTime()).toBe(originalPublishedAt.getTime()); // PRESERVED, not reset
  });

  it("Restore preserves published_at NULL — never-published (BR-022, BR-024 V1.1)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.archiveOffer(create.data.id);

    await offers.restoreOffer(create.data.id);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("DRAFT");
    expect(after!.publishedAt).toBeNull(); // preserved NULL
  });

  it("Restored SUSPENDED offer is NOT publicly visible (no auto-republish)", async () => {
    // Re-uses public-offers service to verify visibility boundary.
    const publicOffers = await import("../lib/server/services/public-offers");
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    await offers.archiveOffer(create.data.id);
    await offers.restoreOffer(create.data.id);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("SUSPENDED");

    // Public detail must return null (SUSPENDED is hidden — BR-025).
    const pub = await publicOffers.getPublishedOfferById(create.data.id);
    expect(pub).toBeNull();
    // Public list must NOT contain the restored SUSPENDED offer.
    const { items } = await publicOffers.listPublishedOffers({});
    expect(items.some((o) => o.id === create.data.id)).toBe(false);
  });

  it("Explicit Republier on restored SUSPENDED offer restores public visibility", async () => {
    const publicOffers = await import("../lib/server/services/public-offers");
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const originalPublishedAt = (await offers.getOfferById(create.data.id))!.publishedAt!;
    await offers.archiveOffer(create.data.id);
    await offers.restoreOffer(create.data.id);
    const restored = await offers.getOfferById(create.data.id);
    expect(restored!.status).toBe("SUSPENDED");

    // Explicit Republier → PUBLISHED → public visibility restored
    await offers.republishOffer(create.data.id);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("PUBLISHED");
    expect(after!.publishedAt!.getTime()).toBe(originalPublishedAt.getTime()); // STILL preserved
    const pub = await publicOffers.getPublishedOfferById(create.data.id);
    expect(pub).not.toBeNull();
    expect(pub!.title).toBe(SAMPLE_OFFER_INPUT.title);
  });

  it("Restore on non-ARCHIVED rejected (DRAFT, PUBLISHED, SUSPENDED)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);

    // Restore on DRAFT rejected
    const r1 = await offers.restoreOffer(create.data.id);
    expect(r1.ok).toBe(false);
    expect(r1.ok === false && r1.error).toContain("pas archivée");

    // Restore on PUBLISHED rejected
    await offers.publishOffer(create.data.id);
    const r2 = await offers.restoreOffer(create.data.id);
    expect(r2.ok).toBe(false);
    expect(r2.ok === false && r2.error).toContain("pas archivée");

    // Restore on SUSPENDED rejected
    await offers.suspendOffer(create.data.id);
    const r3 = await offers.restoreOffer(create.data.id);
    expect(r3.ok).toBe(false);
    expect(r3.ok === false && r3.error).toContain("pas archivée");
  });

  it("Restore on already-ARCHIVED twice — second Restore returns to DRAFT/SUSPENDED again", async () => {
    // Idempotent soft-restore: ARCHIVED → DRAFT/SUSPENDED → ARCHIVED → DRAFT/SUSPENDED again.
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const publishedAt = (await offers.getOfferById(create.data.id))!.publishedAt!;

    await offers.archiveOffer(create.data.id);
    await offers.restoreOffer(create.data.id);
    expect((await offers.getOfferById(create.data.id))!.status).toBe("SUSPENDED");
    await offers.archiveOffer(create.data.id);
    await offers.restoreOffer(create.data.id);
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("SUSPENDED");
    expect(after!.publishedAt!.getTime()).toBe(publishedAt.getTime()); // STILL preserved
  });

  it("invalid transitions rejected server-side (DRAFT→SUSPEND, PUBLISHED→PUBLISH)", async () => {
    const create = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);

    // DRAFT → SUSPEND rejected
    const sus = await offers.suspendOffer(create.data.id);
    expect(sus.ok).toBe(false);
    expect(sus.ok === false && sus.error).toContain("pas publiée");

    // DRAFT → REPUBLISH rejected
    const rep = await offers.republishOffer(create.data.id);
    expect(rep.ok).toBe(false);
    expect(rep.ok === false && rep.error).toContain("pas suspendue");

    // Publish, then PUBLISHED → PUBLISH rejected
    await offers.publishOffer(create.data.id);
    const pub2 = await offers.publishOffer(create.data.id);
    expect(pub2.ok).toBe(false);
    expect(pub2.ok === false && pub2.error).toContain("pas en brouillon");
  });

  it("application_deadline does NOT mutate status (FR-035, BR-026)", async () => {
    const create = await offers.createOffer({
      ...SAMPLE_OFFER_INPUT,
      applicationDeadline: "2020-01-01", // past deadline
    });
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);
    await offers.publishOffer(create.data.id);
    const before = await offers.getOfferById(create.data.id);
    expect(before!.status).toBe("PUBLISHED");

    // Wait a moment — no scheduler runs, status stays PUBLISHED
    await new Promise((r) => setTimeout(r, 100));
    const after = await offers.getOfferById(create.data.id);
    expect(after!.status).toBe("PUBLISHED"); // unchanged
  });

  it("Tiptap JSON round-trip (BR-034)", async () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Titre" }] },
        { type: "paragraph", content: [{ type: "text", text: "Paragraph 1" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }] },
        ] },
      ],
    };
    const create = await offers.createOffer({
      ...SAMPLE_OFFER_INPUT,
      description: doc,
    });
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    createdOfferIds.push(create.data.id);

    const row = await offers.getOfferById(create.data.id);
    // description should round-trip as the same JSON structure
    expect(row!.description).toEqual(doc);
  });

  it("no physical delete path in service layer (FR-034)", async () => {
    // The offers service exports: listOffers, getOfferById, createOffer,
    // updateOffer, publishOffer, suspendOffer, republishOffer, archiveOffer, restoreOffer.
    // There is NO deleteOffer function. Verify the export surface.
    expect(typeof offers.createOffer).toBe("function");
    expect(typeof offers.updateOffer).toBe("function");
    expect(typeof offers.publishOffer).toBe("function");
    expect(typeof offers.suspendOffer).toBe("function");
    expect(typeof offers.republishOffer).toBe("function");
    expect(typeof offers.archiveOffer).toBe("function");
    expect(typeof offers.restoreOffer).toBe("function");
    expect(offers).not.toHaveProperty("deleteOffer");
  });

  it("admin list returns offers sorted by created_at DESC (FR-010)", async () => {
    // Create two offers with a small delay
    const c1 = await offers.createOffer({ ...SAMPLE_OFFER_INPUT, title: "List-1" });
    expect(c1.ok).toBe(true);
    if (!c1.ok) return;
    createdOfferIds.push(c1.data.id);
    await new Promise((r) => setTimeout(r, 50));
    const c2 = await offers.createOffer({ ...SAMPLE_OFFER_INPUT, title: "List-2" });
    expect(c2.ok).toBe(true);
    if (!c2.ok) return;
    createdOfferIds.push(c2.data.id);

    const { items } = await offers.listOffers({});
    expect(items.length).toBeGreaterThanOrEqual(2);
    // Find our two offers in the list
    const our = items.filter((i) => [c1.data.id, c2.data.id].includes(i.id));
    expect(our.length).toBe(2);
    // c2 (created later) should appear before c1 (created_at DESC)
    expect(our[0].id).toBe(c2.data.id);
    expect(our[1].id).toBe(c1.data.id);
  });

  it("admin status filter narrows results (FR-012)", async () => {
    const c = await offers.createOffer(SAMPLE_OFFER_INPUT);
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    createdOfferIds.push(c.data.id);
    await offers.publishOffer(c.data.id);

    const draftOnly = await offers.listOffers({ status: "DRAFT" });
    const publishedOnly = await offers.listOffers({ status: "PUBLISHED" });
    expect(draftOnly.items.every((i) => i.status === "DRAFT")).toBe(true);
    expect(publishedOnly.items.every((i) => i.status === "PUBLISHED")).toBe(true);
    expect(publishedOnly.items.some((i) => i.id === c.data.id)).toBe(true);
  });

  it("admin title search uses ILIKE (FR-013)", async () => {
    const c = await offers.createOffer({ ...SAMPLE_OFFER_INPUT, title: "UNIQUE_SEARCH_TERM_12345" });
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    createdOfferIds.push(c.data.id);

    const r = await offers.listOffers({ q: "unique_search_term" });
    expect(r.items.some((i) => i.id === c.data.id)).toBe(true);
    const r2 = await offers.listOffers({ q: "no_such_term_zzz" });
    expect(r2.items.some((i) => i.id === c.data.id)).toBe(false);
  });
});
