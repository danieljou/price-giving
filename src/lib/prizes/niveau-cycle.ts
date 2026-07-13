import { niveauRank } from "./niveau-order";

export type Cycle = "Maternelle" | "Primaire" | "Secondaire" | "Supérieur";

export const CYCLE_ORDER: readonly Cycle[] = [
  "Maternelle",
  "Primaire",
  "Secondaire",
  "Supérieur",
];

/** Ordinal ceilings from NIVEAU_ORDER: 1=Maternelle, 2-7=Primaire, 8-14=Secondaire, 15=Supérieur. */
const CYCLE_CEILINGS: readonly { maxRank: number; cycle: Cycle }[] = [
  { maxRank: 1, cycle: "Maternelle" },
  { maxRank: 7, cycle: "Primaire" },
  { maxRank: 14, cycle: "Secondaire" },
  { maxRank: 15, cycle: "Supérieur" },
];

/** Maps a niveau code to its teaching cycle; unknown/unranked codes get null. */
export function niveauCycle(code: string | null | undefined): Cycle | null {
  const rank = niveauRank(code);
  if (rank === 99) return null;
  return CYCLE_CEILINGS.find((c) => rank <= c.maxRank)?.cycle ?? null;
}

/**
 * Which cycles a prize structurally applies to, per the official criteria:
 * PRIX_SPECIAL only exists for maternelle transitions; the other prizes only
 * start from Primaire upward. Drives the "—" vs a real count in the summary.
 */
export function cyclesForPrize(prizeCode: string): readonly Cycle[] {
  if (prizeCode === "SPECIAL") return ["Maternelle"];
  return ["Primaire", "Secondaire", "Supérieur"];
}
