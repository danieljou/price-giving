import { z } from "zod";

export const depenseFormSchema = z.object({
  libelle: z.string().trim().min(1, "Libellé requis").max(120),
  categorie: z.string().trim().min(1, "Catégorie requise").max(60),
  description: z.string().trim().max(500).nullable(),
  montant: z.coerce.number().min(0, "Le montant doit être positif"),
  observation: z.string().trim().max(300).nullable(),
});

export type DepenseFormValues = z.infer<typeof depenseFormSchema>;
