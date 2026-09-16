import { describe, it, expect } from "vitest";
import { offerSchema, offerIdSchema, offerListFilterSchema } from "../lib/server/validation/schemas";

/**
 * Unit tests — Zod validation schemas for WP-003.
 *
 * Server-side validation is authoritative (per FR-023, FR-024, BR-030,
 * BR-031, BR-080). These tests verify the schemas behave as specified.
 */

describe("offerSchema — required fields", () => {
  it("rejects empty title", () => {
    const r = offerSchema.safeParse({
      title: "",
      description: { type: "doc", content: [] },
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe("Le titre est requis");
  });

  it("rejects missing title", () => {
    const r = offerSchema.safeParse({
      description: { type: "doc", content: [] },
    });
    expect(r.success).toBe(false);
  });

  it("rejects null description", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: null,
    });
    expect(r.success).toBe(false);
  });

  it("rejects missing description", () => {
    const r = offerSchema.safeParse({ title: "Test" });
    expect(r.success).toBe(false);
  });

  it("accepts minimal valid offer (title + Tiptap doc)", () => {
    const r = offerSchema.safeParse({
      title: "Test offer",
      description: { type: "doc", content: [{ type: "paragraph" }] },
    });
    expect(r.success).toBe(true);
  });
});

describe("offerSchema — optional fields", () => {
  it("accepts all optional fields empty/undefined", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      company: undefined,
      sector: undefined,
      category: undefined,
    });
    expect(r.success).toBe(true);
  });

  it("accepts all optional fields with values", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      company: "ACME",
      sector: "Tech",
      category: "Engineering",
      contractType: "CDI",
      educationLevel: "Bac+5",
      experience: "5 ans",
      location: "Paris",
      sourcePublicationDate: "2026-01-01",
      applicationDeadline: "2026-06-30",
      sourceName: "Source",
      sourceUrl: "https://example.com",
      applicationModalities: "Envoyez CV",
      applicationEmail: "rh@example.com",
      applicationUrl: "https://apply.example.com",
    });
    expect(r.success).toBe(true);
  });
});

describe("offerSchema — URL/email format validation (BR-080)", () => {
  it("rejects invalid application_email when provided", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationEmail: "not-an-email",
    });
    expect(r.success).toBe(false);
  });

  it("accepts empty application_email (optional)", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationEmail: "",
    });
    expect(r.success).toBe(true);
  });

  it("accepts valid application_email", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationEmail: "rh@example.com",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid application_url when provided", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationUrl: "not-a-url",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid source_url when provided", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      sourceUrl: "not-a-url",
    });
    expect(r.success).toBe(false);
  });

  it("accepts empty source_url (optional)", () => {
    const r = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      sourceUrl: "",
    });
    expect(r.success).toBe(true);
  });
});

describe("offerIdSchema", () => {
  it("accepts valid UUID", () => {
    const r = offerIdSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(r.success).toBe(true);
  });

  it("rejects non-UUID", () => {
    const r = offerIdSchema.safeParse({ id: "not-a-uuid" });
    expect(r.success).toBe(false);
  });
});

describe("offerListFilterSchema", () => {
  it("accepts valid status enum", () => {
    for (const s of ["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"] as const) {
      const r = offerListFilterSchema.safeParse({ status: s });
      expect(r.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const r = offerListFilterSchema.safeParse({ status: "INVALID" });
    expect(r.success).toBe(false);
  });

  it("accepts page as coerced number", () => {
    const r = offerListFilterSchema.safeParse({ page: "2" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.page).toBe(2);
  });
});
