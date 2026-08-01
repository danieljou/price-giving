"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { niveauSchema } from "./schema";

export interface NiveauFormState {
  error?: string;
}

export async function createNiveau(
  formData: FormData
): Promise<NiveauFormState> {
  const parsed = niveauSchema.safeParse({
    section: formData.get("section"),
    code: formData.get("code"),
    progression_order: formData.get("progression_order"),
  });

  if (!parsed.success) {
    return { error: "Section, code et ordre de progression requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("niveaux").insert({
    section: parsed.data.section,
    code: parsed.data.code.trim(),
    progression_order: Number(parsed.data.progression_order),
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ce niveau existe déjà pour cette section."
          : "Erreur lors de la création du niveau.",
    };
  }

  revalidatePath("/niveaux");
  revalidatePath("/results/new");
  revalidatePath("/criteria");
  return {};
}

export async function updateNiveau(
  niveauId: string,
  formData: FormData
): Promise<NiveauFormState> {
  const parsed = niveauSchema.safeParse({
    section: formData.get("section"),
    code: formData.get("code"),
    progression_order: formData.get("progression_order"),
  });

  if (!parsed.success) {
    return { error: "Section, code et ordre de progression requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("niveaux")
    .update({
      section: parsed.data.section,
      code: parsed.data.code.trim(),
      progression_order: Number(parsed.data.progression_order),
    })
    .eq("id", niveauId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ce niveau existe déjà pour cette section."
          : "Erreur lors de la mise à jour du niveau.",
    };
  }

  revalidatePath("/niveaux");
  revalidatePath("/results/new");
  revalidatePath("/criteria");
  return {};
}
