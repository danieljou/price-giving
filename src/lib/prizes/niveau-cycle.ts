import { niveauRank } from "./niveau-order";

export type Cycle = "Maternelle" | "Primaire" | "Secondaire" | "Supérieur";

export const CYCLE_ORDER: readonly Cycle[] = [
  "Maternelle",
  "Primaire",
  "Secondaire",
  "Supérieur",
];

/** Ordinal ceilings from NIVEAU_ORDER: 1-3=Maternelle (PS/MS/GS or PN/N1/N2),
 *  4-9=Primaire, 10-16=Secondaire, 17+=Supérieur. Supérieur is intentionally
 *  open-ended (Infinity) rather than a fixed max — it's the last cycle, and a
 *  hardcoded ceiling here silently drops every rank added above it (this bit
 *  a real synthesis undercount when university sub-levels were added and
 *  maternelle was split into 3 tiers, both of which shifted every rank below
 *  15 in NIVEAU_ORDER without this ceiling table being updated to match). */
const CYCLE_CEILINGS: readonly { maxRank: number; cycle: Cycle }[] = [
  { maxRank: 3, cycle: "Maternelle" },
  { maxRank: 9, cycle: "Primaire" },
  { maxRank: 16, cycle: "Secondaire" },
  { maxRank: Infinity, cycle: "Supérieur" },
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
