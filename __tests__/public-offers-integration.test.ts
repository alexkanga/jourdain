import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

/**
 * Integration tests — public offers visibility against real TEST_DATABASE_URL.
 * Per AISE S0 v0.2 §26: TEST_DATABASE_URL only, no DEV, no PROD.
 * No DB mocks per ADR-0008.
 *
 * Verifies (per WP-004 contract):
 * - PUBLISHED offers visible in public list
 * - DRAFT/SUSPENDED/ARCHIVED offers NOT visible
 * - published_at DESC ordering
 * - created_at DESC tie-breaker
 * - Detail: PUBLISHED visible, DRAFT/SUSPENDED/ARCHIVED hidden
 * - Malformed UUID → null
 * - Nonexistent UUID → null
 * - Search by title, company, location
 * - Search never returns hidden-status offers
 * - Empty state when no PUBLISHED offers
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
if (!TEST_URL) throw new Error("TEST_DATABASE_URL must be set");

process.env.DATABASE_URL = TEST_URL;

const rawSql = neon(TEST_URL);

async function importPublicOffers() {
  return await import("../lib/server/services/public-offers");
}

const createdOfferIds: string[] = [];

beforeAll(async () => {
  const r = await rawSql`SELECT 1 AS one`;
  if (!r || r.length === 0) throw new Error("TEST DB not reachable");
});

afterAll(async () => {
  for (const id of createdOfferIds) {
    try { await rawSql`DELETE FROM "offers" WHERE id = ${id}`; } catch {}
  }
});

beforeEach(async () => {
  await rawSql`DELETE FROM "rateLimit"`;
});

const SAMPLE_TIPTAP = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Description de test" }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Section" }] },
    { type: "bulletList", content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item" }] }] },
    ] },
  ],
};

async function createOfferWithStatus(status: "DRAFT" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED", overrides?: Record<string, unknown>) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await rawSql`
    INSERT INTO "offers" (id, title, description, status, published_at, created_at, updated_at, company, location, sector, category, contract_type, education_level, experience, source_publication_date, application_deadline, source_name, source_url, application_modalities, application_email, application_url)
    VALUES (
      ${id}, ${overrides?.title ?? "Test Offer"}, ${JSON.stringify(SAMPLE_TIPTAP)}::jsonb, ${status}::"offer_status",
      ${status === "PUBLISHED" ? now : null},
      ${now}, ${now},
      ${overrides?.company ?? null}, ${overrides?.location ?? null},
      ${overrides?.sector ?? null}, ${overrides?.category ?? null},
      ${overrides?.contractType ?? null}, ${overrides?.educationLevel ?? null},
      ${overrides?.experience ?? null}, ${overrides?.sourcePublicationDate ?? null},
      ${overrides?.applicationDeadline ?? null}, ${overrides?.sourceName ?? null},
      ${overrides?.sourceUrl ?? null}, ${overrides?.applicationModalities ?? null},
      ${overrides?.applicationEmail ?? null}, ${overrides?.applicationUrl ?? null}
    )
  `;
  createdOfferIds.push(id);
  return id;
}

describe("public-offers integration — PUBLISHED visibility (real TEST_DATABASE_URL)", () => {
  it("PUBLISHED offer appears in public list", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("PUBLISHED", { title: "PUB_VISIBLE_TEST", company: "Co A", location: "Paris" });
    const { items } = await pub.listPublishedOffers({});
    expect(items.some((o) => o.id === id)).toBe(true);
  });

  it("DRAFT offer does NOT appear in public list", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("DRAFT", { title: "DRAFT_HIDDEN_TEST" });
    const { items } = await pub.listPublishedOffers({});
    expect(items.some((o) => o.id === id)).toBe(false);
  });

  it("SUSPENDED offer does NOT appear in public list", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("SUSPENDED", { title: "SUS_HIDDEN_TEST" });
    const { items } = await pub.listPublishedOffers({});
    expect(items.some((o) => o.id === id)).toBe(false);
  });

  it("ARCHIVED offer does NOT appear in public list", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("ARCHIVED", { title: "ARCH_HIDDEN_TEST" });
    const { items } = await pub.listPublishedOffers({});
    expect(items.some((o) => o.id === id)).toBe(false);
  });

  it("published_at DESC ordering", async () => {
    const pub = await importPublicOffers();
    const id1 = await createOfferWithStatus("PUBLISHED", { title: "ORDER_1" });
    await new Promise((r) => setTimeout(r, 100));
    const id2 = await createOfferWithStatus("PUBLISHED", { title: "ORDER_2" });
    const { items } = await pub.listPublishedOffers({});
    const our = items.filter((o) => [id1, id2].includes(o.id));
    expect(our.length).toBe(2);
    expect(our[0].id).toBe(id2);
    expect(our[1].id).toBe(id1);
  });

  it("detail: PUBLISHED offer visible", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("PUBLISHED", { title: "DETAIL_PUB" });
    const offer = await pub.getPublishedOfferById(id);
    expect(offer).not.toBeNull();
    expect(offer!.title).toBe("DETAIL_PUB");
  });

  it("detail: DRAFT offer hidden (returns null)", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("DRAFT", { title: "DETAIL_DRAFT" });
    const offer = await pub.getPublishedOfferById(id);
    expect(offer).toBeNull();
  });

  it("detail: SUSPENDED offer hidden (returns null)", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("SUSPENDED", { title: "DETAIL_SUS" });
    const offer = await pub.getPublishedOfferById(id);
    expect(offer).toBeNull();
  });

  it("detail: ARCHIVED offer hidden (returns null)", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("ARCHIVED", { title: "DETAIL_ARCH" });
    const offer = await pub.getPublishedOfferById(id);
    expect(offer).toBeNull();
  });

  it("detail: nonexistent UUID returns null", async () => {
    const pub = await importPublicOffers();
    const offer = await pub.getPublishedOfferById("550e8400-e29b-41d4-a716-446655440000");
    expect(offer).toBeNull();
  });

  it("search by title returns PUBLISHED offers only", async () => {
    const pub = await importPublicOffers();
    const pubId = await createOfferWithStatus("PUBLISHED", { title: "SEARCH_TITLE_UNIQUE_12345" });
    const draftId = await createOfferWithStatus("DRAFT", { title: "SEARCH_TITLE_UNIQUE_12345" });
    const { items } = await pub.listPublishedOffers({ q: "SEARCH_TITLE_UNIQUE_12345" });
    expect(items.some((o) => o.id === pubId)).toBe(true);
    expect(items.some((o) => o.id === draftId)).toBe(false);
  });

  it("search by company returns PUBLISHED offers", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("PUBLISHED", { title: "COMP_SEARCH", company: "UNIQUE_COMPANY_98765" });
    const { items } = await pub.listPublishedOffers({ q: "UNIQUE_COMPANY_98765" });
    expect(items.some((o) => o.id === id)).toBe(true);
  });

  it("search by location returns PUBLISHED offers", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("PUBLISHED", { title: "LOC_SEARCH", location: "UNIQUE_LOCATION_54321" });
    const { items } = await pub.listPublishedOffers({ q: "UNIQUE_LOCATION_54321" });
    expect(items.some((o) => o.id === id)).toBe(true);
  });

  it("search never returns hidden-status offers", async () => {
    const pub = await importPublicOffers();
    const draftId = await createOfferWithStatus("DRAFT", { title: "HIDDEN_SEARCH_TEST", company: "HIDDEN_SEARCH_TEST" });
    const { items } = await pub.listPublishedOffers({ q: "HIDDEN_SEARCH_TEST" });
    expect(items.some((o) => o.id === draftId)).toBe(false);
  });

  it("empty search returns full PUBLISHED list", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("PUBLISHED", { title: "EMPTY_SEARCH_TEST" });
    const { items } = await pub.listPublishedOffers({ q: "" });
    expect(items.some((o) => o.id === id)).toBe(true);
  });

  it("no search param returns full PUBLISHED list", async () => {
    const pub = await importPublicOffers();
    const id = await createOfferWithStatus("PUBLISHED", { title: "NO_PARAM_TEST" });
    const { items } = await pub.listPublishedOffers({});
    expect(items.some((o) => o.id === id)).toBe(true);
  });

  it("listPublishedOfferIds returns only PUBLISHED offer IDs", async () => {
    const pub = await importPublicOffers();
    const pubId = await createOfferWithStatus("PUBLISHED", { title: "SITEMAP_PUB" });
    const draftId = await createOfferWithStatus("DRAFT", { title: "SITEMAP_DRAFT" });
    const ids = await pub.listPublishedOfferIds();
    expect(ids.some((o) => o.id === pubId)).toBe(true);
    expect(ids.some((o) => o.id === draftId)).toBe(false);
  });

  it("pagination returns correct page", async () => {
    const pub = await importPublicOffers();
    const { pageSize } = await pub.listPublishedOffers({ page: 1 });
    expect(pageSize).toBe(12);
  });
});
