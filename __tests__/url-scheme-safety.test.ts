import { describe, it, expect } from "vitest";
import { offerSchema } from "../lib/server/validation/schemas";

/**
 * Unit tests — application_url and source_url scheme validation in offerSchema.
 * Verifies that the Zod schema rejects non-http(s) schemes at save time.
 */

const base = {
  title: "Test",
  description: { type: "doc", content: [] },
};

describe("offerSchema URL scheme validation — application_url", () => {
  it("accepts https://", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "https://example.com" });
    expect(r.success).toBe(true);
  });

  it("accepts http://", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "http://example.com" });
    expect(r.success).toBe(true);
  });

  it("rejects javascript:", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "javascript:alert(1)" });
    expect(r.success).toBe(false);
  });

  it("rejects data:", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "data:text/html,<script>x</script>" });
    expect(r.success).toBe(false);
  });

  it("rejects vbscript:", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "vbscript:msgbox(1)" });
    expect(r.success).toBe(false);
  });

  it("rejects file:", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "file:///etc/passwd" });
    expect(r.success).toBe(false);
  });

  it("rejects mailto:", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "mailto:test@example.com" });
    expect(r.success).toBe(false);
  });

  it("rejects ftp:", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "ftp://example.com" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed value", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "not-a-url" });
    expect(r.success).toBe(false);
  });

  it("accepts empty string (optional field)", () => {
    const r = offerSchema.safeParse({ ...base, applicationUrl: "" });
    expect(r.success).toBe(true);
  });

  it("accepts undefined (optional field)", () => {
    const r = offerSchema.safeParse({ ...base });
    expect(r.success).toBe(true);
  });
});

describe("offerSchema URL scheme validation — source_url", () => {
  it("accepts https://", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "https://example.com" });
    expect(r.success).toBe(true);
  });

  it("accepts http://", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "http://example.com" });
    expect(r.success).toBe(true);
  });

  it("rejects javascript:", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "javascript:alert(1)" });
    expect(r.success).toBe(false);
  });

  it("rejects data:", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "data:text/html,<script>x</script>" });
    expect(r.success).toBe(false);
  });

  it("rejects vbscript:", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "vbscript:msgbox(1)" });
    expect(r.success).toBe(false);
  });

  it("rejects file:", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "file:///etc/passwd" });
    expect(r.success).toBe(false);
  });

  it("rejects mailto:", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "mailto:test@example.com" });
    expect(r.success).toBe(false);
  });

  it("rejects ftp:", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "ftp://example.com" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed value", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "not-a-url" });
    expect(r.success).toBe(false);
  });

  it("accepts empty string (optional field)", () => {
    const r = offerSchema.safeParse({ ...base, sourceUrl: "" });
    expect(r.success).toBe(true);
  });

  it("accepts undefined (optional field)", () => {
    const r = offerSchema.safeParse({ ...base });
    expect(r.success).toBe(true);
  });
});
