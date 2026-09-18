import { redirect } from "next/navigation";
import Link from "next/link";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { can } from "@/lib/server/auth/capabilities";
import { listManagedUsers } from "@/lib/server/services/users";
import { DeleteUserButton } from "./DeleteUserButton";

/**
 * Admin user-management list page — Server Component.
 *
 * Server-side authority:
 *   - The admin layout guard (app/admin/(protected)/layout.tsx) already
 *     validates authenticated session via getPrincipal() before this page
 *     renders. An unauthenticated request is redirected to /admin/login.
 *   - This page additionally checks user:list capability — if the current
 *     principal is ADMIN (no user:list capability), redirect to /admin/offres.
 *     This protects the route even if middleware passes (e.g., a user with
 *     a valid Better Auth session cookie but no user:list capability).
 *   - The Server Actions in actions.ts enforce requireCapability again —
 *     this page-level check is a UX redirect, NOT a security authority.
 *
 * Lists only ADMIN and SUPER_ADMIN users (FANTOMAS is excluded by
 * listManagedUsers). Sorted by createdAt ASC.
 */

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super administrateur",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  ADMIN: "bg-gray-100 text-gray-800",
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
};

export default async function AdminUsersPage() {
  const principal = await getPrincipal();
  if (!principal || !can(principal, "user:list")) {
    // Non-SUPER_ADMIN/FANTOMAS user → redirect to admin home.
    // The admin layout guard already validated authentication; this is the
    // capability check.
    redirect("/admin/offres");
  }

  const users = await listManagedUsers();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <Link
          href="/admin/utilisateurs/nouvelles"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Nouvel utilisateur
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-8 text-center text-gray-500">
          Aucun utilisateur géré
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nom d&apos;utilisateur</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/utilisateurs/${u.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {u.username}
                    </Link>
                    {u.id === principal.id && (
                      <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Vous
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASSES[u.principalType] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {ROLE_LABELS[u.principalType] ?? u.principalType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/utilisateurs/${u.id}`}
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Modifier
                      </Link>
                      <DeleteUserButton userId={u.id} username={u.username} self={u.id === principal.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
