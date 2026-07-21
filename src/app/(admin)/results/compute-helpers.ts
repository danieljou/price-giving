import type { SupabaseClient } from "@supabase/supabase-js";
import { computePrizes } from "@/lib/prizes/compute";
import type { Database, PrizeCode, Section } from "@/lib/supabase/types";

interface ResultInput {
  studentId: string;
  schoolYearId: string;
  section: Section;
  niveauDepart: string;
  niveauAdmission: string | null;
  moyenne: number | null;
  rang: number | null;
}

/**
 * Fetches matching criteria + the previous school year's result for this
 * student, then runs the pure computePrizes function. Used by both
 * create/update result actions and the bulk "recompute year" action.
 */
export async function computeAwardedPrizes(
  supabase: SupabaseClient<Database>,
  input: ResultInput
): Promise<{
  awarded_prizes: PrizeCode[];
  criteria_computed_at: string;
  manualReviewNotes: string[];
}> {
  let criteriaQuery = supabase
    .from("criteria")
    .select("*")
    .eq("section", input.section)
    .eq("niveau_depart", input.niveauDepart);

  criteriaQuery = input.niveauAdmission
    ? criteriaQuery.eq("niveau_admission", input.niveauAdmission)
    : criteriaQuery.is("niveau_admission", null);

  const { data: matchingCriteria } = await criteriaQuery;

  const { data: currentYear } = await supabase
    .from("school_years")
    .select("start_year")
    .eq("id", input.schoolYearId)
    .single();

  let previousYearAwardedPrizes: PrizeCode[] | null = null;
  if (currentYear) {
    const { data: previousYear } = await supabase
      .from("school_years")
      .select("id")
      .eq("start_year", currentYear.start_year - 1)
      .maybeSingle();

    if (previousYear) {
      const { data: previousResult } = await supabase
        .from("results")
        .select("awarded_prizes")
        .eq("student_id", input.studentId)
        .eq("school_year_id", previousYear.id)
        .maybeSingle();

      previousYearAwardedPrizes = previousResult?.awarded_prizes ?? null;
    }
  }

  const { awardedPrizes, manualReviewNotes } = computePrizes({
    moyenne: input.moyenne,
    rang: input.rang,
    matchingCriteria: matchingCriteria ?? [],
    previousYearAwardedPrizes,
    niveauDepart: input.niveauDepart,
    niveauAdmission: input.niveauAdmission,
  });

  return {
    awarded_prizes: awardedPrizes,
    criteria_computed_at: new Date().toISOString(),
    manualReviewNotes,
  };
}
