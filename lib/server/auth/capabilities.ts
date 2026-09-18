// Capability type — all JOURDAIN EMPLOI business capabilities
export type Capability =
  | "offer:create"
  | "offer:edit"
  | "offer:save"
  | "offer:publish"
  | "offer:suspend"
  | "offer:republish"
  | "offer:archive"
  | "offer:restore"
  | "admin:login"
  | "system:bootstrap"
  | "system:recovery";

// Principal type — the JOURDAIN EMPLOI business principal field
export type PrincipalType = "ADMIN" | "FANTOMAS";

// Principal — our business authorization identity (independent of Better Auth)
export type Principal = {
  id: string;
  username: string;
  principalType: PrincipalType;
};

// Capability matrix per AISE §14/§21
const ADMIN_CAPABILITIES: Capability[] = [
  "offer:create",
  "offer:edit",
  "offer:save",
  "offer:publish",
  "offer:suspend",
  "offer:republish",
  "offer:archive",
  "offer:restore",
  "admin:login",
];

const FANTOMAS_EXTRA_CAPABILITIES: Capability[] = [
  "system:bootstrap",
  "system:recovery",
];

// can() — pure function reading principalType (NOT Better Auth role)
// Per ADR-0004: Fantomas inherits ALL ADMIN capabilities + Fantomas-only
// ADMIN does NOT inherit Fantomas-only capabilities
export function can(principal: Principal, capability: Capability): boolean {
  if (principal.principalType === "FANTOMAS") {
    return [...ADMIN_CAPABILITIES, ...FANTOMAS_EXTRA_CAPABILITIES].includes(capability);
  }
  return ADMIN_CAPABILITIES.includes(capability);
}
