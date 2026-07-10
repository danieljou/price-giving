import {
  Award,
  ClipboardList,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  NiveauBarChart,
  PrizeBarChart,
  SectionBarChart,
  YearStackedBarChart,
  type NiveauCount,
  type PrizeCount,
  type SectionCount,
  type YearPrizeRow,
} from "./charts";

interface ResultRow {
  student_id: string;
  section: string;
  niveau_depart: string;
  awarded_prizes: string[];
  school_years: { label: string; start_year: number } | { label: string; start_year: number }[] | null;
}

function yearOf(r: ResultRow): { label: string; start_year: number } | null {
  return Array.isArray(r.school_years)
    ? (r.school_years[0] ?? null)
    : r.school_years;
}

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

const KPI_TONES = {
  blue: "bg-blue-600/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400",
  amber:
    "bg-amber-600/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
  teal: "bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-400",
  violet:
    "bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400",
} as const;

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: Readonly<{
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof KPI_TONES;
}>) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${KPI_TONES[tone]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="mt-0.5 font-mono text-3xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            {hint}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: results } = await supabase
    .from("results")
    .select(
      "student_id, section, niveau_depart, awarded_prizes, school_years(label, start_year)"
    );

  const rows = (results ?? []) as unknown as ResultRow[];
  const laureates = rows.filter((r) => r.awarded_prizes.length > 0);
  const uniqueStudents = new Set(rows.map((r) => r.student_id)).size;
  const laureateRate =
    rows.length > 0 ? Math.round((laureates.length / rows.length) * 100) : 0;

  const prizeCounts: PrizeCount[] = [
    ...countBy(
      laureates.flatMap((r) => r.awarded_prizes),
      (code) => code
    ).entries(),
  ].map(([prize, count]) => ({ prize, count }));

  const sectionCounts: SectionCount[] = ["francophone", "anglophone"].map(
    (section) => ({
      section,
      count: laureates.filter((r) => r.section === section).length,
    })
  );

  const niveauCounts: NiveauCount[] = [
    ...countBy(laureates, (r) => r.niveau_depart).entries(),
  ].map(([niveau, count]) => ({ niveau, count }));

  const yearMap = new Map<string, YearPrizeRow & { start_year: number }>();
  for (const r of laureates) {
    const year = yearOf(r);
    if (!year) continue;
    const entry = yearMap.get(year.label) ?? {
      year: year.label,
      start_year: year.start_year,
      SPECIAL: 0,
      EXC: 0,
      ENC: 0,
      EXC_PLUS: 0,
    };
    for (const prize of r.awarded_prizes) {
      if (prize in entry && prize !== "year" && prize !== "start_year") {
        entry[prize as "SPECIAL" | "EXC" | "ENC" | "EXC_PLUS"]++;
      }
    }
    yearMap.set(year.label, entry);
  }
  const yearRows: YearPrizeRow[] = [...yearMap.values()]
    .sort((a, b) => a.start_year - b.start_year)
    .map((entry) => ({
      year: entry.year,
      SPECIAL: entry.SPECIAL,
      EXC: entry.EXC,
      ENC: entry.ENC,
      EXC_PLUS: entry.EXC_PLUS,
    }));

  const excellencePlusCount = laureates.filter((r) =>
    r.awarded_prizes.includes("EXC_PLUS")
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la classification des prix"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Étudiants"
          value={String(uniqueStudents)}
          hint="Étudiants avec au moins un résultat"
          icon={Users}
          tone="blue"
        />
        <KpiCard
          title="Résultats saisis"
          value={String(rows.length)}
          hint="Toutes années confondues"
          icon={ClipboardList}
          tone="teal"
        />
        <KpiCard
          title="Lauréats"
          value={String(laureates.length)}
          hint={`${laureateRate}% des résultats priment`}
          icon={Award}
          tone="amber"
        />
        <KpiCard
          title="Excellence+"
          value={String(excellencePlusCount)}
          hint="Excellence 2 années consécutives"
          icon={TrendingUp}
          tone="violet"
        />
      </div>

      {laureates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Award className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Aucun lauréat pour l&apos;instant
            </p>
            <p className="text-sm text-muted-foreground">
              Les graphiques apparaîtront dès que des résultats primés seront
              enregistrés.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PrizeBarChart data={prizeCounts} />
          <YearStackedBarChart data={yearRows} />
          <SectionBarChart data={sectionCounts} />
          <NiveauBarChart data={niveauCounts} />
        </div>
      )}
    </div>
  );
}
