import { z } from "zod";

// ─── Safe URL helpers ─────────────────────────────────────────────
// Shared helpers for validating http/https URLs at both save-time
// (Zod schema) and render-time (public components). These prevent
// unsafe schemes (javascript:, data:, vbscript:, file:, etc.) from
// being stored or rendered as clickable links on the public portal.

/**
 * Validate that a URL string uses an allowed scheme (http or https only).
 * Returns true if the value is safe, false otherwise.
 * Empty strings are allowed (fields are optional).
 */
function isSafeHttpUrl(value: string): boolean {
  if (value === "") return true; // optional field — empty is valid
  const lower = value.trim().toLowerCase();
  return lower.startsWith("http://") || lower.startsWith("https://");
}

/** Zod refinements for URL fields that must be http/https only */
const safeUrlField = (msg: string) =>
  z
    .string()
    .url(msg)
    .refine(isSafeHttpUrl, msg)
    .optional()
    .or(z.literal(""));

// ─── Schemas ──────────────────────────────────────────────────────

// Login schema — username + password (NOT email)
export const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Tiptap JSON shape (minimal — at least an empty doc object).
const tiptapJsonSchema = z
  .any()
  .refine((v) => v !== null && typeof v === "object", {
    message: "La description est requise",
  })
  .refine((v) => {
    if (v && typeof v === "object") {
      if (v.type === "doc" && Array.isArray(v.content)) return true;
      if (Array.isArray(v)) return v.length > 0;
      if (v.type) return true;
    }
    return false;
  }, {
    message: "La description doit être un document Tiptap valide",
  });

// Offer schema — title and description required; all other fields optional
// Per S5 BR-030, BR-031, BR-080, FR-023, FR-024
export const offerSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: tiptapJsonSchema,
  company: z.string().optional(),
  sector: z.string().optional(),
  category: z.string().optional(),
  contractType: z.string().optional(),
  educationLevel: z.string().optional(),
  experience: z.string().optional(),
  location: z.string().optional(),
  sourcePublicationDate: z.string().optional(),
  applicationDeadline: z.string().optional(),
  sourceName: z.string().optional(),
  sourceUrl: safeUrlField("L'URL source doit être une URL http(s) valide"),
  applicationModalities: z.string().optional(),
  applicationEmail: z
    .string()
    .email("L'email doit être valide")
    .optional()
    .or(z.literal("")),
  applicationUrl: safeUrlField("L'URL de candidature doit être une URL http(s) valide"),
});

export type OfferInput = z.infer<typeof offerSchema>;

// Lifecycle action schemas — id only
export const offerIdSchema = z.object({
  id: z.string().uuid("L'identifiant de l'offre doit être un UUID valide"),
});

export type OfferIdInput = z.infer<typeof offerIdSchema>;

// Admin offer list filter schema (URL searchParams)
export const offerListFilterSchema = z.object({
  status: z
    .enum(["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"])
    .optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type OfferListFilter = z.infer<typeof offerListFilterSchema>;
