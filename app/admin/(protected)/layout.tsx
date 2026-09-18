import { redirect } from "next/navigation";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Admin layout — server-side auth guard + Methodist admin shell (UI-01).
 *
 * This is the FIRST SERVER-SIDE AUTHORITY for /admin. It validates the
 * authenticated session via getPrincipal() (which calls Better Auth's
 * getSession — or returns the Fantomas break-glass Principal for a valid
 * Fantomas cookie). If null → redirect to /admin/login.
 *
 * Per WP-003 contract: middleware.ts is UX/redirect only. This layout
 * guard is the real server-side authentication check for the admin area.
 *
 * After authentication, only authorized JOURDAIN administrative principals
 * (ADMIN, SUPER_ADMIN, or FANTOMAS) may enter the protected admin area.
 *
 * UI-01 (Methodist Design System):
 *   - The shell is the AdminSidebar component (desktop sidebar + mobile
 *     drawer). Branding at top, navigation in middle, user identity +
 *     logout at bottom.
 *   - Navigation visibility follows existing capability logic:
 *     Offres visible to all; Utilisateurs visible only to SUPER_ADMIN
 *     and FANTOMAS (user:list capability). The AdminSidebar computes
 *     this from the principal server-side and passes to the client
 *     component — server-side route protection remains authoritative.
 *   - Role badges use the UserIdentityBadge component (ADMIN: slate,
 *     SUPER_ADMIN: gold/amber, FANTOMAS: dark).
 *
 * NO fake dashboard — navigation contains only real destinations:
 *   - Offres → /admin/offres (exists)
 *   - Utilisateurs → /admin/utilisateurs (exists, conditional on capability)
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await getPrincipal();
  if (!principal) {
    redirect("/admin/login");
  }

  return <AdminSidebar principal={principal}>{children}</AdminSidebar>;
}
