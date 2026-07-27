const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XAF",
  maximumFractionDigits: 0,
});

export function formatMontant(value: number): string {
  return currencyFormatter.format(value);
}
