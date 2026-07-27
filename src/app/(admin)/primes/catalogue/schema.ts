import { z } from "zod";

export const articleFormSchema = z.object({
  code: z.string().trim().min(1, "Code requis").max(30),
  libelle: z.string().trim().min(1, "Libellé requis").max(120),
  categorie: z.string().trim().min(1, "Catégorie requise").max(60),
  description: z.string().trim().max(500).nullable(),
  unite: z.string().trim().min(1, "Unité requise").max(30),
  prix_reference: z.coerce.number().min(0, "Le prix doit être positif"),
  actif: z.enum(["true", "false"]),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
