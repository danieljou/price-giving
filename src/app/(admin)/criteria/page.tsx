import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { niveauRank } from "@/lib/prizes/niveau-order";
import { criteriaColumns, type CriterionRow } from "./columns";
import { CriterionCreateDialog } from "./criterion-create-dialog";

export default async function CriteriaPage() {
  const supabase = await createClient();
  const [{ data: criteria }, { data: niveaux }] = await Promise.all([
    supabase
      .from("criteria")
      .select(
        "id, prize_code, section, niveau_depart, niveau_admission, moyenne_min, moyenne_max, moyenne_max_inclusive, rang_max, auto_qualify, requires_manual_review, condition_raw"
      ),
    supabase.from("niveaux").select("section, code"),
  ]);

  const rows: CriterionRow[] = (criteria ?? []).sort(
    (a, b) =>
      a.prize_code.localeCompare(b.prize_code) ||
      a.section.localeCompare(b.section) ||
      niveauRank(a.niveau_depart) - niveauRank(b.niveau_depart)
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Critères d'attribution"
        description="Référentiel officiel des conditions par prix, section et niveau — modifiable ligne par ligne. Après une modification, recalculez l'année en cours depuis la page Lauréats."
      >
        <CriterionCreateDialog niveaux={niveaux ?? []} />
      </PageHeader>
      <DataTable
        columns={criteriaColumns}
        data={rows}
        pageSize={15}
        showViewOptions
        filterFields={[
          {
            columnId: "prize_code",
            title: "Prix",
            options: [
              { label: "Prix Spécial", value: "SPECIAL" },
              { label: "Excellence", value: "EXC" },
              { label: "Encouragement", value: "ENC" },
            ],
          },
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
  );
}
