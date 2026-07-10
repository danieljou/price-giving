import { z } from "zod";

export const schoolYearSchema = z.object({
  label: z.string().min(1, { error: "Le libellé est requis." }),
  start_year: z
    .string()
    .min(1, { error: "L'année de début est requise." })
    .refine((v) => Number.isInteger(Number(v)), {
      error: "L'année de début doit être un nombre entier.",
    }),
});

export type SchoolYearValues = z.infer<typeof schoolYearSchema>;
