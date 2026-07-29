/** Shared status-badge tones, wired to the app's own --chart tokens so every
 *  "en attente" / "validé" badge across criteria, laureates and primes stays
 *  visually consistent and dark-mode-safe without a hand-written dark:
 *  variant at each call site. */
const STATUS_TONE_CLASSES = {
  pending: "border-(--chart-2)/40 text-(--chart-2)",
  positive: "border-(--chart-3)/40 text-(--chart-3)",
} as const;

export type StatusTone = keyof typeof STATUS_TONE_CLASSES;

export function statusToneClass(tone: StatusTone): string {
  return STATUS_TONE_CLASSES[tone];
}
