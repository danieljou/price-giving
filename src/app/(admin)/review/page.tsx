import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { reviewColumns, type ReviewRow } from "./columns";

interface StudentRow {
  first_name: string;
  last_name: string;
}

interface SchoolYearRow {
  label: string;
}

interface ResultRow {
  id: string;
  section: string;
  niveau_depart: string;
  niveau_admission: string | null;
  manual_review_notes: string[];
  students: StudentRow | StudentRow[] | null;
  school_years: SchoolYearRow | SchoolYearRow[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("results")
    .select(
      "id, section, niveau_depart, niveau_admission, manual_review_notes, students(first_name, last_name), school_years(label)"
    )
    .not("manual_review_notes", "eq", "{}");

  const rows: ReviewRow[] = ((data ?? []) as unknown as ResultRow[]).map(
    (r) => {
      const student = one(r.students);
      const schoolYear = one(r.school_years);
      return {
        id: r.id,
        student_name: student
          ? `${student.last_name} ${student.first_name}`
          : "—",
        section: r.section,
        school_year_label: schoolYear?.label ?? "—",
        niveau_depart: r.niveau_depart,
        niveau_admission: r.niveau_admission,
        notes: r.manual_review_notes,
      };
    }
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vérification manuelle"
        description="Résultats dont le prix dépend d'une condition non automatisable (examen, concours...) — à trancher au cas par cas"
      />
      <DataTable
        columns={reviewColumns}
        data={rows}
        emptyContent={
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Aucune vérification en attente
            </p>
            <p className="text-sm text-muted-foreground">
              Les résultats nécessitant une décision manuelle apparaîtront ici.
            </p>
          </div>
        }
      />
    </div>
  );
}
