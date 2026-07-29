/** Shared KPI-tile accent tones, wired to the app's own --chart tokens
 *  (globals.css) instead of hardcoded Tailwind hues — kept in one place so
 *  dashboard and primes/dashboard don't drift out of sync, and dark mode is
 *  handled automatically by the CSS variables. */
const KPI_TONE_CLASSES = {
  blue: "bg-(--chart-1)/10 text-(--chart-1)",
  amber: "bg-(--chart-2)/10 text-(--chart-2)",
  teal: "bg-(--chart-3)/10 text-(--chart-3)",
  violet: "bg-(--chart-4)/10 text-(--chart-4)",
  rose: "bg-(--chart-5)/10 text-(--chart-5)",
  slate: "bg-muted text-muted-foreground",
} as const;

export type KpiTone = keyof typeof KPI_TONE_CLASSES;

export function kpiToneClass(tone: KpiTone): string {
  return KPI_TONE_CLASSES[tone];
}
