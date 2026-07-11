import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { pickDefaultSchoolYear } from "@/lib/school-year";
import { recomputeYear } from "../results/actions";
import { laureateColumns, type LaureateRow } from "./columns";
import { ExportMenu } from "./export-menu";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

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
      "id, niveau_depart, niveau_admission, classe_texte, moyenne, rang, awarded_prizes, section, students(first_name, last_name), school_years!inner(label, start_year)"
    )
    .not("awarded_prizes", "eq", "{}");

  if (effectiveYear) query = query.eq("school_year_id", effectiveYear);
  if (filters.section === "francophone" || filters.section === "anglophone") {
    query = query.eq("section", filters.section);
  }
  if (filters.niveau) query = query.eq("niveau_depart", filters.niveau);
  if (filters.prize) query = query.contains("awarded_prizes", [filters.prize]);

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
        description={`${rows.length} lauréat${rows.length > 1 ? "s" : ""} pour les filtres actuels`}
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

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <Select name="year" defaultValue={effectiveYear ?? "all"}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {schoolYears?.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select name="section" defaultValue={filters.section ?? ""}>
          <SelectTrigger className="w-42.5">
            <SelectValue placeholder="Toutes les sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="francophone">Francophone</SelectItem>
            <SelectItem value="anglophone">Anglophone</SelectItem>
          </SelectContent>
        </Select>

        <Select name="prize" defaultValue={filters.prize ?? ""}>
          <SelectTrigger className="w-42.5">
            <SelectValue placeholder="Tous les prix" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRIZE_LABELS).map(([code, label]) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          name="niveau"
          placeholder="Niveau de départ"
          defaultValue={filters.niveau ?? ""}
          className="w-45"
        />

        <Button type="submit">Filtrer</Button>
        {(filters.year ||
          filters.section ||
          filters.prize ||
          filters.niveau) && (
          <Button variant="ghost" asChild>
            <Link href="/laureates">Réinitialiser</Link>
          </Button>
        )}
      </form>

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
