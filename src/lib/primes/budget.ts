import { beneficiaryKey } from "./beneficiaries";

export interface BudgetLineInput {
  niveauId: string;
  niveauCode: string;
  typePrimeId: string;
  typePrimeLibelle: string;
  unitCost: number;
}

export interface BudgetLine extends BudgetLineInput {
  beneficiaries: number;
  subtotal: number;
}

export interface BudgetSummary {
  lines: BudgetLine[];
  totalBeneficiaires: number;
  budgetPrimes: number;
  depensesComplementaires: number;
  budgetGlobal: number;
}

/**
 * Combines configured prime costs with computed beneficiary counts into the
 * full budget breakdown: bénéficiaires × coût unitaire per (niveau, type de
 * prime), then budget primes + dépenses complémentaires = budget global.
 */
export function computeBudget(
  configLines: readonly BudgetLineInput[],
  beneficiaryCounts: ReadonlyMap<string, number>,
  depensesTotal: number
): BudgetSummary {
  const lines: BudgetLine[] = configLines.map((c) => {
    const beneficiaries =
      beneficiaryCounts.get(beneficiaryKey(c.niveauId, c.typePrimeId)) ?? 0;
    return {
      ...c,
      beneficiaries,
      subtotal: Math.round(c.unitCost * beneficiaries * 100) / 100,
    };
  });

  const budgetPrimes = lines.reduce((sum, l) => sum + l.subtotal, 0);

  return {
    lines,
    totalBeneficiaires: lines.reduce((sum, l) => sum + l.beneficiaries, 0),
    budgetPrimes,
    depensesComplementaires: depensesTotal,
    budgetGlobal: budgetPrimes + depensesTotal,
  };
}
