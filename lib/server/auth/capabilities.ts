// Capability type — all JOURDAIN EMPLOI business capabilities
export type Capability =
  // Offer lifecycle (ADMIN baseline)
  | "offer:create"
  | "offer:edit"
  | "offer:save"
  | "offer:publish"
  | "offer:suspend"
  | "offer:republish"
  | "offer:archive"
  // Offer restore — moved from ADMIN to SUPER_ADMIN (intentional business-rule change)
  | "offer:restore"
  // User management — SUPER_ADMIN and FANTOMAS only.
  // Note: user:password-reset was REMOVED from V1 per user-management final
  // correction #2 (Better Auth setUserPassword requires admin-session
  // semantics that don't map cleanly to our independent principal model;
  // direct hashPassword + account.password update violated the minimal-design
  // rule against inventing credential-hash manipulation. A future
  // password-reset mechanism may be designed separately if needed.)
  | "user:list"
  | "user:create"
  | "user:update"
  | "user:delete"
  // Login (any admin principal)
  | "admin:login"
  // Fantomas-only system capabilities
  | "system:bootstrap"
  | "system:recovery";

// Principal type — the JOURDAIN EMPLOI business principal field.
// Three-tier hierarchy per user-management work package:
//   ADMIN        → baseline offer-management capabilities (no restore, no user management)
//   SUPER_ADMIN   → inherits all ADMIN + offer:restore + user:* management
//   FANTOMAS      → inherits all SUPER_ADMIN + Fantomas-only system capabilities
export type PrincipalType = "ADMIN" | "SUPER_ADMIN" | "FANTOMAS";

// Principal — our business authorization identity (independent of Better Auth)
export type Principal = {
  id: string;
  username: string;
  principalType: PrincipalType;
};

// ─── Capability matrix per user-management work package ─────────────
//
// ADMIN_CAPABILITIES: baseline offer management. NOT user management.
// NOT offer:restore (moved to SUPER_ADMIN per business-rule change).
const ADMIN_CAPABILITIES: Capability[] = [
  "offer:create",
  "offer:edit",
  "offer:save",
  "offer:publish",
  "offer:suspend",
  "offer:republish",
  "offer:archive",
  "admin:login",
];

// SUPER_ADMIN_EXTRA_CAPABILITIES: capabilities granted to SUPER_ADMIN
// beyond the ADMIN baseline. SUPER_ADMIN inherits all ADMIN_CAPABILITIES
// plus these.
// NOTE: user:password-reset was REMOVED from V1 (per user-management final
// correction #2). A future password-reset mechanism may be designed
// separately if needed.
const SUPER_ADMIN_EXTRA_CAPABILITIES: Capability[] = [
  "offer:restore",
  "user:list",
  "user:create",
  "user:update",
  "user:delete",
];

// FANTOMAS_EXTRA_CAPABILITIES: capabilities granted to FANTOMAS beyond the
// SUPER_ADMIN baseline. FANTOMAS inherits all SUPER_ADMIN capabilities
// (which includes all ADMIN + SUPER_ADMIN_EXTRA) plus these system ones.
const FANTOMAS_EXTRA_CAPABILITIES: Capability[] = [
  "system:bootstrap",
  "system:recovery",
];

/**
 * can() — pure function reading principalType (NOT Better Auth role).
 *
 * Hierarchy (per user-management work package):
 *   ADMIN        → ADMIN_CAPABILITIES
 *   SUPER_ADMIN   → ADMIN_CAPABILITIES ∪ SUPER_ADMIN_EXTRA_CAPABILITIES
 *   FANTOMAS      → ADMIN_CAPABILITIES ∪ SUPER_ADMIN_EXTRA_CAPABILITIES ∪ FANTOMAS_EXTRA_CAPABILITIES
 *
 * Authorization is centralized here. Services and Server Actions enforce via
 * requireCapability() — never scatter role/principalType string checks across
 * the codebase.
 */
export function can(principal: Principal, capability: Capability): boolean {
  if (principal.principalType === "FANTOMAS") {
    return [
      ...ADMIN_CAPABILITIES,
      ...SUPER_ADMIN_EXTRA_CAPABILITIES,
      ...FANTOMAS_EXTRA_CAPABILITIES,
    ].includes(capability);
  }
  if (principal.principalType === "SUPER_ADMIN") {
    return [
      ...ADMIN_CAPABILITIES,
      ...SUPER_ADMIN_EXTRA_CAPABILITIES,
    ].includes(capability);
  }
  // ADMIN baseline (default branch — also covers any unexpected principalType
  // by granting only the ADMIN baseline, the safest non-privileged default).
  return ADMIN_CAPABILITIES.includes(capability);
}
