import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

/**
 * PublicFooter — institutional footer.
 *
 * Per UI-01 spec:
 *   - JOURDAIN EMPLOI + Église Méthodiste de Côte d'Ivoire.
 *   - Simple navigation: Offres + Administration.
 *   - Copyright year is dynamic.
 *   - No social links, no fabricated addresses/emails/phones.
 *
 * Mobile: stacks vertically at small breakpoints.
 */

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto max-w-public-content px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand block */}
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-bold text-text-primary">
                JOURDAIN EMPLOI
              </span>
              <span className="text-xs text-text-secondary">
                Église Méthodiste de Côte d&apos;Ivoire
              </span>
            </div>
          </div>

          {/* Simple navigation */}
          <nav
            className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-4"
            aria-label="Navigation pied de page"
          >
            <Link
              href="/"
              className="text-text-secondary transition-colors duration-fast hover:text-brand-primary"
            >
              Offres
            </Link>
            <Link
              href="/admin/login"
              className="text-text-secondary transition-colors duration-fast hover:text-brand-primary"
            >
              Administration
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs text-text-secondary">
            © {year} JOURDAIN EMPLOI — Église Méthodiste de Côte d&apos;Ivoire. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
