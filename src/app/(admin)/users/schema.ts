import { z } from "zod";
import { isPhoneIdentifier } from "@/app/login/schema";

export const createUserSchema = z.object({
  email: z.email({ error: "Email invalide." }),
  password: z.string().min(8, { error: "8 caractères minimum." }),
  phone: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined))
    .refine((v) => v === undefined || isPhoneIdentifier(v), {
      error: "Numéro de téléphone invalide.",
    }),
  role: z.enum(["saisie", "admin"], { error: "Le rôle est requis." }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const setRoleSchema = z.object({
  role: z.enum(["saisie", "admin"], { error: "Le rôle est requis." }),
});
