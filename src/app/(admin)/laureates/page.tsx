import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { pickDefaultSchoolYear } from "@/lib/school-year";
import type { Section } from "@/lib/supabase/types";
import { recomputeYear } from "../results/actions";
import { laureateColumns, type LaureateRow } from "./columns";
import { ExportMenu } from "./export-menu";
import { LaureatesFilters } from "./laureates-filters";
import { SummaryTable } from "./summary-table";

interface SchoolYearRow {
  label: string;
  start_year: number;
}

interface StudentRow {
  first_name: string;
  last_name: string;
}

interface ResultRow {
  id: string;
  niveau_depart: string;
  niveau_admission: string | null;
  classe_texte: string | null;
  moyenne: number;
  rang: number | null;
  awarded_prizes: string[];
  manual_review_notes: string[];
  notes: string | null;
  section: string;
  students: StudentRow | StudentRow[] | null;
  school_years: SchoolYearRow | SchoolYearRow[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function LaureatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    section?: string;
    prize?: string;
    niveau?: string;
  }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  const { data: schoolYears } = await supabase
    .from("school_years")
    .select("id, label, start_year")
    .order("start_year", { ascending: false });

  const { data: niveauxData } = await supabase
    .from("niveaux")
    .select("section, code, progression_order")
    .order("progression_order");

  const niveauxBySection: Record<Section, string[]> = {
    francophone: [],
    anglophone: [],
  };
  for (const n of niveauxData ?? []) {
    niveauxBySection[n.section].push(n.code);
  }

  // Default view: the current academic year (or the latest available).
  // "all" is the explicit opt-out carried in the URL.
  const defaultYearId = pickDefaultSchoolYear(schoolYears ?? [])?.id;
  let effectiveYear: string | undefined;
  if (filters.year === "all") {
    effectiveYear = undefined;
  } else {
    effectiveYear = filters.year ?? defaultYearId;
  }

  let query = supabase
    .from("results")
    .select(
      "id, niveau_depart, niveau_admission, classe_texte, moyenne, rang, awarded_prizes, manual_review_notes, notes, section, students(first_name, last_name), school_years!inner(label, start_year)"
    );

  if (effectiveYear) query = query.eq("school_year_id", effectiveYear);
  if (filters.section === "francophone" || filters.section === "anglophone") {
    query = query.eq("section", filters.section);
  }
  if (filters.niveau) query = query.eq("niveau_depart", filters.niveau);
  if (filters.prize === "PENDING") {
    query = query
      .eq("awarded_prizes", [])
      .not("manual_review_notes", "eq", "{}");
  } else if (filters.prize) {
    query = query.contains("awarded_prizes", [filters.prize]);
  }

  const { data: results } = await query.order("niveau_depart");

  const rows: LaureateRow[] = ((results ?? []) as unknown as ResultRow[]).map(
    (r) => {
      const student = one(r.students);
      const schoolYear = one(r.school_years);
      return {
        id: r.id,
        niveau_depart: r.niveau_depart,
        niveau_admission: r.niveau_admission,
        classe_texte: r.classe_texte,
        moyenne: r.moyenne,
        rang: r.rang,
        awarded_prizes: r.awarded_prizes,
        pending_review: r.awarded_prizes.length === 0 && r.manual_review_notes.length > 0,
        notes: r.notes,
        section: r.section,
        student_name: student
          ? `${student.last_name} ${student.first_name}`
          : "—",
        school_year_label: schoolYear?.label ?? "—",
      };
    }
  );

  const yearToRecompute = effectiveYear;
  const recomputeCurrentYear = yearToRecompute
    ? async () => {
        "use server";
        await recomputeYear(yearToRecompute);
      }
    : undefined;

  const scopeLabel = effectiveYear
    ? (schoolYears?.find((y) => y.id === effectiveYear)?.label ?? "filtré")
    : "toutes-années";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lauréats"
        description={`${rows.length} résultat${rows.length > 1 ? "s" : ""} pour les filtres actuels`}
      >
        {recomputeCurrentYear && (
          <form action={recomputeCurrentYear}>
            <Button type="submit" variant="ghost" size="sm">
              <RefreshCw />
              Recalculer cette année
            </Button>
          </form>
        )}
        <ExportMenu rows={rows} scopeLabel={scopeLabel} />
      </PageHeader>

      <LaureatesFilters
        schoolYears={schoolYears ?? []}
        niveauxBySection={niveauxBySection}
        effectiveYear={effectiveYear}
        filters={filters}
      />

      <SummaryTable rows={rows} />

      <DataTable
        columns={laureateColumns}
        data={rows}
        emptyContent={
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Aucun lauréat pour ces filtres
            </p>
            <p className="text-sm text-muted-foreground">
              Modifiez les filtres ou saisissez de nouveaux résultats.
            </p>
          </div>
        }
      />
    </div>
  );
}
