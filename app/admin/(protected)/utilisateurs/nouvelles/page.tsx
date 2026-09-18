import { redirect } from "next/navigation";
import { getPrincipal } from "@/lib/server/auth/authorization";
import { can } from "@/lib/server/auth/capabilities";
import { UserForm } from "../UserForm";

/**
 * Admin create-user page — Server Component.
 *
 * Server-side authority:
 *   - Admin layout guard already validated authentication.
 *   - This page checks user:create capability — ADMIN is redirected to
 *     /admin/offres. The Server Action enforces requireCapability again.
 */
export default async function AdminCreateUserPage() {
  const principal = await getPrincipal();
  if (!principal || !can(principal, "user:create")) {
    redirect("/admin/offres");
  }
  return <UserForm mode="create" />;
}
