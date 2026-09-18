import { redirect } from "next/navigation";
import Link from "next/link";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { LogoutButton } from "@/components/admin/LogoutButton";

/**
 * Admin layout — server-side auth guard.
 *
 * This is the FIRST SERVER-SIDE AUTHORITY for /admin. It validates the
 * authenticated session via getPrincipal() (which calls Better Auth's
 * getSession). If null → redirect to /admin/login.
 *
 * Per WP-003 contract: middleware.ts is UX/redirect only. This layout
 * guard is the real server-side authentication check for the admin area.
 * An unauthenticated request that bypasses middleware is still rejected
 * here (no admin content rendered).
 *
 * After authentication, only authorized JOURDAIN administrative principals
 * (ADMIN or FANTOMAS) may enter the protected admin area. getPrincipal()
 * returns the principal with principalType (NOT Better Auth role); the
 * can()/requireCapability() checks in each Server Action enforce
 * capability-level authorization per principalType.
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
            <span className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
              {principal.username}
              <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {principal.principalType}
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
