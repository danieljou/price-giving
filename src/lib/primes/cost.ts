export interface ArticleLineLike {
  quantite: number;
  prix_session: number;
}

/** Rounded to cents so client-side previews match the DB's generated `montant` column. */
export function lineAmount(quantite: number, prixSession: number): number {
  return Math.round(quantite * prixSession * 100) / 100;
}

export function configCost(lines: readonly ArticleLineLike[]): number {
  return lines.reduce(
    (sum, l) => sum + lineAmount(l.quantite, l.prix_session),
    0
  );
}
