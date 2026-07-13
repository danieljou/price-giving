"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findExistingStudent } from "@/lib/students/duplicate";
import { computeAwardedPrizes } from "../../results/compute-helpers";
import type { Section } from "@/lib/supabase/types";

export interface ImportRowInput {
  first_name: string;
  last_name: string;
  section: Section;
  school_year_id: string;
  niveau_depart: string;
  niveau_admission: string | null;
  classe_texte: string | null;
  moyenne: number | null;
  rang: number | null;
}

export interface ImportSummary {
  studentsCreated: number;
  resultsCreated: number;
  resultsUpdated: number;
  rowErrors: string[];
}

interface CachedStudent {
  id: string;
  first_name: string;
  last_name: string;
  section: Section;
}

/**
 * Bulk-creates/updates students + results from a validated import batch.
 * Students are matched by normalized name+section (see duplicate.ts) rather
 * than created fresh every time, so re-importing the same file is safe.
 */
export async function importRows(
  rowsInput: ImportRowInput[]
): Promise<ImportSummary> {
  const supabase = await createClient();

  let studentsCreated = 0;
  let resultsCreated = 0;
  let resultsUpdated = 0;
  const rowErrors: string[] = [];

  const studentsBySection = new Map<Section, CachedStudent[]>();

  for (const row of rowsInput) {
    const rowLabel = `${row.last_name} ${row.first_name}`;
    try {
      let sectionStudents = studentsBySection.get(row.section);
      if (!sectionStudents) {
        const { data } = await supabase
          .from("students")
          .select("id, first_name, last_name, section")
          .eq("section", row.section);
        sectionStudents = data ?? [];
        studentsBySection.set(row.section, sectionStudents);
      }

      let studentId: string;
      const existingStudent = findExistingStudent(row, sectionStudents);
      if (existingStudent) {
        studentId = existingStudent.id;
      } else {
        const { data: created, error } = await supabase
          .from("students")
          .insert({
            first_name: row.first_name,
            last_name: row.last_name,
            section: row.section,
          })
          .select("id, first_name, last_name, section")
          .single();
        if (error || !created) {
          rowErrors.push(`${rowLabel} : échec de la création de l'étudiant.`);
          continue;
        }
        studentId = created.id;
        sectionStudents.push(created);
        studentsCreated++;
      }

      const { awarded_prizes, criteria_computed_at, manualReviewNotes } =
        await computeAwardedPrizes(supabase, {
          studentId,
          schoolYearId: row.school_year_id,
          section: row.section,
          niveauDepart: row.niveau_depart,
          niveauAdmission: row.niveau_admission,
          moyenne: row.moyenne,
          rang: row.rang,
        });

      const { data: existingResult } = await supabase
        .from("results")
        .select("id")
        .eq("student_id", studentId)
        .eq("school_year_id", row.school_year_id)
        .maybeSingle();

      const resultPayload = {
        section: row.section,
        niveau_depart: row.niveau_depart,
        niveau_admission: row.niveau_admission,
        classe_texte: row.classe_texte,
        moyenne: row.moyenne,
        rang: row.rang,
        awarded_prizes,
        manual_review_notes: manualReviewNotes,
        criteria_computed_at,
      };

      if (existingResult) {
        const { error } = await supabase
          .from("results")
          .update(resultPayload)
          .eq("id", existingResult.id);
        if (error) {
          rowErrors.push(`${rowLabel} : échec de la mise à jour du résultat.`);
          continue;
        }
        resultsUpdated++;
      } else {
        const { error } = await supabase.from("results").insert({
          student_id: studentId,
          school_year_id: row.school_year_id,
          ...resultPayload,
        });
        if (error) {
          rowErrors.push(`${rowLabel} : échec de l'enregistrement du résultat.`);
          continue;
        }
        resultsCreated++;
      }
    } catch {
      rowErrors.push(`${rowLabel} : erreur inattendue, ligne ignorée.`);
    }
  }

  revalidatePath("/students");
  revalidatePath("/laureates");
  revalidatePath("/dashboard");
  revalidatePath("/review");

  return { studentsCreated, resultsCreated, resultsUpdated, rowErrors };
}
