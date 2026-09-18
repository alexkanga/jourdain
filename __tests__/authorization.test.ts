import { describe, it, expect } from "vitest";
import { can, type Principal, type Capability } from "../lib/server/auth/capabilities";

describe("can() — business authorization capability matrix", () => {
  const admin: Principal = {
    id: "test-admin-id",
    username: "admin1",
    principalType: "ADMIN",
  };

  const fantomas: Principal = {
    id: "test-fantomas-id",
    username: "Fantomas",
    principalType: "FANTOMAS",
  };

  // ADMIN standard capability: ADMIN → ALLOW
  it("allows ADMIN to use a standard ADMIN capability (offer:create)", () => {
    expect(can(admin, "offer:create")).toBe(true);
  });

  // ADMIN standard capability: FANTOMAS → ALLOW (inherits ADMIN capabilities)
  it("allows FANTOMAS to use a standard ADMIN capability (offer:create)", () => {
    expect(can(fantomas, "offer:create")).toBe(true);
  });

  // ADMIN standard capability: FANTOMAS → ALLOW (all ADMIN capabilities inherited)
  it("allows FANTOMAS to use all ADMIN capabilities", () => {
    const adminCapabilities: Capability[] = [
      "offer:create", "offer:edit", "offer:save",
      "offer:publish", "offer:suspend", "offer:republish",
      "offer:archive", "offer:restore",
      "admin:login",
    ];
    for (const cap of adminCapabilities) {
      expect(can(fantomas, cap)).toBe(true);
    }
  });

  // Fantomas-only capability: ADMIN → DENY
  it("denies ADMIN from using a Fantomas-only capability (system:bootstrap)", () => {
    expect(can(admin, "system:bootstrap")).toBe(false);
  });

  // Fantomas-only capability: FANTOMAS → ALLOW
  it("allows FANTOMAS to use a Fantomas-only capability (system:bootstrap)", () => {
    expect(can(fantomas, "system:bootstrap")).toBe(true);
  });

  // Fantomas-only capability: ADMIN → DENY (all Fantomas-only)
  it("denies ADMIN from using all Fantomas-only capabilities", () => {
    const fantomasOnly: Capability[] = ["system:bootstrap", "system:recovery"];
    for (const cap of fantomasOnly) {
      expect(can(admin, cap)).toBe(false);
    }
  });

  // Fantomas-only capability: FANTOMAS → ALLOW (all)
  it("allows FANTOMAS to use all Fantomas-only capabilities", () => {
    const fantomasOnly: Capability[] = ["system:bootstrap", "system:recovery"];
    for (const cap of fantomasOnly) {
      expect(can(fantomas, cap)).toBe(true);
    }
  });
});
