import { describe, it, expect } from "vitest";
import { can, type Principal, type Capability } from "../lib/server/auth/capabilities";

/**
 * can() — business authorization capability matrix.
 *
 * Per user-management work package, the hierarchy is:
 *   ADMIN        → baseline offer management (no offer:restore, no user:*)
 *   SUPER_ADMIN   → inherits all ADMIN + offer:restore + user:* management
 *   FANTOMAS      → inherits all SUPER_ADMIN + system:bootstrap, system:recovery
 *
 * ADMIN does NOT have:
 *   - offer:restore (moved to SUPER_ADMIN)
 *   - user:list, user:create, user:update, user:delete, user:password-reset
 *   - system:bootstrap, system:recovery
 *
 * SUPER_ADMIN does NOT have:
 *   - system:bootstrap, system:recovery (Fantomas-only)
 *
 * FANTOMAS has ALL capabilities.
 */

describe("can() — business authorization capability matrix", () => {
  const admin: Principal = {
    id: "test-admin-id",
    username: "admin1",
    principalType: "ADMIN",
  };

  const superAdmin: Principal = {
    id: "test-super-admin-id",
    username: "superadmin1",
    principalType: "SUPER_ADMIN",
  };

  const fantomas: Principal = {
    id: "test-fantomas-id",
    username: "Fantomas",
    principalType: "FANTOMAS",
  };

  // ─── ADMIN baseline capabilities ──────────────────────────────────

  it("allows ADMIN to use a standard ADMIN capability (offer:create)", () => {
    expect(can(admin, "offer:create")).toBe(true);
  });

  it("allows ADMIN to use all standard ADMIN offer-management capabilities", () => {
    const adminCaps: Capability[] = [
      "offer:create", "offer:edit", "offer:save",
      "offer:publish", "offer:suspend", "offer:republish",
      "offer:archive",
      "admin:login",
    ];
    for (const cap of adminCaps) {
      expect(can(admin, cap)).toBe(true);
    }
  });

  // ─── ADMIN loses offer:restore (moved to SUPER_ADMIN) ──────────────

  it("DENIES ADMIN offer:restore (moved to SUPER_ADMIN per user-management work package)", () => {
    expect(can(admin, "offer:restore")).toBe(false);
  });

  // ─── ADMIN has no user-management capabilities ─────────────────────

  it("DENIES ADMIN all user:* capabilities", () => {
    const userCaps: Capability[] = [
      "user:list", "user:create", "user:update", "user:delete",
      "user:password-reset",
    ];
    for (const cap of userCaps) {
      expect(can(admin, cap)).toBe(false);
    }
  });

  // ─── ADMIN has no Fantomas-only capabilities ───────────────────────

  it("denies ADMIN from using a Fantomas-only capability (system:bootstrap)", () => {
    expect(can(admin, "system:bootstrap")).toBe(false);
  });

  it("denies ADMIN from using all Fantomas-only capabilities", () => {
    const fantomasOnly: Capability[] = ["system:bootstrap", "system:recovery"];
    for (const cap of fantomasOnly) {
      expect(can(admin, cap)).toBe(false);
    }
  });

  // ─── SUPER_ADMIN inherits all ADMIN capabilities ──────────────────

  it("allows SUPER_ADMIN to use all ADMIN capabilities", () => {
    const adminCaps: Capability[] = [
      "offer:create", "offer:edit", "offer:save",
      "offer:publish", "offer:suspend", "offer:republish",
      "offer:archive",
      "admin:login",
    ];
    for (const cap of adminCaps) {
      expect(can(superAdmin, cap)).toBe(true);
    }
  });

  // ─── SUPER_ADMIN has offer:restore + user:* ───────────────────────

  it("allows SUPER_ADMIN offer:restore", () => {
    expect(can(superAdmin, "offer:restore")).toBe(true);
  });

  it("allows SUPER_ADMIN all user:* capabilities", () => {
    const userCaps: Capability[] = [
      "user:list", "user:create", "user:update", "user:delete",
      "user:password-reset",
    ];
    for (const cap of userCaps) {
      expect(can(superAdmin, cap)).toBe(true);
    }
  });

  // ─── SUPER_ADMIN lacks Fantomas-only capabilities ─────────────────

  it("denies SUPER_ADMIN from using Fantomas-only capabilities", () => {
    expect(can(superAdmin, "system:bootstrap")).toBe(false);
    expect(can(superAdmin, "system:recovery")).toBe(false);
  });

  // ─── FANTOMAS inherits ALL SUPER_ADMIN + Fantomas-only ────────────

  it("allows FANTOMAS to use all ADMIN capabilities", () => {
    const adminCaps: Capability[] = [
      "offer:create", "offer:edit", "offer:save",
      "offer:publish", "offer:suspend", "offer:republish",
      "offer:archive",
      "admin:login",
    ];
    for (const cap of adminCaps) {
      expect(can(fantomas, cap)).toBe(true);
    }
  });

  it("allows FANTOMAS offer:restore", () => {
    expect(can(fantomas, "offer:restore")).toBe(true);
  });

  it("allows FANTOMAS all user:* capabilities", () => {
    const userCaps: Capability[] = [
      "user:list", "user:create", "user:update", "user:delete",
      "user:password-reset",
    ];
    for (const cap of userCaps) {
      expect(can(fantomas, cap)).toBe(true);
    }
  });

  it("allows FANTOMAS to use all Fantomas-only capabilities", () => {
    const fantomasOnly: Capability[] = ["system:bootstrap", "system:recovery"];
    for (const cap of fantomasOnly) {
      expect(can(fantomas, cap)).toBe(true);
    }
  });
});
