"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPhoneIdentifier, loginSchema, normalizePhone } from "./schema";

export interface LoginState {
  error?: string;
}

export async function login(formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email/téléphone et mot de passe requis." };
  }

  const { identifier, password } = parsed.data;
  const supabase = await createClient();

  const credentials = isPhoneIdentifier(identifier)
    ? { phone: normalizePhone(identifier), password }
    : { email: identifier, password };

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { error: "Identifiants invalides." };
  }

  redirect("/dashboard");
}
