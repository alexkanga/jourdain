import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

/**
 * Public route group layout — wraps the public shell (header + footer)
 * around all pages under app/(public)/.
 *
 * Per UI-01 spec:
 *   - Public header: logo + brand identity + Offres/Administration nav.
 *   - Public footer: institutional identity + simple nav + copyright.
 *   - Warm neutral background (#FCFCF8 via bg-surface-warm).
 *   - White content surfaces per page.
 *   - No dead navigation routes — both / and /admin/login exist.
 *
 * This layout does NOT touch page content. UI-02 will handle public
 * page hierarchy (cards, detail layout, search bar). UI-01 only
 * establishes the shell.
 */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-warm">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
