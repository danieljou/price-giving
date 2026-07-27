import { Award, Crown, Sparkles, ThumbsUp, type LucideIcon } from "lucide-react";

const TYPE_PRIME_ICONS: Record<string, LucideIcon> = {
  SPECIAL: Sparkles,
  EXC: Award,
  ENC: ThumbsUp,
  EXC_PLUS: Crown,
};

const TYPE_PRIME_BADGE_CLASSES: Record<string, string> = {
  SPECIAL: "bg-violet-600/10 text-violet-700 dark:text-violet-400",
  EXC: "bg-amber-600/10 text-amber-700 dark:text-amber-400",
  ENC: "bg-teal-600/10 text-teal-700 dark:text-teal-400",
  EXC_PLUS: "bg-blue-600/10 text-blue-700 dark:text-blue-400",
};

/** Icon shown next to a "type de prime" everywhere in the primes module, so
 *  each prime stays visually recognizable across the matrix, tabs and charts. */
export function typePrimeIcon(code: string): LucideIcon {
  return TYPE_PRIME_ICONS[code] ?? Award;
}

export function typePrimeBadgeClass(code: string): string {
  return TYPE_PRIME_BADGE_CLASSES[code] ?? "bg-muted text-muted-foreground";
}
