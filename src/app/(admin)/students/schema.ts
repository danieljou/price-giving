import { z } from "zod";

export const studentSchema = z.object({
  first_name: z.string().min(1, { error: "Le prénom est requis." }),
  last_name: z.string().min(1, { error: "Le nom est requis." }),
  section: z.enum(["francophone", "anglophone"], {
    error: "Choisissez une section.",
  }),
  date_of_birth: z.string().optional(),
});

export type StudentValues = z.infer<typeof studentSchema>;
