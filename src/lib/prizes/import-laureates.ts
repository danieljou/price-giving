/**
 * One-shot import: loads a laureates JSON file (produced by
 * scripts/extract_laureates_2025.py) and writes the school year, students
 * (matched by first/last name + section, created if not found), and results
 * (with awarded_prizes taken directly from the source ceremony list — these
 * are the school's official, already-decided laureates, not recomputed).
 *
 * Usage:
 *   npx tsx src/lib/prizes/import-laureates.ts data/laureates-2024-2025.json --dry-run
 *   npx tsx src/lib/prizes/import-laureates.ts data/laureates-2024-2025.json
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PrizeCode, Section } from "../supabase/types";

interface LaureateRecord {
  name: string;
  section: Section;
  niveau_depart: string | null;
  niveau_admission: string | null;
  moyenne: number | null;
  rang: number | null;
  prizes: PrizeCode[];
}

interface LaureatesFile {
  school_year: string;
  start_year: number;
  laureates: LaureateRecord[];
}

function splitName(fullName: string): { first_name: string; last_name: string } {
  const tokens = fullName.split(/\s+/).filter(Boolean);
  const isUpper = (t: string) => t === t.toUpperCase() && /[A-ZÀ-Ý]/.test(t);
  const firstMixedIdx = tokens.findIndex((t) => !isUpper(t));

  if (firstMixedIdx !== -1) {
    return {
      last_name: tokens.slice(0, firstMixedIdx).join(" "),
      first_name: tokens.slice(firstMixedIdx).join(" "),
    };
  }
  if (tokens.length > 1) {
    return {
      last_name: tokens.slice(0, -1).join(" "),
      first_name: tokens[tokens.length - 1],
    };
  }
  return { last_name: tokens[0] ?? fullName, first_name: "" };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find(
    (a) => a.endsWith(".json") && !a.includes("node_modules")
  );
  if (!fileArg) {
    throw new Error("Usage: import-laureates.ts <path-to.json> [--dry-run]");
  }

  const filePath = resolve(process.cwd(), fileArg);
  const file: LaureatesFile = JSON.parse(readFileSync(filePath, "utf-8"));

  const records = file.laureates.map((l) => ({ ...l, ...splitName(l.name) }));

  console.log(
    `${records.length} étudiants à importer pour l'année ${file.school_year}.`
  );
  const withoutNiveau = records.filter((r) => !r.niveau_depart);
  if (withoutNiveau.length > 0) {
    console.log(
      `${withoutNiveau.length} lignes sans niveau de départ seront ignorées :`,
      withoutNiveau.map((r) => r.name)
    );
  }

  if (dryRun) {
    console.log("\nAperçu des 5 premiers enregistrements :");
    console.log(JSON.stringify(records.slice(0, 5), null, 2));
    console.log("\nMode --dry-run : aucune écriture en base.");
    return;
  }

  const { createServiceClient } = await import("../supabase/service");
  const supabase = createServiceClient();

  const { data: schoolYear, error: syError } = await supabase
    .from("school_years")
    .upsert(
      { label: file.school_year, start_year: file.start_year },
      { onConflict: "label" }
    )
    .select("id")
    .single();

  if (syError || !schoolYear) {
    throw syError ?? new Error("Impossible de créer/trouver l'année scolaire.");
  }

  let studentsCreated = 0;
  let studentsMatched = 0;
  let resultsCreated = 0;
  let resultsSkipped = 0;
  const skippedNames: string[] = [];

  for (const r of records) {
    if (!r.niveau_depart) {
      resultsSkipped++;
      skippedNames.push(r.name);
      continue;
    }

    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("first_name", r.first_name)
      .eq("last_name", r.last_name)
      .eq("section", r.section)
      .maybeSingle();

    let studentId: string;
    if (existingStudent) {
      studentId = existingStudent.id;
      studentsMatched++;
    } else {
      const { data: inserted, error } = await supabase
        .from("students")
        .insert({
          first_name: r.first_name,
          last_name: r.last_name,
          section: r.section,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        console.error(`Erreur création étudiant "${r.name}":`, error?.message);
        continue;
      }
      studentId = inserted.id;
      studentsCreated++;
    }

    const { error: resultError } = await supabase.from("results").upsert(
      {
        student_id: studentId,
        school_year_id: schoolYear.id,
        section: r.section,
        niveau_depart: r.niveau_depart,
        niveau_admission: r.niveau_admission,
        moyenne: r.moyenne,
        rang: r.rang,
        awarded_prizes: r.prizes,
        criteria_computed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,school_year_id" }
    );

    if (resultError) {
      console.error(`Erreur création résultat pour "${r.name}":`, resultError.message);
      continue;
    }
    resultsCreated++;
  }

  console.log("\n--- Résumé ---");
  console.log(`Étudiants créés     : ${studentsCreated}`);
  console.log(`Étudiants existants : ${studentsMatched}`);
  console.log(`Résultats importés  : ${resultsCreated}`);
  console.log(`Lignes ignorées     : ${resultsSkipped}`, skippedNames);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
