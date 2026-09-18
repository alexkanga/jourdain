import { redirect } from "next/navigation";
import Link from "next/link";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { can } from "@/lib/server/auth/capabilities";
import { listManagedUsers } from "@/lib/server/services/users";
import { DeleteUserButton } from "./DeleteUserButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Plus } from "lucide-react";

/**
 * Admin user-management list page — Server Component.
 *
 * UI-03: migrated to Methodist tokens. AdminPageHeader, responsive table
 * with overflow-x-auto, role badges via UserIdentityBadge, empty state.
 *
 * Server-side authority:
 *   - Admin layout guard validates authenticated session.
 *   - This page checks user:list capability — ADMIN redirected to /admin/offres.
 *   - Server Actions enforce requireCapability again.
 *
 * Lists only ADMIN and SUPER_ADMIN users (FANTOMAS excluded by
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

export default async function AdminUsersPage() {
  const principal = await getPrincipal();
  if (!principal || !can(principal, "user:list")) {
    redirect("/admin/offres");
  }

  const users = await listManagedUsers();

  return (
    <div>
      <AdminPageHeader
        title="Gestion des utilisateurs"
        description="Gérez les accès administratifs à JOURDAIN."
        action={
          <Link
            href="/admin/utilisateurs/nouvelles"
            className="btn-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvel utilisateur
          </Link>
        }
      />

      {users.length === 0 ? (
        <div className="card-surface p-8 text-center text-text-secondary">
          Aucun utilisateur administrable.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium">Nom d&apos;utilisateur</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/utilisateurs/${u.id}`}
                      className="font-medium text-brand-primary hover:text-brand-primary-hover"
                    >
                      {u.username}
                    </Link>
                    {u.id === principal.id && (
                      <span className="ml-2 rounded-sm bg-brand-surface px-1.5 py-0.5 text-xs font-medium text-brand-primary">
                        Vous
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    {/* Users table uses FR labels (Administrateur/Super administrateur)
                        while the sidebar uses uppercase (ADMIN/SUPER_ADMIN/FANTOMAS).
                        Both label sets are preserved for e2e compatibility. */}
                    <span className="text-sm font-medium text-text-primary">
                      {ROLE_LABELS[u.principalType] ?? u.principalType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/utilisateurs/${u.id}`}
                        className="btn-secondary !px-3 !py-1 !text-xs"
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
