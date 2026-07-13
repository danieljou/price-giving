/** Case/accent/whitespace-insensitive comparison key for a student's name. */
export function normalizeStudentName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

interface StudentNameKey {
  first_name: string;
  last_name: string;
  section: string;
}

export function isSameStudent(a: StudentNameKey, b: StudentNameKey): boolean {
  return (
    a.section === b.section &&
    normalizeStudentName(a.first_name) === normalizeStudentName(b.first_name) &&
    normalizeStudentName(a.last_name) === normalizeStudentName(b.last_name)
  );
}

/** Finds an existing student with the exact same name (normalized) and
 *  section — used to stop accidental duplicate creation. */
export function findExistingStudent<T extends StudentNameKey>(
  candidate: StudentNameKey,
  existing: readonly T[]
): T | undefined {
  return existing.find((s) => isSameStudent(candidate, s));
}
