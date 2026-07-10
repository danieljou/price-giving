export interface ParsedBranch {
  moyenne_min: number | null;
  moyenne_max: number | null;
  moyenne_max_inclusive: boolean;
  rang_max: number | null;
  auto_qualify: boolean;
  requires_manual_review: boolean;
  condition_raw: string;
}

const BLACKLIST =
  /concours|matiere|matière|session|diplome|diplôme|formation|jeunes|travailleurs|probatoire|bacc|pour la|en 4e|valid/i;

function toNumber(raw: string): number {
  return Number(raw.replace(",", "."));
}

function baseBranch(conditionRaw: string): ParsedBranch {
  return {
    moyenne_min: null,
    moyenne_max: null,
    moyenne_max_inclusive: true,
    rang_max: null,
    auto_qualify: false,
    requires_manual_review: false,
    condition_raw: conditionRaw,
  };
}

function parseSingleBranch(rawFull: string, part: string): ParsedBranch {
  const trimmed = part.trim();

  const rangedThreshold = trimmed.match(
    /^MOYENNE\s*>=\s*([\d.,]+)\/20\s*avec\s*rang\s*<=\s*(\d+)e?$/i
  );
  if (rangedThreshold) {
    return {
      ...baseBranch(rawFull),
      moyenne_min: toNumber(rangedThreshold[1]),
      rang_max: Number(rangedThreshold[2]),
    };
  }

  const range = trimmed.match(
    /^([\d.,]+)\/20\s*<=\s*MOYENNE\s*<\s*([\d.,]+)\/20$/i
  );
  if (range) {
    return {
      ...baseBranch(rawFull),
      moyenne_min: toNumber(range[1]),
      moyenne_max: toNumber(range[2]),
      moyenne_max_inclusive: false,
    };
  }

  const threshold = trimmed.match(/^MOYENNE\s*>=\s*([\d.,]+)\/20$/i);
  if (threshold) {
    return {
      ...baseBranch(rawFull),
      moyenne_min: toNumber(threshold[1]),
    };
  }

  // Loose extraction: a single MOYENNE clause wrapped in short descriptive
  // text (e.g. "AVEC MENTION (MOYENNE >= 12/20)"), only when nothing else in
  // the string hints at a condition that isn't present in yearly data.
  const looseMatches = [...trimmed.matchAll(/MOYENNE\s*>=\s*([\d.,]+)\/20/gi)];
  if (looseMatches.length === 1 && !BLACKLIST.test(trimmed)) {
    return {
      ...baseBranch(rawFull),
      moyenne_min: toNumber(looseMatches[0][1]),
    };
  }

  return { ...baseBranch(rawFull), requires_manual_review: true };
}

/**
 * Classifies a free-text `intervalle_moyenne` string from critères.json into
 * one or more structured branches (multiple branches = OR alternatives, e.g.
 * "13/20 <= MOYENNE < 14/20 ou bien MOYENNE >= 12/20 avec rang <= 5e").
 * A student is eligible if ANY returned branch matches their moyenne/rang.
 */
export function parseCondition(raw: string | null): ParsedBranch[] {
  if (raw === null) {
    return [{ ...baseBranch(""), auto_qualify: true }];
  }

  const trimmed = raw.trim();
  const orParts = trimmed.split(/\s*ou bien\s*/i);

  if (orParts.length > 1) {
    return orParts.map((part) => parseSingleBranch(trimmed, part));
  }

  return [parseSingleBranch(trimmed, trimmed)];
}
