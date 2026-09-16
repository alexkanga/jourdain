"use client";

import { useTransition } from "react";
import { logoutAction } from "./logout-action";

/**
 * LogoutButton — admin logout. Client component that triggers logoutAction
 * Server Action via useTransition.
 */

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {pending ? "Déconnexion…" : "Déconnexion"}
      </button>
    </form>
  );
}
