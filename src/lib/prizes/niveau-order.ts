/**
 * Shared grade-progression ordinal, mirroring the `niveaux.progression_order`
 * column: equivalent francophone and anglophone levels share the same rank
 * (SIL and CLASS 1 are both 4, etc.). Used to sort laureate lists from
 * kindergarten up through university, exam labels included.
 */
export const NIVEAU_ORDER: Record<string, number> = {
  // JARDIN is the legacy catch-all for maternelle. PS/MS/GS (francophone) and
  // PN/N1/N2 (anglophone) are the real grade-by-grade classes within it, one
  // tier per year — PS=PN, MS=N1, GS=N2 — so they sort correctly against each
  // other instead of collapsing to a single tier.
  JARDIN: 1,
  PS: 1,
  PN: 1,
  MS: 2,
  N1: 2,
  GS: 3,
  N2: 3,
  SIL: 4,
  "CLASS 1": 4,
  CPS: 4,
  CP: 5,
  "CLASS 2": 5,
  CE1: 6,
  "CLASS 3": 6,
  CE2: 7,
  "CLASS 4": 7,
  CM1: 8,
  "CLASS 5": 8,
  CEP: 8,
  CM2: 9,
  "CLASS 6": 9,
  "6e": 10,
  "FORM 1": 10,
  "5e": 11,
  "FORM 2": 11,
  "4e": 12,
  "FORM 3": 12,
  "3e": 13,
  "FORM 4": 13,
  BEPC: 13,
  "2nd": 14,
  "FORM 5": 14,
  "1ere": 15,
  "LOWER 6": 15,
  PROBATOIRE: 15,
  Tle: 16,
  "UPPER 6": 16,
  BACC: 16,
  UNIVERSITE: 17,
  UNIVERSITY: 17,
  "Niveau 1 (1ère année)": 18,
  "Year 1": 18,
  "Niveau 2 (2ème année)": 19,
  "Year 2": 19,
  "Niveau 3 (3ème année)": 20,
  "Year 3": 20,
  "Niveau 4 (4ème année)": 21,
  "Year 4": 21,
  "Niveau 5 (5ème année)": 22,
  "Year 5": 22,
  "Niveau 6 (6ème année)": 23,
  "Year 6": 23,
  "Niveau 7 (7ème année)": 24,
  "Year 7": 24,
};

/** Unknown levels sort last rather than crashing or leading the list. */
export function niveauRank(code: string | null | undefined): number {
  if (!code) return 99;
  return NIVEAU_ORDER[code] ?? 99;
}
