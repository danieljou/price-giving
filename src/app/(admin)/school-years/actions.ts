"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { schoolYearSchema } from "./schema";

export interface SchoolYearFormState {
  error?: string;
}

export async function createSchoolYear(
  formData: FormData
): Promise<SchoolYearFormState> {
  const parsed = schoolYearSchema.safeParse({
    label: formData.get("label"),
    start_year: formData.get("start_year"),
  });

  if (!parsed.success) {
    return { error: "Libellé et année de début requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("school_years").insert({
    label: parsed.data.label,
    start_year: Number(parsed.data.start_year),
  });

  if (error) {
    return { error: "Cette année scolaire existe déjà." };
  }

  revalidatePath("/school-years");
  return {};
}
