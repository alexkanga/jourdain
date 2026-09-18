/**
 * PublicHero — Methodist employment hero section.
 *
 * Per UI-02 spec: elegant, bright, welcoming, institutional, restrained.
 * Methodist green/gold accents. NOT visually overloaded.
 *
 * Visual treatment: CSS/Tailwind only — light Methodist-green gradient
 * surface with a subtle gold accent ring. No giant cross, no Bible
 * illustration, no stock photos, no parallax, no particles.
 *
 * The official logo is already in the header (UI-01) — the hero does
 * NOT repeat it. The hero provides the institutional context and
 * welcoming copy.
 *
 * Server Component — no client JS, no animation library.
 */

export function PublicHero() {
  return (
    <section
      className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-surface via-surface-warm to-surface"
      aria-label="Présentation de JOURDAIN EMPLOI"
    >
      {/* Subtle gold accent ring — decorative, CSS-only */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-gold-accent/10 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-brand-secondary/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-public-content px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
            JOURDAIN EMPLOI
          </p>

          {/* Main heading */}
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
            Des opportunités professionnelles au service des talents
          </h1>

          {/* Supporting text */}
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            Découvrez les offres d&apos;emploi publiées par l&apos;Église
            Méthodiste de Côte d&apos;Ivoire et ses partenaires.
          </p>
        </div>
      </div>
    </section>
  );
}
