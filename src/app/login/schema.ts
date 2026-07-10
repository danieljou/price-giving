import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Adresse email invalide." }),
  password: z.string().min(1, { error: "Mot de passe requis." }),
});

export type LoginValues = z.infer<typeof loginSchema>;
