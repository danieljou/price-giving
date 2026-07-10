"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
