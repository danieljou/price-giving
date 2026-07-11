import { z } from "zod";

/** Digits only (after stripping spaces/dashes/dots), optionally +-prefixed. */
const PHONE_PATTERN = /^\+?\d{8,15}$/;

export function isPhoneIdentifier(value: string): boolean {
  return PHONE_PATTERN.test(value.replaceAll(/[\s.-]/g, ""));
}

/**
 * Normalizes a phone number to E.164 as Supabase stores it. Numbers without
 * a country code are assumed to be Cameroonian (+237).
 */
export function normalizePhone(value: string): string {
  const cleaned = value.replaceAll(/[\s.-]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("237")) return `+${cleaned}`;
  return `+237${cleaned}`;
}

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { error: "Email ou numéro de téléphone requis." })
    .refine(
      (v) => isPhoneIdentifier(v) || z.email().safeParse(v).success,
      { error: "Entrez un email valide ou un numéro de téléphone." }
    ),
  password: z.string().min(1, { error: "Mot de passe requis." }),
});

export type LoginValues = z.infer<typeof loginSchema>;
