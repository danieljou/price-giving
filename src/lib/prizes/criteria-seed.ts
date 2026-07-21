/**
 * One-shot seed script: reads critères.json, classifies each criterion's
 * intervalle_moyenne into structured fields, and inserts into the
 * `criteria` and `niveaux` Supabase tables.
 *
 * Usage:
 *   npx tsx src/lib/prizes/criteria-seed.ts --dry-run   # inspect classification only
 *   npx tsx src/lib/prizes/criteria-seed.ts             # actually seed the database
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCondition } from "./parse-condition";
import type { Database, PrizeCode, Section } from "../supabase/types";

type NiveauMap = Record<string, Record<string, number>>;

// Shared progression order across sections so equivalent grade levels line
// up (e.g. francophone CE1 and anglophone CLASS 3 both get order 4).
// Exam-only pseudo-levels (CEP, BEPC, PROBATOIRE, BACC...) share the order
// of the grade tier they belong to rather than adding extra steps, so the
// two sections' real grade levels stay aligned.
const NIVEAU_ORDER: NiveauMap = {
  francophone: {
    JARDIN: 1,
    PS: 1,
    MS: 1,
    GS: 1,
    SIL: 2,
    CPS: 2,
    CP: 3,
    CE1: 4,
    CE2: 5,
    CM1: 6,
    CEP: 6,
    CM2: 7,
    "6e": 8,
    "5e": 9,
    "4e": 10,
    "3e": 11,
    BEPC: 11,
    "BEPC / CAP": 11,
    "3e / 4e Annee": 11,
    "2nd": 12,
    "1ere": 13,
    PROBATOIRE: 13,
    Tle: 14,
    BACC: 14,
    BACCALAUREAT: 14,
    UNIVERSITE: 15,
  },
  anglophone: {
    JARDIN: 1,
    PN: 1,
    N1: 1,
    N2: 1,
    "CLASS 1": 2,
    CPS: 2,
    "CLASS 2": 3,
    "CLASS 3": 4,
    "CLASS 4": 5,
    "CLASS 5": 6,
    "CLASS 6": 7,
    "FORM 1": 8,
    "FORM 2": 9,
    "FORM 3": 10,
    "FORM 4": 11,
    "GCE O LEVEL": 11,
    "FORM 5": 12,
    "LOWER 6": 13,
    "UPPER 6": 14,
    "GCE A LEVEL": 14,
    UNIVERSITY: 15,
  },
};

interface RawCriterion {
  niveau_depart?: Record<Section, string | null>;
  niveau_admission?: Record<Section, string | null>;
  intervalle_moyenne?: string | null;
  condition?: string;
  prix: string;
}

interface RawPrize {
  code: string;
  criteres: RawCriterion[];
}

interface RawFile {
  criteres_selection_laureats_prix: {
    prix: Record<string, RawPrize>;
  };
}

const SECTIONS: Section[] = ["francophone", "anglophone"];
const SEEDED_PRIZE_CODES: PrizeCode[] = ["SPECIAL", "EXC", "ENC"];

function buildRows() {
  const jsonPath = resolve(process.cwd(), "critères.json");
  const raw: RawFile = JSON.parse(readFileSync(jsonPath, "utf-8"));

  const criteriaRows: Database["public"]["Tables"]["criteria"]["Insert"][] =
    [];
  const niveauxSeen = new Map<string, { section: Section; code: string }>();

  for (const prize of Object.values(
    raw.criteres_selection_laureats_prix.prix
  )) {
    if (!SEEDED_PRIZE_CODES.includes(prize.code as PrizeCode)) continue; // EXC_PLUS handled at compute time, not seeded here

    for (const criterion of prize.criteres) {
      if (!criterion.niveau_depart) continue; // EXC_PLUS-shaped entries, skip defensively

      for (const section of SECTIONS) {
        const niveauDepart = criterion.niveau_depart[section];
        if (!niveauDepart) continue;

        const niveauAdmission = criterion.niveau_admission?.[section] ?? null;

        niveauxSeen.set(`${section}:${niveauDepart}`, {
          section,
          code: niveauDepart,
        });
        if (niveauAdmission) {
          niveauxSeen.set(`${section}:${niveauAdmission}`, {
            section,
            code: niveauAdmission,
          });
        }

        const branches = parseCondition(criterion.intervalle_moyenne ?? null);
        for (const branch of branches) {
          criteriaRows.push({
            prize_code: prize.code as PrizeCode,
            section,
            niveau_depart: niveauDepart,
            niveau_admission: niveauAdmission,
            moyenne_min: branch.moyenne_min,
            moyenne_max: branch.moyenne_max,
            moyenne_max_inclusive: branch.moyenne_max_inclusive,
            rang_max: branch.rang_max,
            auto_qualify: branch.auto_qualify,
            requires_manual_review: branch.requires_manual_review,
            condition_raw: branch.condition_raw,
          });
        }
      }
    }
  }

  const niveauxRows: Database["public"]["Tables"]["niveaux"]["Insert"][] = [];
  for (const { section, code } of niveauxSeen.values()) {
    const order = NIVEAU_ORDER[section][code];
    if (order === undefined) {
      console.warn(
        `[criteria-seed] Pas d'ordre de progression défini pour "${code}" (${section}) — ajouter dans NIVEAU_ORDER.`
      );
    }
    niveauxRows.push({
      section,
      code,
      progression_order: order ?? 99,
    });
  }

  return { criteriaRows, niveauxRows };
}

function printSummary(
  criteriaRows: Database["public"]["Tables"]["criteria"]["Insert"][]
) {
  const total = criteriaRows.length;
  const autoQualify = criteriaRows.filter((r) => r.auto_qualify).length;
  const manualReview = criteriaRows.filter(
    (r) => r.requires_manual_review
  ).length;
  const threshold = total - autoQualify - manualReview;

  console.log(`\n--- Résumé de la classification (${total} lignes) ---`);
  console.log(`  Seuil calculable automatiquement : ${threshold}`);
  console.log(`  Automatique (pas de condition)    : ${autoQualify}`);
  console.log(`  À vérifier manuellement            : ${manualReview}`);

  if (manualReview > 0) {
    console.log(`\nLignes nécessitant une vérification manuelle :`);
    for (const row of criteriaRows) {
      if (row.requires_manual_review) {
        console.log(
          `  - [${row.prize_code}/${row.section}] ${row.niveau_depart} -> ${
            row.niveau_admission ?? "(fin)"
          } : "${row.condition_raw}"`
        );
      }
    }
  }
  console.log("");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { criteriaRows, niveauxRows } = buildRows();

  printSummary(criteriaRows);
  console.log(`${niveauxRows.length} niveaux distincts collectés.`);

  if (dryRun) {
    console.log("Mode --dry-run : aucune écriture en base.");
    return;
  }

  const { createServiceClient } = await import("../supabase/service");
  const supabase = createServiceClient();

  const { error: niveauxError } = await supabase
    .from("niveaux")
    .upsert(niveauxRows, { onConflict: "section,code" });
  if (niveauxError) throw niveauxError;
  console.log(`niveaux : ${niveauxRows.length} lignes insérées/mises à jour.`);

  const { error: criteriaError } = await supabase
    .from("criteria")
    .insert(criteriaRows);
  if (criteriaError) throw criteriaError;
  console.log(`criteria : ${criteriaRows.length} lignes insérées.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
