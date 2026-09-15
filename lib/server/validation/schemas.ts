import { z } from "zod";

// Login schema — username + password (NOT email)
export const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Offer schema — title and description required; all other fields optional
// Per S5 BR-030, BR-031, BR-080
export const offerSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.any(), // Tiptap JSON — validated separately if needed
  company: z.string().optional(),
  sector: z.string().optional(),
  category: z.string().optional(),
  contractType: z.string().optional(),
  educationLevel: z.string().optional(),
  experience: z.string().optional(),
  location: z.string().optional(),
  sourcePublicationDate: z.string().optional(), // ISO date string
  applicationDeadline: z.string().optional(), // ISO date string
  sourceName: z.string().optional(),
  sourceUrl: z.string().url("L'URL source doit être valide").optional().or(z.literal("")),
  applicationModalities: z.string().optional(),
  applicationEmail: z.string().email("L'email doit être valide").optional().or(z.literal("")),
  applicationUrl: z.string().url("L'URL de candidature doit être valide").optional().or(z.literal("")),
});

export type OfferInput = z.infer<typeof offerSchema>;
