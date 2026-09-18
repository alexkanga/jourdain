import type { PrincipalType } from "@/lib/server/auth/capabilities";

/**
 * UserIdentityBadge — visually consistent role badge for ADMIN / SUPER_ADMIN / FANTOMAS.
 *
 * Per UI-01 spec:
 *   - UI labels remain uppercase in header badges.
 *   - Do NOT rename underlying principal values.
 *   - Role badge colors per spec (not flashy):
 *     ADMIN:        neutral/blue-slate (slate-100 bg, slate-700 text)
 *     SUPER_ADMIN:  Methodist gold-compatible accent (amber-100 bg, amber-800 text)
 *     FANTOMAS:     distinctive dark/brand treatment (gray-800 bg, gray-50 text)
 *
 * Accessibility: role is conveyed by text content (not color alone).
 * The badge is always paired with the username in the shell — the badge
 * is the role indicator, the username is the identity.
 */

const BADGE_CLASSES: Record<PrincipalType, string> = {
  ADMIN: "role-badge-admin",
  SUPER_ADMIN: "role-badge-super-admin",
  FANTOMAS: "role-badge-fantomas",
};

const ROLE_LABELS: Record<PrincipalType, string> = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  FANTOMAS: "FANTOMAS",
};

export function UserIdentityBadge({
  principalType,
  className,
}: {
  principalType: PrincipalType;
  className?: string;
}) {
  const badgeClass = BADGE_CLASSES[principalType] ?? "role-badge-admin";
  const label = ROLE_LABELS[principalType] ?? principalType;
  return (
    <span className={`${badgeClass} ${className ?? ""}`}>
      {label}
    </span>
  );
}
