/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Methodist Design System — Semantic Color Tokens ───────────
      // Per UI-01 Methodist design system specification.
      // These are the canonical brand colors; components reference
      // semantic Tailwind utility classes (e.g. bg-brand-primary,
      // text-text-secondary) rather than hardcoding hex values.
      colors: {
        // Brand palette
        brand: {
          // Methodist Green / Primary — #2F7D32
          primary: {
            DEFAULT: "#2F7D32",
            hover: "#256928", // darker shade for hover
            foreground: "#FFFFFF",
          },
          // Green Accent — #78B942
          secondary: {
            DEFAULT: "#78B942",
            hover: "#5E9A33",
            foreground: "#1A2B0E",
          },
          // Green Surface — #F1F8EC
          surface: "#F1F8EC",
          // Methodist Gold — #D99100
          gold: {
            DEFAULT: "#D99100",
            hover: "#B37700",
            foreground: "#1A1300",
          },
          // Gold Accent — #F4B426
          "gold-accent": {
            DEFAULT: "#F4B426",
            hover: "#D9981A",
            foreground: "#1A1300",
          },
        },
        // Neutral surfaces
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F8EC", // green-tinted muted surface
          warm: "#FCFCF8", // warm neutral background
        },
        // Text
        text: {
          primary: "#111827",
          secondary: "#5F6875",
        },
        // Borders — subtle neutral
        border: {
          DEFAULT: "#E5E7EB",
          strong: "#D1D5DB",
        },
        // Status colors (accessible, restrained)
        danger: {
          DEFAULT: "#B91C1C", // restrained red
          foreground: "#FFFFFF",
          surface: "#FEF2F2",
        },
        success: {
          DEFAULT: "#2F7D32", // derived from Methodist green
          foreground: "#FFFFFF",
          surface: "#F1F8EC",
        },
        warning: {
          DEFAULT: "#D99100", // Methodist gold
          foreground: "#1A1300",
          surface: "#FFFBEB",
        },
        // Role badge colors (per UI-01 spec)
        role: {
          admin: {
            bg: "#F1F5F9", // slate-100
            text: "#334155", // slate-700
          },
          "super-admin": {
            bg: "#FEF3C7", // amber-100 (gold-compatible)
            text: "#92400E", // amber-800
          },
          fantomas: {
            bg: "#1F2937", // gray-800 (distinctive dark)
            text: "#F9FAFB", // gray-50
          },
        },
      },
      // ─── Typography ────────────────────────────────────────────────
      // System font stack — no external font dependency. The visual
      // direction is Manrope/Montserrat for headings + Inter for body,
      // but we use a robust system stack to avoid fragile external
      // font-loading requirements during local builds.
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        heading: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      // ─── Radius ────────────────────────────────────────────────────
      // Small: controls (buttons, inputs). Medium: cards. Large: shell.
      borderRadius: {
        sm: "0.375rem", // 6px — controls
        md: "0.5rem", // 8px — cards
        lg: "0.75rem", // 12px — hero/shell surfaces
        xl: "1rem", // 16px — large surfaces
      },
      // ─── Shadow ───────────────────────────────────────────────────
      // Subtle only — no dramatic drop shadows.
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(17, 24, 39, 0.04)",
        card: "0 1px 3px 0 rgba(17, 24, 39, 0.06), 0 1px 2px -1px rgba(17, 24, 39, 0.04)",
        header: "0 1px 2px 0 rgba(17, 24, 39, 0.05)",
      },
      // ─── Spacing rhythm ────────────────────────────────────────────
      // 4/8-based — Tailwind's default already follows this; no override.
      // ─── Transitions ──────────────────────────────────────────────
      // 150–250ms per UI-01 spec.
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        slow: "250ms",
      },
      // ─── Max-width containers ─────────────────────────────────────
      maxWidth: {
        "public-content": "56rem", // 896px — public content
        "admin-content": "72rem", // 1152px — admin content
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
