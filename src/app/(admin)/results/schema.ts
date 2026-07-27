import { z } from "zod";

function isNumberString(value: string): boolean {
  return value.trim() !== "" && Number.isFinite(Number(value));
}

export const resultSchema = z.object({
  student_id: z.string().min(1, { error: "Choisissez un étudiant." }),
  school_year_id: z.string().min(1, { error: "Choisissez une année scolaire." }),
  section: z.enum(["francophone", "anglophone"], {
    error: "Choisissez une section.",
  }),
  niveau_depart: z.string().min(1, { error: "Choisissez un niveau de départ." }),
  niveau_admission: z.string().optional(),
  classe_texte: z
    .string()
    .max(120, { error: "120 caractères maximum." })
    .optional(),
  moyenne: z
    .string()
    .optional()
    .refine(
      (v) => !v || (isNumberString(v) && Number(v) >= 0 && Number(v) <= 20),
      { error: "La moyenne doit être entre 0 et 20." }
    ),
  rang: z
    .string()
    .optional()
    .refine(
      (v) => !v || (isNumberString(v) && Number.isInteger(Number(v)) && Number(v) > 0),
      { error: "Le rang doit être un nombre entier positif." }
    ),
  notes: z
    .string()
    .max(2000, { error: "2000 caractères maximum." })
    .optional(),
});

// Form values are plain strings (as native inputs/selects produce) so RHF's
// TFieldValues type stays identical before/after zod validation — numeric
// conversion happens server-side in actions.ts, where the DB columns are numeric.
export type ResultValues = z.infer<typeof resultSchema>;
