import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createResult } from "../actions";
import { ResultForm } from "../result-form";

export default async function NewResultPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const supabase = await createClient();

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

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Saisir un résultat</CardTitle>
        </CardHeader>
        <CardContent>
          <ResultForm
            action={createResult}
            students={students ?? []}
            schoolYears={schoolYears ?? []}
            niveaux={niveaux ?? []}
            defaultStudentId={studentId}
            submitLabel="Enregistrer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
