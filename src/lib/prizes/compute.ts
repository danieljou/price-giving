import type { Database, PrizeCode } from "../supabase/types";

type CriteriaRow = Database["public"]["Tables"]["criteria"]["Row"];

export interface ComputePrizesInput {
  moyenne: number | null;
  rang: number | null;
  /** Criteria rows already filtered to this student's (section, niveau_depart, niveau_admission). */
  matchingCriteria: CriteriaRow[];
  /** Prizes awarded to the same student for the immediately preceding school year, or null if none. */
  previousYearAwardedPrizes: PrizeCode[] | null;
}

export interface ComputePrizesResult {
  awardedPrizes: PrizeCode[];
  /** Criteria that matched the level transition but need a human decision (e.g. exam-pass conditions not present in yearly data). */
  manualReviewNotes: string[];
}

function matchesThreshold(
  row: CriteriaRow,
  moyenne: number | null,
  rang: number | null
): boolean {
  if (moyenne === null) return false;

  const moyenneOk =
    (row.moyenne_min === null || moyenne >= row.moyenne_min) &&
    (row.moyenne_max === null ||
      (row.moyenne_max_inclusive
        ? moyenne <= row.moyenne_max
        : moyenne < row.moyenne_max));

  const rangOk =
    row.rang_max === null || (rang !== null && rang <= row.rang_max);

  return moyenneOk && rangOk;
}

/**
 * Pure prize computation: given the criteria rows for a student's exact
 * level transition, decides which prizes apply. EXCELLENCE_PLUS is derived
 * separately from the previous year's result rather than from `criteria`,
 * since it isn't a level/moyenne rule.
 */
export function computePrizes(input: ComputePrizesInput): ComputePrizesResult {
  const awarded = new Set<PrizeCode>();
  const manualReviewNotes: string[] = [];

  for (const row of input.matchingCriteria) {
    if (row.auto_qualify) {
      awarded.add(row.prize_code);
      continue;
    }
    if (row.requires_manual_review) {
      manualReviewNotes.push(`${row.prize_code}: ${row.condition_raw}`);
      continue;
    }
    if (matchesThreshold(row, input.moyenne, input.rang)) {
      awarded.add(row.prize_code);
    }
  }

  if (
    awarded.has("EXC") &&
    input.previousYearAwardedPrizes?.includes("EXC")
  ) {
    awarded.add("EXC_PLUS");
  }

  return { awardedPrizes: Array.from(awarded), manualReviewNotes };
}
