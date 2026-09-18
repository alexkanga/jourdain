import { redirect } from "next/navigation";
import Link from "next/link";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { can } from "@/lib/server/auth/capabilities";
import { LogoutButton } from "@/components/admin/LogoutButton";

/**
 * Admin layout — server-side auth guard.
 *
 * This is the FIRST SERVER-SIDE AUTHORITY for /admin. It validates the
 * authenticated session via getPrincipal() (which calls Better Auth's
 * getSession — or returns the Fantomas break-glass Principal for a valid
 * Fantomas cookie). If null → redirect to /admin/login.
 *
 * Per WP-003 contract: middleware.ts is UX/redirect only. This layout
 * guard is the real server-side authentication check for the admin area.
 * An unauthenticated request that bypasses middleware is still rejected
 * here (no admin content rendered).
 *
 * After authentication, only authorized JOURDAIN administrative principals
 * (ADMIN, SUPER_ADMIN, or FANTOMAS) may enter the protected admin area.
 * getPrincipal() returns the principal with principalType (NOT Better Auth
 * role); the can()/requireCapability() checks in each Server Action enforce
 * capability-level authorization per principalType.
 *
 * Navigation visibility (per user-management work package):
 *   - "Offres" link: visible to all admin principals (ADMIN, SUPER_ADMIN, FANTOMAS).
 *   - "Utilisateurs" link: visible only to SUPER_ADMIN and FANTOMAS
 *     (those with user:list capability). ADMIN does NOT see this link.
 *   - The /admin/utilisateurs page also enforces this server-side via its
 *     own capability check (redirect to /admin/offres if not authorized).
 */

const PRINCIPAL_TYPE_LABELS: Record<string, string> = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  FANTOMAS: "FANTOMAS",
};

const PRINCIPAL_TYPE_BADGE_CLASSES: Record<string, string> = {
  ADMIN: "bg-gray-100 text-gray-800",
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  FANTOMAS: "bg-red-100 text-red-800",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await getPrincipal();
  if (!principal) {
    redirect("/admin/login");
  }

  const canManageUsers = can(principal, "user:list");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/offres"
              className="text-lg font-bold text-gray-900"
            >
              JOURDAIN EMPLOI — Administration
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/admin/offres"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Offres
              </Link>
              {canManageUsers && (
                <Link
                  href="/admin/utilisateurs"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Utilisateurs
                </Link>
              )}
            </nav>
            <span className="ml-2 rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
              {principal.username}
              <span
                className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${PRINCIPAL_TYPE_BADGE_CLASSES[principal.principalType] ?? "bg-gray-100 text-gray-800"}`}
              >
                {PRINCIPAL_TYPE_LABELS[principal.principalType] ?? principal.principalType}
              </span>
            </span>
          </div>
          <LogoutButton logoutMode={principal.principalType} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
