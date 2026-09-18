"use client";

import { useTransition } from "react";
import { deleteUserAction } from "./actions";

/**
 * DeleteUserButton — client-side button that invokes deleteUserAction.
 *
 * Shows a window.confirm() with the target username before deletion.
 *
 * Self-delete is blocked at the service layer (caller.id === id → reject)
 * even if the button were somehow shown. We hide the button entirely when
 * `self` is true to make the UX consistent.
 *
 * Per user-management work package:
 *   - The button is only rendered for SUPER_ADMIN/FANTOMAS principals (the
 *     page that renders this button already gated by user:list capability).
 *   - The Server Action enforces requireCapability("user:delete") again
 *     server-side — client-side hiding is UX only.
 */

export function DeleteUserButton({
  userId,
  username,
  self,
}: {
  userId: string;
  username: string;
  self: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (self) {
    // Don't render a delete button for the caller's own account — service
    // layer would reject anyway, but UX should reflect this.
    return (
      <span
        className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-400"
        title="Vous ne pouvez pas supprimer votre propre compte"
      >
        Supprimer
      </span>
    );
  }

  function handleDelete() {
    const ok = window.confirm(
      `Supprimer l'utilisateur « ${username} » ? Cette action est irréversible.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", userId);
      const result = await deleteUserAction(fd);
      if (!result.ok) {
        // The page will re-render after revalidatePath; surface the error
        // via alert for the user (simple — no toast framework in V1).
        alert(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(handleDelete)}
      className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
