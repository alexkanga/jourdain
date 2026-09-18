import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout — JOURDAIN EMPLOI (Methodist Design System, UI-01).
 *
 * The root layout sets the html lang + body base classes. Public and
 * admin route groups each have their own layout that wraps the shell
 * (header/footer for public, sidebar for admin).
 *
 * Per UI-01 spec:
 *   - Body background: warm neutral (#FCFCF8) via bg-surface-warm token.
 *   - Text: text-text-primary (#111827).
 *   - antialiased for smoother rendering.
 *
 * No external font loading — system font stack is configured in
 * tailwind.config.ts (fontFamily.sans / fontFamily.heading). The visual
 * direction is Manrope/Montserrat (headings) + Inter (body), but we use
 * a robust system stack to avoid fragile external font-fetching during
 * local builds.
 */

export const metadata: Metadata = {
  title: {
    default: "JOURDAIN EMPLOI",
    template: "%s — JOURDAIN EMPLOI",
  },
  description:
    "Portail de publication et de consultation d'offres d'emploi — Église Méthodiste de Côte d'Ivoire",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-surface-warm text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
