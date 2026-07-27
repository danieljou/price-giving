import type { NiveauLike, ResultLike, TypePrimeLike } from "./types";

export function beneficiaryKey(niveauId: string, typePrimeId: string): string {
  return `${niveauId}:${typePrimeId}`;
}

/**
 * Beneficiary count for each (niveau, type de prime) pair within one session:
 * counts `results` rows completed at that niveau (niveau_depart) whose
 * awarded_prizes includes the type de prime's code. A type de prime whose
 * code doesn't match any awarded prize code simply gets 0 — the catalogue
 * stays paramétrable without requiring every entry to be an academic prize.
 */
export function computeBeneficiaryCounts(
  results: readonly ResultLike[],
  sessionId: string,
  niveaux: readonly NiveauLike[],
  typesPrimes: readonly TypePrimeLike[]
): Map<string, number> {
  const counts = new Map<string, number>();
  const sessionResults = results.filter((r) => r.school_year_id === sessionId);

  for (const niveau of niveaux) {
    const niveauResults = sessionResults.filter(
      (r) => r.section === niveau.section && r.niveau_depart === niveau.code
    );
    for (const typePrime of typesPrimes) {
      const count = niveauResults.filter((r) =>
        r.awarded_prizes.includes(typePrime.code)
      ).length;
      counts.set(beneficiaryKey(niveau.id, typePrime.id), count);
    }
  }

  return counts;
}
