import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { niveauRank } from "@/lib/prizes/niveau-order";
import { niveauColumns, type NiveauRow } from "./columns";
import { NiveauForm } from "./niveau-form";

export default async function NiveauxPage() {
  const supabase = await createClient();
  const { data: niveaux } = await supabase
    .from("niveaux")
    .select("id, section, code, progression_order");

  const rows: NiveauRow[] = (niveaux ?? []).sort(
    (a, b) =>
      a.section.localeCompare(b.section) ||
      niveauRank(a.code) - niveauRank(b.code) ||
      a.progression_order - b.progression_order
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Niveaux"
        description="Grades/classes disponibles par section — utilisés dans la saisie des résultats et les critères d'attribution."
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            columns={niveauColumns}
            data={rows}
            pageSize={15}
            showViewOptions
            searchKey="code"
            searchPlaceholder="Rechercher un niveau..."
            filterFields={[
              {
                columnId: "section",
                title: "Section",
                options: [
                  { label: "Francophone", value: "francophone" },
                  { label: "Anglophone", value: "anglophone" },
                ],
              },
            ]}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ajouter un niveau</CardTitle>
          </CardHeader>
          <CardContent>
            <NiveauForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
