export interface SchoolYearLike {
  start_year: number;
}

/**
 * Academic years run September→August: in July 2026 we are still in the
 * 2025-2026 session, so the "current" start year flips in September.
 */
export function currentStartYear(today = new Date()): number {
  return today.getMonth() >= 8
    ? today.getFullYear()
    : today.getFullYear() - 1;
}

/**
 * Default school year for forms and data views: the current academic year if
 * it exists, otherwise the most recent one available.
 */
export function pickDefaultSchoolYear<T extends SchoolYearLike>(
  years: readonly T[]
): T | undefined {
  if (years.length === 0) return undefined;
  const target = currentStartYear();
  return (
    years.find((y) => y.start_year === target) ??
    [...years].sort((a, b) => b.start_year - a.start_year)[0]
  );
}
