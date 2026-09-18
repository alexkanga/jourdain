import { describe, it, expect } from "vitest";

/**
 * Unit tests — offer lifecycle state machine (BR-020, BR-024 V1.1, FR-030–FR-033).
 *
 * These tests define the canonical allowed + forbidden transitions.
 * The implementation in lib/server/services/offers.ts enforces the same
 * rules server-side; integration tests verify the actual DB mutations.
 *
 * ARCHIVED is a SOFT lifecycle state (BR-024 V1.1):
 *   - ARCHIVED + published_at IS NULL     → DRAFT     (Restaurer, never-published)
 *   - ARCHIVED + published_at IS NOT NULL  → SUSPENDED (Restaurer, previously-published)
 * The target of a Restore depends on published_at — see restoreTarget() below.
 * published_at is PRESERVED across all transitions (BR-022, BR-023, BR-024).
 */

type OfferStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";

/**
 * Allowed transitions for the "active" side of the lifecycle
 * (DRAFT/PUBLISHED/SUSPENDED). ARCHIVED transitions are determined by
 * restoreTarget() based on published_at.
 */
const ALLOWED_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [], // handled separately by restoreTarget() — see below
};

function canTransition(from: OfferStatus, to: OfferStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Soft-restore rule (BR-024 V1.1):
 *   ARCHIVED + published_at IS NULL     → DRAFT
 *   ARCHIVED + published_at IS NOT NULL  → SUSPENDED  (NO auto-republish)
 */
function restoreTarget(
  publishedAt: Date | null,
): "DRAFT" | "SUSPENDED" {
  return publishedAt === null ? "DRAFT" : "SUSPENDED";
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

  describe("ARCHIVED soft-restore (BR-024 V1.1)", () => {
    it("ARCHIVED never-published → DRAFT (Restaurer)", () => {
      expect(restoreTarget(null)).toBe("DRAFT");
    });
    it("ARCHIVED previously-published → SUSPENDED (Restaurer — NO auto-republish)", () => {
      expect(restoreTarget(new Date("2026-09-18T00:00:00Z"))).toBe("SUSPENDED");
    });
    it("ARCHIVED → PUBLISHED forbidden (no auto-republish)", () => {
      // Restaurer MUST NOT make a previously-published offer public automatically.
      expect(restoreTarget(new Date("2026-09-18T00:00:00Z"))).not.toBe("PUBLISHED");
    });
    it("ARCHIVED previously-published restored to SUSPENDED then PUBLISHED via Republier", () => {
      // After Restore → SUSPENDED, the admin may explicitly Republier → PUBLISHED.
      const restored = restoreTarget(new Date("2026-09-18T00:00:00Z"));
      expect(canTransition(restored, "PUBLISHED")).toBe(true);
    });
    it("ARCHIVED never-published restored to DRAFT then PUBLISHED via Publier", () => {
      // After Restore → DRAFT, the admin may explicitly Publier → PUBLISHED.
      const restored = restoreTarget(null);
      expect(canTransition(restored, "PUBLISHED")).toBe(true);
    });
    it("ARCHIVED → ARCHIVED (no-op, rejected)", () => {
      // Restore on a non-archived offer is rejected server-side.
      // There is no "ARCHIVED → ARCHIVED" transition; restore always moves out.
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
