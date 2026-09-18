"use client";

import { useTransition } from "react";
import {
  publishOfferAction,
  suspendOfferAction,
  republishOfferAction,
  archiveOfferAction,
  restoreOfferAction,
} from "./lifecycle-actions";
import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * LifecycleButtons — admin action buttons for an offer row in the list.
 *
 * Actions depend on current status AND the caller's capabilities:
 * - DRAFT:     Publier, Archiver
 * - PUBLISHED: Suspendre, Archiver
 * - SUSPENDED: Republier, Archiver
 * - ARCHIVED:  Restaurer (only if canRestoreOffer — SUPER_ADMIN/FANTOMAS)
 *
 * Per user-management work package, offer:restore moved from ADMIN to
 * SUPER_ADMIN. The `canRestoreOffer` prop is computed server-side from the
 * current principal's capabilities (can(principal, "offer:restore")) and
 * passed down. ADMIN sees no Restaurer button; SUPER_ADMIN and FANTOMAS do.
 *
 * Archive requires an explicit confirmation dialog (window.confirm) to
 * prevent accidental archiving.
 *
 * Client-side hiding is UX ONLY — does NOT authorize. Server-side
 * requireCapability("offer:restore") + lifecycle state validation are
 * the authority. An ADMIN who somehow invokes restoreOfferAction directly
 * (e.g., via devtools) will be denied by requireCapability.
 */

const ARCHIVE_CONFIRM_MESSAGE =
  "Archiver cette offre ? Elle sera retirée du portail public. Vous pourrez la restaurer ultérieurement.";

export function LifecycleButtons({
  id,
  status,
  canRestoreOffer,
}: {
  id: string;
  status: OfferStatus;
  /**
   * Server-rendered hint: does the current principal have offer:restore
   * capability? Computed from can(principal, "offer:restore") in the list
   * page and passed down. UX only — server-side requireCapability is the
   * actual authority.
   */
  canRestoreOffer?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const buttons: { label: string; action: (fd: FormData) => Promise<unknown>; variant: string; confirm?: boolean }[] = [];
  if (status === "DRAFT") {
    buttons.push({ label: "Publier", action: publishOfferAction, variant: "bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm" });
  }
  if (status === "PUBLISHED") {
    buttons.push({ label: "Suspendre", action: suspendOfferAction, variant: "bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm" });
  }
  if (status === "SUSPENDED") {
    buttons.push({ label: "Republier", action: republishOfferAction, variant: "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm" });
  }
  if (status === "ARCHIVED" && canRestoreOffer) {
    // Restaurer is only shown to principals with offer:restore capability
    // (SUPER_ADMIN and FANTOMAS). ADMIN sees no Restaurer button.
    buttons.push({
      label: "Restaurer",
      action: restoreOfferAction,
      variant: "border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold shadow-sm",
    });
  }
  if (status !== "ARCHIVED") {
    buttons.push({
      label: "Archiver",
      action: archiveOfferAction,
      variant: "border border-gray-300 text-gray-700 hover:bg-gray-50",
      confirm: true,
    });
  }

  if (buttons.length === 0) {
    // ARCHIVED + ADMIN (no restore capability) → no buttons.
    return (
      <span className="text-xs text-gray-400">Aucune action (archivée)</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((b) => (
        <form
          key={b.label}
          action={() => {
            startTransition(async () => {
              if (b.confirm && typeof window !== "undefined") {
                const ok = window.confirm(ARCHIVE_CONFIRM_MESSAGE);
                if (!ok) return;
              }
              const fd = new FormData();
              fd.set("id", id);
              await b.action(fd);
            });
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className={`rounded-md px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 ${b.variant}`}
          >
            {pending ? "…" : b.label}
          </button>
        </form>
      ))}
    </div>
  );
}
