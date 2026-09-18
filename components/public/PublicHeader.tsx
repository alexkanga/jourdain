import Link from "next/link";
import { Briefcase, Lock } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

/**
 * PublicHeader — global public shell header.
 *
 * Per UI-01 spec:
 *   - Clean white/light surface with subtle border/shadow.
 *   - Logo + "JOURDAIN EMPLOI" identity + institutional text.
 *   - Navigation: "Offres d'emploi" + "Administration".
 *   - No dead links — both routes exist (/ and /admin/login).
 *   - Responsive, keyboard accessible, good mobile tap targets.
 *   - Sticky only if it improves UX without complexity — sticky here
 *     keeps the nav accessible while scrolling, with a subtle shadow.
 *
 * Mobile: with only two actions, a compact responsive header is preferred
 * over a hamburger system. Both links remain visible at 375px width.
 */

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface shadow-header">
      <div className="mx-auto flex max-w-public-content items-center justify-between gap-2 px-4 py-3 sm:px-6">
        {/* Brand identity */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          aria-label="JOURDAIN EMPLOI — Accueil"
        >
          <BrandLogo size="sm" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-heading text-base font-bold text-text-primary">
              JOURDAIN EMPLOI
            </span>
            <span className="hidden text-xs text-text-secondary sm:block">
              Église Méthodiste de Côte d&apos;Ivoire
            </span>
          </div>
        </Link>

        {/* Navigation — two actions, visible at all breakpoints */}
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Navigation principale">
          <Link
            href="/"
            className="nav-link flex items-center gap-1.5"
            aria-label="Offres d'emploi"
          >
            <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Offres d&apos;emploi</span>
            <span className="sm:hidden">Offres</span>
          </Link>
          <Link
            href="/admin/login"
            className="nav-link flex items-center gap-1.5"
            aria-label="Administration"
          >
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Administration</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
