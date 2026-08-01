import { z } from "zod";

export const niveauSchema = z.object({
  section: z.enum(["francophone", "anglophone"], {
    error: "La section est requise.",
  }),
  code: z.string().min(1, { error: "Le code est requis." }),
  progression_order: z
    .string()
    .min(1, { error: "L'ordre de progression est requis." })
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, {
      error: "L'ordre de progression doit être un entier positif.",
    }),
});

export type NiveauValues = z.infer<typeof niveauSchema>;
