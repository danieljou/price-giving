import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import type { PrizeCode } from "@/lib/supabase/types";
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
  awarded_prizes: string[];
  students: StudentRow | StudentRow[] | null;
  school_years: SchoolYearRow | SchoolYearRow[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function ReviewPage() {
  const supabase = await createClient();

  // Only results with zero automatic prize belong here — a student who
  // already got something automatically (even if a *different* prize on the
  // same result is flagged for manual review) doesn't need to go through
  // deliberation again.
  const { data } = await supabase
    .from("results")
    .select(
      "id, section, niveau_depart, niveau_admission, manual_review_notes, awarded_prizes, students(first_name, last_name), school_years(label)"
    )
    .eq("manual_review_resolved", false)
    // Must be the Postgres empty-array literal as a string, not a JS `[]` —
    // supabase-js's .eq() stringifies the value via template interpolation
    // (`eq.${value}`), and `[].toString()` is `""`, not `"{}"`, so passing a
    // JS array here silently matched nothing and the queue always looked
    // empty even when the laureates page (which filters client-side on the
    // real array) showed pending rows. .filter() is used instead of .eq()
    // because the generated Database types type the column as PrizeCode[]
    // and reject a string literal even though it's what PostgREST needs.
    .filter("awarded_prizes", "eq", "{}");

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
        awarded_prizes: r.awarded_prizes as PrizeCode[],
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
        searchKey="student_name"
        searchPlaceholder="Rechercher un étudiant..."
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
