import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

function countBy<T>(
  items: T[],
  key: (item: T) => string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function StatCard({
  title,
  rows,
}: Readonly<{ title: string; rows: [string, number][] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-2">
          {rows.map(([label, count]) => (
            <div
              key={label}
              className="flex items-center justify-between text-sm"
            >
              <dt className="text-foreground">{label}</dt>
              <dd className="font-mono font-semibold text-foreground">
                {count}
              </dd>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune donnée.</p>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

interface ResultWithYear {
  section: string;
  niveau_depart: string;
  awarded_prizes: string[];
  school_years: { label: string } | { label: string }[] | null;
}

function yearLabel(schoolYears: ResultWithYear["school_years"]): string {
  const year = Array.isArray(schoolYears) ? schoolYears[0] : schoolYears;
  return year?.label ?? "—";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: results } = await supabase
    .from("results")
    .select("section, niveau_depart, awarded_prizes, school_years(label)");

  const rows = (results ?? []) as unknown as ResultWithYear[];
  const laureateRows = rows.filter((r) => r.awarded_prizes.length > 0);

  const prizeCounts = countBy(
    laureateRows.flatMap((r) => r.awarded_prizes.map((code) => code)),
    (code) => code
  );
  const sectionCounts = countBy(laureateRows, (r) => r.section);
  const niveauCounts = countBy(laureateRows, (r) => r.niveau_depart);
  const yearCounts = countBy(laureateRows, (r) => yearLabel(r.school_years));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-foreground">
        Tableau de bord
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Résultats saisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold text-foreground">
              {rows.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lauréats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold text-foreground">
              {laureateRows.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Par prix"
          rows={[...prizeCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([code, count]) => [PRIZE_LABELS[code] ?? code, count])}
        />
        <StatCard
          title="Par section"
          rows={[...sectionCounts.entries()].sort((a, b) => b[1] - a[1])}
        />
        <StatCard
          title="Par année scolaire"
          rows={[...yearCounts.entries()].sort((a, b) => b[1] - a[1])}
        />
        <StatCard
          title="Par niveau de départ"
          rows={[...niveauCounts.entries()].sort((a, b) => b[1] - a[1])}
        />
      </div>
    </div>
  );
}
