"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const numberString = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? Number(v) : null;

const criterionSchema = z.object({
  moyenne_min: z.preprocess(
    numberString,
    z.number().min(0).max(20).nullable()
  ),
  moyenne_max: z.preprocess(
    numberString,
    z.number().min(0).max(20).nullable()
  ),
  moyenne_max_inclusive: z.enum(["true", "false"]),
  rang_max: z.preprocess(numberString, z.number().int().min(1).nullable()),
  auto_qualify: z.enum(["true", "false"]),
  requires_manual_review: z.enum(["true", "false"]),
});

const createCriterionSchema = criterionSchema.extend({
  prize_code: z.enum(["SPECIAL", "EXC", "ENC"]),
  section: z.enum(["francophone", "anglophone"]),
  niveau_depart: z.string().min(1),
  niveau_admission: z
    .string()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
  condition_raw: z.string().min(1),
});

export interface CriterionFormState {
  error?: string;
  success?: boolean;
}

export async function updateCriterion(
  criterionId: string,
  formData: FormData
): Promise<CriterionFormState> {
  const parsed = criterionSchema.safeParse({
    moyenne_min: formData.get("moyenne_min"),
    moyenne_max: formData.get("moyenne_max"),
    moyenne_max_inclusive: formData.get("moyenne_max_inclusive"),
    rang_max: formData.get("rang_max"),
    auto_qualify: formData.get("auto_qualify"),
    requires_manual_review: formData.get("requires_manual_review"),
  });

  if (!parsed.success) {
    return { error: "Valeurs invalides (moyennes entre 0 et 20)." };
  }

  const { moyenne_min, moyenne_max } = parsed.data;
  if (moyenne_min != null && moyenne_max != null && moyenne_min > moyenne_max) {
    return { error: "La moyenne minimale doit être ≤ à la maximale." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("criteria")
    .update({
      moyenne_min,
      moyenne_max,
      moyenne_max_inclusive: parsed.data.moyenne_max_inclusive === "true",
      rang_max: parsed.data.rang_max,
      auto_qualify: parsed.data.auto_qualify === "true",
      requires_manual_review: parsed.data.requires_manual_review === "true",
    })
    .eq("id", criterionId);

  if (error) {
    return { error: "Erreur lors de la mise à jour du critère." };
  }

  revalidatePath("/criteria");
  return { success: true };
}

export async function createCriterion(
  formData: FormData
): Promise<CriterionFormState> {
  const parsed = createCriterionSchema.safeParse({
    prize_code: formData.get("prize_code"),
    section: formData.get("section"),
    niveau_depart: formData.get("niveau_depart"),
    niveau_admission: formData.get("niveau_admission"),
    condition_raw: formData.get("condition_raw"),
    moyenne_min: formData.get("moyenne_min"),
    moyenne_max: formData.get("moyenne_max"),
    moyenne_max_inclusive: formData.get("moyenne_max_inclusive"),
    rang_max: formData.get("rang_max"),
    auto_qualify: formData.get("auto_qualify"),
    requires_manual_review: formData.get("requires_manual_review"),
  });

  if (!parsed.success) {
    return {
      error:
        "Valeurs invalides (prix, section, niveau et condition requis ; moyennes entre 0 et 20).",
    };
  }

  const { moyenne_min, moyenne_max } = parsed.data;
  if (moyenne_min != null && moyenne_max != null && moyenne_min > moyenne_max) {
    return { error: "La moyenne minimale doit être ≤ à la maximale." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("criteria").insert({
    prize_code: parsed.data.prize_code,
    section: parsed.data.section,
    niveau_depart: parsed.data.niveau_depart,
    niveau_admission: parsed.data.niveau_admission,
    condition_raw: parsed.data.condition_raw,
    moyenne_min,
    moyenne_max,
    moyenne_max_inclusive: parsed.data.moyenne_max_inclusive === "true",
    rang_max: parsed.data.rang_max,
    auto_qualify: parsed.data.auto_qualify === "true",
    requires_manual_review: parsed.data.requires_manual_review === "true",
  });

  if (error) {
    return { error: "Erreur lors de la création du critère." };
  }

  revalidatePath("/criteria");
  return { success: true };
}
