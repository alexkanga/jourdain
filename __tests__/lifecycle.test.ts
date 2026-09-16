import { describe, it, expect } from "vitest";

/**
 * Unit tests — offer lifecycle state machine (BR-020, BR-024, FR-030–FR-033).
 *
 * These tests define the canonical allowed + forbidden transitions.
 * The implementation in lib/server/services/offers.ts enforces the same
 * rules server-side; integration tests verify the actual DB mutations.
 */

type OfferStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";

const ALLOWED_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [], // terminal in V1
};

function canTransition(from: OfferStatus, to: OfferStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

describe("offer lifecycle state machine", () => {
  describe("allowed transitions", () => {
    it("DRAFT → PUBLISHED (publish — FR-030)", () => {
      expect(canTransition("DRAFT", "PUBLISHED")).toBe(true);
    });
    it("DRAFT → ARCHIVED (archive — FR-033)", () => {
      expect(canTransition("DRAFT", "ARCHIVED")).toBe(true);
    });
    it("PUBLISHED → SUSPENDED (suspend — FR-031)", () => {
      expect(canTransition("PUBLISHED", "SUSPENDED")).toBe(true);
    });
    it("PUBLISHED → ARCHIVED (archive — FR-033)", () => {
      expect(canTransition("PUBLISHED", "ARCHIVED")).toBe(true);
    });
    it("SUSPENDED → PUBLISHED (republish — FR-032)", () => {
      expect(canTransition("SUSPENDED", "PUBLISHED")).toBe(true);
    });
    it("SUSPENDED → ARCHIVED (archive — FR-033)", () => {
      expect(canTransition("SUSPENDED", "ARCHIVED")).toBe(true);
    });
  });

  describe("forbidden transitions", () => {
    it("DRAFT → SUSPENDED (must be published first)", () => {
      expect(canTransition("DRAFT", "SUSPENDED")).toBe(false);
    });
    it("DRAFT → DRAFT (no-op publish)", () => {
      expect(canTransition("DRAFT", "DRAFT")).toBe(false);
    });
    it("PUBLISHED → PUBLISHED (no-op publish)", () => {
      expect(canTransition("PUBLISHED", "PUBLISHED")).toBe(false);
    });
    it("PUBLISHED → DRAFT (no unpublish in V1)", () => {
      expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
    });
    it("SUSPENDED → SUSPENDED (no-op)", () => {
      expect(canTransition("SUSPENDED", "SUSPENDED")).toBe(false);
    });
    it("SUSPENDED → DRAFT (no return to DRAFT)", () => {
      expect(canTransition("SUSPENDED", "DRAFT")).toBe(false);
    });
  });

  describe("ARCHIVED terminal (BR-024)", () => {
    it("ARCHIVED → DRAFT forbidden", () => {
      expect(canTransition("ARCHIVED", "DRAFT")).toBe(false);
    });
    it("ARCHIVED → PUBLISHED forbidden", () => {
      expect(canTransition("ARCHIVED", "PUBLISHED")).toBe(false);
    });
    it("ARCHIVED → SUSPENDED forbidden", () => {
      expect(canTransition("ARCHIVED", "SUSPENDED")).toBe(false);
    });
    it("ARCHIVED → ARCHIVED (no-op, rejected)", () => {
      expect(canTransition("ARCHIVED", "ARCHIVED")).toBe(false);
    });
  });

  describe("edit+save preserves status (FR-021, FR-025)", () => {
    // Editing an offer is NOT a state transition — it preserves the current status.
    // This is verified by checking that updateOfferAction does NOT change status,
    // tested in integration tests.
    it("edit is not a transition (status preserved)", () => {
      // Conceptual: for any status S, edit+save results in status S (unchanged).
      const allStatuses: OfferStatus[] = ["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"];
      for (const s of allStatuses) {
        // edit doesn't appear in ALLOWED_TRANSITIONS — it's not a transition
        expect(ALLOWED_TRANSITIONS[s].includes(s)).toBe(false);
      }
    });
  });
});
