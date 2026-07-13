"use server";

import { createClient } from "@/lib/supabase/server";
import type { Section } from "@/lib/supabase/types";

export interface StudentSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  section: Section;
}

/** Global search (Cmd/Ctrl+K): matches a student by first or last name. */
export async function searchStudents(
  query: string
): Promise<StudentSearchResult[]> {
  // Strip anything that could break PostgREST's .or() filter syntax
  // (commas, parens, wildcards) — only letters/accents/spaces/hyphens remain.
  const safe = query.replace(/[^\p{L}\s-]/gu, "").trim();
  if (safe.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, section")
    .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%`)
    .order("last_name")
    .limit(8);

  return data ?? [];
}
