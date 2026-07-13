import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import type { Section } from "@/lib/supabase/types";
import { ImportForm } from "./import-form";

export default async function ImportStudentsPage() {
  const supabase = await createClient();

  const [{ data: schoolYears }, { data: niveaux }, { data: students }] =
    await Promise.all([
      supabase
        .from("school_years")
        .select("id, label")
        .order("start_year", { ascending: false }),
      supabase.from("niveaux").select("section, code"),
      supabase.from("students").select("id, first_name, last_name, section"),
    ]);

  const niveauxBySection: Record<Section, string[]> = {
    francophone: [],
    anglophone: [],
  };
  for (const n of niveaux ?? []) {
    niveauxBySection[n.section].push(n.code);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Import en masse"
        description="Créez ou mettez à jour plusieurs étudiants et résultats à partir d'un fichier Excel/CSV"
      />
      <ImportForm
        schoolYears={schoolYears ?? []}
        niveauxBySection={niveauxBySection}
        existingStudents={students ?? []}
      />
    </div>
  );
}
