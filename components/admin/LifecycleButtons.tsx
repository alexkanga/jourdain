"use client";

import { useTransition } from "react";
import {
  publishOfferAction,
  suspendOfferAction,
  republishOfferAction,
  archiveOfferAction,
} from "./lifecycle-actions";
import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * LifecycleButtons — admin action buttons for an offer row in the list.
 *
 * Actions depend on current status:
 * - DRAFT: Publish, Archive
 * - PUBLISHED: Suspend, Archive
 * - SUSPENDED: Republish, Archive
 * - ARCHIVED: (no actions — terminal; read-only View)
 *
 * Client-side hiding is UX ONLY — does NOT authorize. Server-side
 * requireCapability() + lifecycle state validation are the authority.
 */

export function LifecycleButtons({
  id,
  status,
}: {
  id: string;
  status: OfferStatus;
}) {
  const [pending, startTransition] = useTransition();

  const buttons: { label: string; action: (fd: FormData) => Promise<unknown>; variant: string }[] = [];
  if (status === "DRAFT") {
    buttons.push({ label: "Publier", action: publishOfferAction, variant: "bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm" });
  }
  if (status === "PUBLISHED") {
    buttons.push({ label: "Suspendre", action: suspendOfferAction, variant: "bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm" });
  }
  if (status === "SUSPENDED") {
    buttons.push({ label: "Republier", action: republishOfferAction, variant: "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm" });
  }
  if (status !== "ARCHIVED") {
    buttons.push({ label: "Archiver", action: archiveOfferAction, variant: "border border-gray-300 text-gray-700 hover:bg-gray-50" });
  }

  if (buttons.length === 0) {
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
