export interface ConfigDetailRow {
  niveau: string;
  typePrime: string;
  article: string;
  quantite: number;
  prixSession: number;
  montant: number;
}

export interface ArticleSummaryRow {
  article: string;
  quantiteTotale: number;
  montantTotal: number;
}

export interface DepenseExportRow {
  libelle: string;
  categorie: string;
  montant: number;
  observation: string | null;
}

export interface RecapTotals {
  totalBeneficiaires: number;
  budgetPrimes: number;
  depensesComplementaires: number;
  budgetGlobal: number;
}
