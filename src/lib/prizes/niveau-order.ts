/**
 * Shared grade-progression ordinal, mirroring the `niveaux.progression_order`
 * column: equivalent francophone and anglophone levels share the same rank
 * (SIL and CLASS 1 are both 2, etc.). Used to sort laureate lists from
 * kindergarten up through university, exam labels included.
 */
export const NIVEAU_ORDER: Record<string, number> = {
  // JARDIN is the legacy catch-all for maternelle; PS/MS/GS (francophone) and
  // PN/N1/N2 (anglophone) are the actual grade-by-grade classes within it —
  // kept at the same tier since they don't need to sort against each other.
  JARDIN: 1,
  PS: 1,
  MS: 1,
  GS: 1,
  PN: 1,
  N1: 1,
  N2: 1,
  SIL: 2,
  "CLASS 1": 2,
  CPS: 2,
  CP: 3,
  "CLASS 2": 3,
  CE1: 4,
  "CLASS 3": 4,
  CE2: 5,
  "CLASS 4": 5,
  CM1: 6,
  "CLASS 5": 6,
  CEP: 6,
  CM2: 7,
  "CLASS 6": 7,
  "6e": 8,
  "FORM 1": 8,
  "5e": 9,
  "FORM 2": 9,
  "4e": 10,
  "FORM 3": 10,
  "3e": 11,
  "FORM 4": 11,
  BEPC: 11,
  "2nd": 12,
  "FORM 5": 12,
  "1ere": 13,
  "LOWER 6": 13,
  PROBATOIRE: 13,
  Tle: 14,
  "UPPER 6": 14,
  BACC: 14,
  UNIVERSITE: 15,
  UNIVERSITY: 15,
};

/** Unknown levels sort last rather than crashing or leading the list. */
export function niveauRank(code: string | null | undefined): number {
  if (!code) return 99;
  return NIVEAU_ORDER[code] ?? 99;
}
