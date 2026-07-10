import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title="Années scolaires"
        description="Les années servent de référence aux résultats et au calcul Excellence+"
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            columns={schoolYearColumns}
            data={schoolYears ?? []}
            pagination={false}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ajouter une année scolaire</CardTitle>
          </CardHeader>
          <CardContent>
            <SchoolYearForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
