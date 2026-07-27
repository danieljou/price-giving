"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resultSchema } from "./schema";
import { computeAwardedPrizes } from "./compute-helpers";
import type { PrizeCode } from "@/lib/supabase/types";

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
    moyenne: formData.get("moyenne") ?? undefined,
    rang: formData.get("rang") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    // Report the actual field that failed rather than a message hardcoded
    // to "moyenne" — this path is normally caught client-side first, but
    // must still point at the right field if it's ever reached directly.
    const firstIssue = parsed.error.issues[0];
    return {
      error: firstIssue?.message ?? "Champs invalides.",
    };
  }

  return {
    studentId: parsed.data.student_id,
    schoolYearId: parsed.data.school_year_id,
    section: parsed.data.section,
    niveauDepart: parsed.data.niveau_depart,
    niveauAdmission: parsed.data.niveau_admission || null,
    classeTexte: parsed.data.classe_texte?.trim() || null,
    moyenne: parsed.data.moyenne ? Number(parsed.data.moyenne) : null,
    rang: parsed.data.rang ? Number(parsed.data.rang) : null,
    notes: parsed.data.notes?.trim() || null,
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
    notes: parsed.notes,
    awarded_prizes,
    manual_review_notes: manualReviewNotes,
    manual_review_resolved: false,
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

  const { data: existing } = await supabase
    .from("results")
    .select("manual_review_resolved")
    .eq("id", resultId)
    .single();

  // A deliberated decision is frozen until an admin explicitly reopens it —
  // otherwise saving an unrelated edit (or a bulk recompute) would silently
  // overwrite a human call with the same "can't compute this" result.
  let manualReviewNotes: string[] = [];
  let prizeUpdate: {
    awarded_prizes?: PrizeCode[];
    manual_review_notes?: string[];
    manual_review_resolved?: boolean;
    criteria_computed_at?: string;
  } = {};

  if (!existing?.manual_review_resolved) {
    const computed = await computeAwardedPrizes(supabase, parsed);
    manualReviewNotes = computed.manualReviewNotes;
    prizeUpdate = {
      awarded_prizes: computed.awarded_prizes,
      manual_review_notes: computed.manualReviewNotes,
      manual_review_resolved: false,
      criteria_computed_at: computed.criteria_computed_at,
    };
  }

  const { error } = await supabase
    .from("results")
    .update({
      section: parsed.section,
      niveau_depart: parsed.niveauDepart,
      niveau_admission: parsed.niveauAdmission,
      classe_texte: parsed.classeTexte,
      moyenne: parsed.moyenne,
      rang: parsed.rang,
      notes: parsed.notes,
      ...prizeUpdate,
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
      "id, student_id, school_year_id, section, niveau_depart, niveau_admission, moyenne, rang, manual_review_resolved"
    )
    .eq("school_year_id", schoolYearId);

  for (const result of results ?? []) {
    // Frozen: a deliberated decision survives a bulk recompute unless
    // explicitly reopened.
    if (result.manual_review_resolved) continue;

    const { awarded_prizes, criteria_computed_at, manualReviewNotes } =
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
      .update({
        awarded_prizes,
        manual_review_notes: manualReviewNotes,
        manual_review_resolved: false,
        criteria_computed_at,
      })
      .eq("id", result.id);
  }

  revalidatePath("/laureates");
  revalidatePath("/dashboard");
  revalidatePath("/review");
}

/** Marks a result as decided ("délibéré"): assigns the chosen prize (or none)
 *  and removes it from the manual-review queue. Frozen against recomputation
 *  until reopened — see updateResult/recomputeYear. */
export async function resolveManualReview(
  resultId: string,
  prizeCode: PrizeCode | null
) {
  const supabase = await createClient();
  await supabase
    .from("results")
    .update({
      awarded_prizes: prizeCode ? [prizeCode] : [],
      manual_review_resolved: true,
    })
    .eq("id", resultId);

  revalidatePath("/review");
  revalidatePath("/laureates");
}

/** Undoes resolveManualReview — clears the manually-assigned prize and puts
 *  the result back into the manual-review queue so admins can go back and
 *  forth on a decision. */
export async function reopenManualReview(resultId: string) {
  const supabase = await createClient();
  await supabase
    .from("results")
    .update({ awarded_prizes: [], manual_review_resolved: false })
    .eq("id", resultId);

  revalidatePath("/review");
  revalidatePath("/laureates");
}
