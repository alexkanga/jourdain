import Image from "next/image";

/**
 * BrandLogo — JOURDAIN EMPLOI official Methodist church logo.
 *
 * Per UI-01 spec: use the official logo AS-IS.
 * Do NOT redraw, recolor, crop essential content, recreate, simplify,
 * or generate a substitute.
 *
 * The official logo is at public/branding/methodist-logo.jpg (960x960,
 * square 1:1 aspect ratio, contains detailed artwork and text).
 *
 * Sizing strategy (per OWNER instruction):
 *   - The logo contains detailed artwork and text — do NOT force it into
 *     a tiny square. Use object-contain to preserve the full logo.
 *   - If the full logo becomes visually too small, increase the logo
 *     container slightly rather than modifying the logo.
 *   - Header/sidebar: height 40px (wider container via width=auto +
 *     object-contain so the square logo renders at 40x40 — readable
 *     without cropping).
 *   - Login page: height 64px (slightly larger as permitted).
 *
 * Mobile: the logo must remain visible without horizontal overflow.
 * The object-contain + shrink-0 + max-width constraints ensure it never
 * distorts or overflows.
 */

const SIZES = {
  sm: { height: 40, width: 40 },
  md: { height: 48, width: 48 },
  lg: { height: 64, width: 64 },
} as const;

export function BrandLogo({
  size = "sm",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { height, width } = SIZES[size];

  return (
    <Image
      src="/branding/methodist-logo.jpg"
      alt="Logo officiel de l'Église Méthodiste de Côte d'Ivoire"
      width={width}
      height={height}
      className={`shrink-0 object-contain ${className ?? ""}`}
      priority
      // Don't optimize — the logo is a small detailed asset that should
      // render crisply at small sizes. Next/Image optimization could
      // blur the text details at 40px.
      unoptimized
    />
  );
}
