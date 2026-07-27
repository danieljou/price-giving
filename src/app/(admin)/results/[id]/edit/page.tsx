import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { updateResult } from "../../actions";
import { ResultForm } from "../../result-form";

export default async function EditResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: result } = await supabase
    .from("results")
    .select(
      "id, student_id, school_year_id, section, niveau_depart, niveau_admission, classe_texte, moyenne, rang, notes"
    )
    .eq("id", id)
    .single();

  if (!result) notFound();

  const [{ data: students }, { data: schoolYears }, { data: niveaux }] =
    await Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, section")
        .order("last_name"),
      supabase
        .from("school_years")
        .select("id, label")
        .order("start_year", { ascending: false }),
      supabase.from("niveaux").select("section, code, progression_order"),
    ]);

  const boundUpdateResult = updateResult.bind(null, result.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Modifier le résultat"
        description="Le prix sera recalculé automatiquement à la mise à jour"
      />
      <Card>
        <CardContent>
          <ResultForm
            action={boundUpdateResult}
            students={students ?? []}
            schoolYears={schoolYears ?? []}
            niveaux={niveaux ?? []}
            defaultStudentId={result.student_id}
            defaultValues={{
              school_year_id: result.school_year_id,
              section: result.section,
              niveau_depart: result.niveau_depart,
              niveau_admission: result.niveau_admission ?? undefined,
              classe_texte: result.classe_texte ?? undefined,
              moyenne: result.moyenne != null ? String(result.moyenne) : "",
              rang: result.rang != null ? String(result.rang) : undefined,
              notes: result.notes ?? undefined,
            }}
            submitLabel="Mettre à jour"
          />
        </CardContent>
      </Card>
    </div>
  );
}
