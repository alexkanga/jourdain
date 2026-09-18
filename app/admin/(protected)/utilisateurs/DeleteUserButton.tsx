"use client";

import { useTransition } from "react";
import { deleteUserAction } from "./actions";

/**
 * DeleteUserButton — client-side button that invokes deleteUserAction.
 *
 * UI-03: migrated to Methodist tokens (btn-danger variant).
 * Behavior unchanged — native window.confirm, Server Action.
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
 *
 * E2e selectors preserved: getByRole("button", { name: /supprimer/i }).
 * The native window.confirm dialog is preserved for Playwright's dialog handler.
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
        className="cursor-not-allowed rounded-sm border border-border px-3 py-1 text-xs font-medium text-text-secondary/40"
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
        alert(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(handleDelete)}
      className="btn-danger !px-3 !py-1 !text-xs"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
