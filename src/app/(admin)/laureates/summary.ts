import {
  CYCLE_ORDER,
  cyclesForPrize,
  niveauCycle,
  type Cycle,
} from "@/lib/prizes/niveau-cycle";
import type { LaureateRow } from "./columns";

export interface SummaryRow {
  label: string;
  values: (number | null)[];
  total: number;
  emphasis?: boolean;
}

export interface Summary {
  cycles: readonly Cycle[];
  rows: SummaryRow[];
  grandTotal: number;
}

/** Prize x cycle breakdown mirroring the school's official ceremony summary
 *  sheet (Prix spécial / Excellence / Encouragement, Total 1, Excellence+,
 *  Total 2, grand TOTAL). Shared by the on-screen Synthèse table and the
 *  PDF/Word exports so the numbers can never drift apart. */
export function buildSummary(rows: LaureateRow[]): Summary {
  const cycles = CYCLE_ORDER;

  function countRow(code: string, label: string): SummaryRow {
    const applicable = cyclesForPrize(code);
    const values = cycles.map((cycle) =>
      applicable.includes(cycle)
        ? rows.filter(
            (r) =>
              r.awarded_prizes.includes(code) &&
              niveauCycle(r.niveau_depart) === cycle
          ).length
        : null
    );
    const total = values.reduce((sum: number, v) => sum + (v ?? 0), 0);
    return { label, values, total };
  }

  const special = countRow("SPECIAL", "Prix spécial");
  const exc = countRow("EXC", "Prix d'excellence");
  const enc = countRow("ENC", "Prix d'encouragement");
  const total1Values = cycles.map(
    (_, i) => (special.values[i] ?? 0) + (exc.values[i] ?? 0) + (enc.values[i] ?? 0)
  );
  const total1: SummaryRow = {
    label: "Total 1",
    values: total1Values,
    total: total1Values.reduce((a, b) => a + b, 0),
    emphasis: true,
  };

  const excPlus = countRow("EXC_PLUS", "Prix d'excellence plus");
  const total2Values = cycles.map((_, i) => total1Values[i] + (excPlus.values[i] ?? 0));
  const total2: SummaryRow = {
    label: "Total 2",
    values: total2Values,
    total: total2Values.reduce((a, b) => a + b, 0),
    emphasis: true,
  };

  return {
    cycles,
    rows: [special, exc, enc, total1, excPlus, total2],
    grandTotal: total2.total,
  };
}

export function formatSummaryCell(v: number | null): string {
  return v === null ? "—" : String(v).padStart(2, "0");
}
