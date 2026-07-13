"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findExistingStudent } from "@/lib/students/duplicate";
import { studentSchema } from "./schema";

export interface StudentFormState {
  error?: string;
}

export async function createStudent(
  formData: FormData
): Promise<StudentFormState> {
  const parsed = studentSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    section: formData.get("section"),
    date_of_birth: formData.get("date_of_birth") || undefined,
  });

  if (!parsed.success) {
    return { error: "Champs invalides." };
  }

  const supabase = await createClient();

  const { data: sameSection } = await supabase
    .from("students")
    .select("id, first_name, last_name, section")
    .eq("section", parsed.data.section);
  const duplicate = findExistingStudent(parsed.data, sameSection ?? []);
  if (duplicate) {
    return {
      error: `${duplicate.last_name} ${duplicate.first_name} existe déjà en section ${duplicate.section} — utilisez sa fiche existante plutôt que d'en créer une autre.`,
    };
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      section: parsed.data.section,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Erreur lors de la création de l'étudiant." };
  }

  revalidatePath("/students");
  redirect(`/students/${data.id}`);
}

export interface QuickCreateStudentState {
  error?: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    section: "francophone" | "anglophone";
  };
}

/** Inline creation from the result form's student combobox: returns the new
 *  student instead of redirecting so the caller can select it immediately. */
export async function quickCreateStudent(
  formData: FormData
): Promise<QuickCreateStudentState> {
  const parsed = studentSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    section: formData.get("section"),
    date_of_birth: undefined,
  });

  if (!parsed.success) {
    return { error: "Nom, prénom et section sont requis." };
  }

  const supabase = await createClient();

  const { data: sameSection } = await supabase
    .from("students")
    .select("id, first_name, last_name, section")
    .eq("section", parsed.data.section);
  const duplicate = findExistingStudent(parsed.data, sameSection ?? []);
  if (duplicate) {
    return {
      error: `${duplicate.last_name} ${duplicate.first_name} existe déjà en section ${duplicate.section} — sélectionnez-le dans la liste plutôt que d'en créer un autre.`,
    };
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      section: parsed.data.section,
    })
    .select("id, first_name, last_name, section")
    .single();

  if (error || !data) {
    return { error: "Erreur lors de la création de l'étudiant." };
  }

  revalidatePath("/students");
  return { student: data };
}
