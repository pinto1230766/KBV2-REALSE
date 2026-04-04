import { z } from "zod";

export const speakerSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  congregation: z.string().min(1, "La congrégation est requise"),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  photoUrl: z.string().optional(),
  spousePhotoUrl: z.string().optional(),
  householdType: z.enum(["single", "couple"]).default("single"),
  spouseName: z.string().optional(),
  notes: z.string().optional(),
});

export const hostSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
  capacity: z.number().min(1).optional(),
  role: z.enum(["hebergement", "transport", "repas"]).optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const visitSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  congregation: z.string().min(1, "La congrégation est requise"),
  visitDate: z.string().min(1, "La date est requise"),
  talkNoOrType: z.string().optional(),
  talkTheme: z.string().optional(),
  speakerPhone: z.string().optional(),
  locationType: z.enum(["kingdom_hall", "zoom", "streaming", "other"]).default("kingdom_hall"),
  status: z.enum(["scheduled", "confirmed", "cancelled", "completed"]).default("scheduled"),
  notes: z.string().optional(),
});

export type SpeakerFormData = z.infer<typeof speakerSchema>;
export type HostFormData = z.infer<typeof hostSchema>;
export type VisitFormData = z.infer<typeof visitSchema>;
