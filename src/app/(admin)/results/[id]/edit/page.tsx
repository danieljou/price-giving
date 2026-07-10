import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      "id, student_id, school_year_id, section, niveau_depart, niveau_admission, moyenne, rang"
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
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Modifier le résultat</CardTitle>
        </CardHeader>
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
              moyenne: result.moyenne != null ? String(result.moyenne) : "",
              rang: result.rang != null ? String(result.rang) : undefined,
            }}
            submitLabel="Mettre à jour"
          />
        </CardContent>
      </Card>
    </div>
  );
}
