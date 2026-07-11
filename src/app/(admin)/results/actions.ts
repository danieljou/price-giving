"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resultSchema } from "./schema";
import { computeAwardedPrizes } from "./compute-helpers";

export interface ResultFormState {
  error?: string;
  manualReviewNotes?: string[];
}

function parseResultForm(formData: FormData) {
  const parsed = resultSchema.safeParse({
    student_id: formData.get("student_id"),
    school_year_id: formData.get("school_year_id"),
    section: formData.get("section"),
    niveau_depart: formData.get("niveau_depart"),
    niveau_admission: formData.get("niveau_admission"),
    classe_texte: formData.get("classe_texte") ?? undefined,
    moyenne: formData.get("moyenne"),
    rang: formData.get("rang"),
  });

  if (!parsed.success) {
    return { error: "Champs invalides (moyenne entre 0 et 20 requise)." };
  }

  return {
    studentId: parsed.data.student_id,
    schoolYearId: parsed.data.school_year_id,
    section: parsed.data.section,
    niveauDepart: parsed.data.niveau_depart,
    niveauAdmission: parsed.data.niveau_admission || null,
    classeTexte: parsed.data.classe_texte?.trim() || null,
    moyenne: Number(parsed.data.moyenne),
    rang: parsed.data.rang ? Number(parsed.data.rang) : null,
  };
}

export async function createResult(
  formData: FormData
): Promise<ResultFormState> {
  const parsed = parseResultForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { awarded_prizes, criteria_computed_at, manualReviewNotes } =
    await computeAwardedPrizes(supabase, parsed);

  const { error } = await supabase.from("results").insert({
    student_id: parsed.studentId,
    school_year_id: parsed.schoolYearId,
    section: parsed.section,
    niveau_depart: parsed.niveauDepart,
    niveau_admission: parsed.niveauAdmission,
    classe_texte: parsed.classeTexte,
    moyenne: parsed.moyenne,
    rang: parsed.rang,
    awarded_prizes,
    criteria_computed_at,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Un résultat existe déjà pour cet étudiant sur cette année."
          : "Erreur lors de l'enregistrement.",
    };
  }

  revalidatePath(`/students/${parsed.studentId}`);
  revalidatePath("/laureates");
  revalidatePath("/dashboard");

  if (manualReviewNotes.length > 0) {
    // Surface manual-review criteria to the admin instead of silently
    // dropping them; the result is still saved with whatever was auto-decided.
    return { manualReviewNotes };
  }

  redirect(`/students/${parsed.studentId}`);
}

export async function updateResult(
  resultId: string,
  formData: FormData
): Promise<ResultFormState> {
  const parsed = parseResultForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { awarded_prizes, criteria_computed_at, manualReviewNotes } =
    await computeAwardedPrizes(supabase, parsed);

  const { error } = await supabase
    .from("results")
    .update({
      section: parsed.section,
      niveau_depart: parsed.niveauDepart,
      niveau_admission: parsed.niveauAdmission,
      classe_texte: parsed.classeTexte,
      moyenne: parsed.moyenne,
      rang: parsed.rang,
      awarded_prizes,
      criteria_computed_at,
    })
    .eq("id", resultId);

  if (error) {
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath(`/students/${parsed.studentId}`);
  revalidatePath("/laureates");
  revalidatePath("/dashboard");

  if (manualReviewNotes.length > 0) {
    return { manualReviewNotes };
  }

  redirect(`/students/${parsed.studentId}`);
}

export async function recomputeYear(schoolYearId: string) {
  const supabase = await createClient();
  const { data: results } = await supabase
    .from("results")
    .select(
      "id, student_id, school_year_id, section, niveau_depart, niveau_admission, moyenne, rang"
    )
    .eq("school_year_id", schoolYearId);

  for (const result of results ?? []) {
    const { awarded_prizes, criteria_computed_at } =
      await computeAwardedPrizes(supabase, {
        studentId: result.student_id,
        schoolYearId: result.school_year_id,
        section: result.section,
        niveauDepart: result.niveau_depart,
        niveauAdmission: result.niveau_admission,
        moyenne: result.moyenne,
        rang: result.rang,
      });

    await supabase
      .from("results")
      .update({ awarded_prizes, criteria_computed_at })
      .eq("id", result.id);
  }

  revalidatePath("/laureates");
  revalidatePath("/dashboard");
}
