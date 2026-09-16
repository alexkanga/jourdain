import { z } from "zod";

// Login schema — username + password (NOT email)
export const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Tiptap JSON shape (minimal — at least an empty doc object).
// We accept any non-null object as Tiptap JSON; full structural validation
// of ProseMirror documents is delegated to Tiptap itself.
const tiptapJsonSchema = z
  .any()
  .refine((v) => v !== null && typeof v === "object", {
    message: "La description est requise",
  })
  .refine((v) => {
    // Must be a Tiptap doc: { type: "doc", content: [...] } OR a non-empty content object
    if (v && typeof v === "object") {
      if (v.type === "doc" && Array.isArray(v.content)) return true;
      // Some editors emit just a content array or a single node; accept those too
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
  sourcePublicationDate: z.string().optional(), // ISO date string YYYY-MM-DD
  applicationDeadline: z.string().optional(), // ISO date string YYYY-MM-DD
  sourceName: z.string().optional(),
  sourceUrl: z
    .string()
    .url("L'URL source doit être valide")
    .optional()
    .or(z.literal("")),
  applicationModalities: z.string().optional(),
  applicationEmail: z
    .string()
    .email("L'email doit être valide")
    .optional()
    .or(z.literal("")),
  applicationUrl: z
    .string()
    .url("L'URL de candidature doit être valide")
    .optional()
    .or(z.literal("")),
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
