import { describe, it, expect } from "vitest";
import { offerSchema, loginSchema } from "../lib/server/validation/schemas";

describe("offerSchema validation", () => {
  it("requires title", () => {
    const result = offerSchema.safeParse({ description: {} });
    expect(result.success).toBe(false);
  });

  it("requires description", () => {
    const result = offerSchema.safeParse({ title: "Test Offer" });
    expect(result.success).toBe(false);
  });

  it("accepts title and description only (minimal valid offer)", () => {
    const result = offerSchema.safeParse({
      title: "Test Offer",
      description: { type: "doc", content: [] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields as empty/undefined", () => {
    const result = offerSchema.safeParse({
      title: "Test Offer",
      description: { type: "doc", content: [] },
      company: undefined,
      sector: undefined,
      category: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields with values", () => {
    const result = offerSchema.safeParse({
      title: "Test Offer",
      description: { type: "doc", content: [] },
      company: "ACME",
      sector: "Tech",
      category: "Engineering",
      contractType: "CDI",
      educationLevel: "Bac+5",
      experience: "5 ans",
      location: "Paris",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format for applicationEmail", () => {
    const result = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid email for applicationEmail", () => {
    const result = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationEmail: "contact@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for applicationEmail (optional)", () => {
    const result = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationEmail: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL for sourceUrl", () => {
    const result = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      sourceUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid URL for sourceUrl", () => {
    const result = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      sourceUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL for applicationUrl", () => {
    const result = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      applicationUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for optional URL fields", () => {
    const result = offerSchema.safeParse({
      title: "Test",
      description: { type: "doc", content: [] },
      sourceUrl: "",
      applicationUrl: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema validation", () => {
  it("requires username", () => {
    const result = loginSchema.safeParse({ password: "pass" });
    expect(result.success).toBe(false);
  });

  it("requires password", () => {
    const result = loginSchema.safeParse({ username: "admin1" });
    expect(result.success).toBe(false);
  });

  it("accepts username and password", () => {
    const result = loginSchema.safeParse({ username: "admin1", password: "secret" });
    expect(result.success).toBe(true);
  });
});
