/**
 * BrandLogo — JOURDAIN EMPLOI official logo slot.
 *
 * Per UI-01 spec: use the official Methodist church logo AS-IS.
 * Do NOT redraw, recolor, crop, or recreate it.
 *
 * OFFICIAL_LOGO_ASSET_REQUIRED:
 *   The official logo asset is NOT currently available in the repository
 *   or environment. Per OWNER instruction, we do NOT invent a replacement.
 *   This component renders a clearly-marked temporary placeholder slot
 *   that preserves the layout structure. When the official logo is
 *   provided, drop it at `public/branding/methodist-logo.png` and this
 *   component will automatically use it (the NEXT_PUBLIC_LOGO_READY env
 *   var or file-existence check can gate the swap — for now, the
 *   placeholder is always shown).
 *
 * Usage:
 *   <BrandLogo size="sm" />   — header/sidebar (32px height)
 *   <BrandLogo size="lg" />   — login page (48px height)
 *
 * The placeholder is a Methodist-green rounded square with a white "JE"
 * monogram (JOURDAIN EMPLOI initials). This is NOT a logo recreation —
 * it's a temporary geometric placeholder that will be replaced by the
 * official asset without any component code change.
 *
 * When the official logo is available:
 *   1. Place it at public/branding/methodist-logo.png
 *   2. Replace the placeholder block below with <Image src="/branding/methodist-logo.png" ... />
 *   3. Preserve aspect ratio via width/height props
 *   4. Ensure alt text is descriptive ("Logo officiel de l'Église Méthodiste de Côte d'Ivoire")
 */

const SIZES = {
  sm: { height: 32, width: 32 },
  md: { height: 40, width: 40 },
  lg: { height: 48, width: 48 },
} as const;

export function BrandLogo({
  size = "sm",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { height, width } = SIZES[size];

  // TEMPORARY PLACEHOLDER — OFFICIAL_LOGO_ASSET_REQUIRED.
  // This block will be replaced with <Image src="/branding/methodist-logo.png" />
  // when the official Methodist logo asset is available.
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md bg-brand-primary ${className ?? ""}`}
      style={{ height, width }}
      aria-label="Logo officiel de l'Église Méthodiste de Côte d'Ivoire — emplacement temporaire"
      role="img"
    >
      <span
        className="font-heading font-bold text-brand-primary-foreground"
        style={{ fontSize: height * 0.4 }}
      >
        JE
      </span>
    </div>
  );
}

/**
 * When the official logo is available, swap the placeholder above with:
 *
 * <Image
 *   src="/branding/methodist-logo.png"
 *   alt="Logo officiel de l'Église Méthodiste de Côte d'Ivoire"
 *   width={width}
 *   height={height}
 *   className={`shrink-0 object-contain ${className ?? ""}`}
 *   priority
 * />
 *
 * Preserve aspect ratio. For small header/sidebar contexts, ensure
 * readability — use the complete logo at a slightly larger size rather
 * than creating an unauthorized simplified mark.
 */
