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
 * UI-03: migrated to Methodist button variants. Labels + behavior
 * unchanged. Archive confirmation remains native window.confirm.
 *
 * Actions depend on current status AND the caller's capabilities:
 * - DRAFT:     Publier (primary green), Archiver (secondary)
 * - PUBLISHED: Suspendre (warning amber), Archiver (secondary)
 * - SUSPENDED: Republier (primary green), Archiver (secondary)
 * - ARCHIVED:  Restaurer (gold) — only if canRestoreOffer (SUPER_ADMIN/FANTOMAS)
 *
 * Per user-management final correction: ADMIN does NOT see Restaurer.
 * Server-side restoreOfferAction enforces requireCapability("offer:restore").
 *
 * Client-side hiding is UX ONLY — does NOT authorize.
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

  const buttons: { label: string; action: (fd: FormData) => Promise<unknown>; className: string; confirm?: boolean }[] = [];
  if (status === "DRAFT") {
    buttons.push({
      label: "Publier",
      action: publishOfferAction,
      className: "btn-primary !px-3 !py-1 !text-xs",
    });
  }
  if (status === "PUBLISHED") {
    buttons.push({
      label: "Suspendre",
      action: suspendOfferAction,
      className: "btn-warning !px-3 !py-1 !text-xs",
    });
  }
  if (status === "SUSPENDED") {
    buttons.push({
      label: "Republier",
      action: republishOfferAction,
      className: "btn-primary !px-3 !py-1 !text-xs",
    });
  }
  if (status === "ARCHIVED" && canRestoreOffer) {
    buttons.push({
      label: "Restaurer",
      action: restoreOfferAction,
      className: "btn-gold !px-3 !py-1 !text-xs",
    });
  }
  if (status !== "ARCHIVED") {
    buttons.push({
      label: "Archiver",
      action: archiveOfferAction,
      className: "btn-secondary !px-3 !py-1 !text-xs",
      confirm: true,
    });
  }

  if (buttons.length === 0) {
    // ARCHIVED + ADMIN (no restore capability) → no buttons.
    return (
      <span className="text-xs text-text-secondary/60">Aucune action (archivée)</span>
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
            className={`${b.className} disabled:opacity-50`}
          >
            {pending ? "…" : b.label}
          </button>
        </form>
      ))}
    </div>
  );
}
