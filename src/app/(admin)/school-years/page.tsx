import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { schoolYearColumns } from "./columns";
import { SchoolYearForm } from "./school-year-form";

export default async function SchoolYearsPage() {
  const supabase = await createClient();
  const { data: schoolYears } = await supabase
    .from("school_years")
    .select("id, label, start_year")
    .order("start_year", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-foreground">
        Années scolaires
      </h1>

      <DataTable
        columns={schoolYearColumns}
        data={schoolYears ?? []}
        pagination={false}
      />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Ajouter une année scolaire</CardTitle>
        </CardHeader>
        <CardContent>
          <SchoolYearForm />
        </CardContent>
      </Card>
    </div>
  );
}
