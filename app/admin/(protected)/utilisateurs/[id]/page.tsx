import { redirect } from "next/navigation";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { can } from "@/lib/server/auth/capabilities";
import { getManagedUserById } from "@/lib/server/services/users";
import { UserForm } from "../UserForm";

/**
 * Admin edit-user page — Server Component.
 *
 * Server-side authority:
 *   - Admin layout guard already validated authentication.
 *   - This page checks user:update capability — ADMIN is redirected to
 *     /admin/offres. The Server Action enforces requireCapability again.
 *   - If the target user does not exist OR is a FANTOMAS user (excluded
 *     from management), redirect to the list — no information leak about
 *     whether the id existed.
 */
export default async function AdminEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const principal = await getPrincipal();
  if (!principal || !can(principal, "user:update")) {
    redirect("/admin/offres");
  }
  const { id } = await params;
  const user = await getManagedUserById(id);
  if (!user) {
    redirect("/admin/utilisateurs");
  }
  return <UserForm mode="edit" user={user} />;
}
