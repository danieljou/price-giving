import { Award, Crown, Sparkles, ThumbsUp, type LucideIcon } from "lucide-react";

const TYPE_PRIME_ICONS: Record<string, LucideIcon> = {
  SPECIAL: Sparkles,
  EXC: Award,
  ENC: ThumbsUp,
  EXC_PLUS: Crown,
};

// Wired to the app's own validated categorical palette (--chart-1..4 in
// globals.css) instead of hardcoded Tailwind hues, so every screen that
// shows a "type de prime" — criteria, laureates, dashboard — stays in sync
// and adapts to dark mode automatically (no per-tone dark: variant to
// maintain by hand).
const TYPE_PRIME_BADGE_CLASSES: Record<string, string> = {
  SPECIAL: "bg-(--chart-4)/10 text-(--chart-4)",
  EXC: "bg-(--chart-2)/10 text-(--chart-2)",
  ENC: "bg-(--chart-3)/10 text-(--chart-3)",
  EXC_PLUS: "bg-(--chart-1)/10 text-(--chart-1)",
};

/** Icon shown next to a "type de prime" everywhere in the primes module, so
 *  each prime stays visually recognizable across the matrix, tabs and charts. */
export function typePrimeIcon(code: string): LucideIcon {
  return TYPE_PRIME_ICONS[code] ?? Award;
}

export function typePrimeBadgeClass(code: string): string {
  return TYPE_PRIME_BADGE_CLASSES[code] ?? "bg-muted text-muted-foreground";
}
