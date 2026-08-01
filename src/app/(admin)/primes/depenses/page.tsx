import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { pickDefaultSchoolYear } from "@/lib/school-year";
import { formatMontant } from "@/lib/primes/format";
import { AuditHistory } from "@/components/audit-history";
import { depenseColumns, type DepenseRow } from "./columns";
import { DepenseFormDialog } from "./depense-form-dialog";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function DepensesPage({ searchParams }: Readonly<PageProps>) {
  const filters = await searchParams;
  const supabase = await createClient();

  const { data: schoolYears } = await supabase
    .from("school_years")
    .select("id, label, start_year")
    .order("start_year", { ascending: false });

  const years = schoolYears ?? [];
  const sessionId = filters.session ?? pickDefaultSchoolYear(years)?.id;

  let rows: DepenseRow[] = [];
  if (sessionId) {
    const { data } = await supabase
      .from("depenses_complementaires")
      .select("id, libelle, categorie, description, montant, observation")
      .eq("session_id", sessionId)
      .order("categorie");
    rows = (data ?? []).map((d) => ({
      ...d,
      history: <AuditHistory entityType="depense" entityId={d.id} />,
    }));
  }

  const categories = [...new Set(rows.map((d) => d.categorie))].sort();
  const total = rows.reduce((sum, d) => sum + d.montant, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dépenses complémentaires"
        description="Dépenses non directement liées aux primes, intégrées automatiquement au budget global de la session."
      >
        {sessionId && <DepenseFormDialog sessionId={sessionId} />}
      </PageHeader>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <Select name="session" defaultValue={sessionId ?? ""}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Session académique" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Afficher</Button>
      </form>

      {!sessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Créez d&apos;abord une année scolaire.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="w-fit">
            <CardContent className="flex items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                Total des dépenses
              </p>
              <p className="font-mono text-xl font-semibold text-foreground">
                {formatMontant(total)}
              </p>
            </CardContent>
          </Card>

          <DataTable
            columns={depenseColumns}
            data={rows}
            pageSize={15}
            searchKey="libelle"
            searchPlaceholder="Rechercher une dépense..."
            filterFields={[
              {
                columnId: "categorie",
                title: "Catégorie",
                options: categories.map((c) => ({ label: c, value: c })),
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
