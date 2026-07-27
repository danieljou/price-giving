import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { studentResultColumns, type StudentResultRow } from "./columns";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, last_name, section, date_of_birth")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: results } = await supabase
    .from("results")
    .select(
      "id, moyenne, rang, niveau_depart, niveau_admission, classe_texte, awarded_prizes, notes, school_years(label, start_year)"
    )
    .eq("student_id", id)
    .order("school_years(start_year)", { ascending: false });

  const rows: StudentResultRow[] = (results ?? []).map((r) => {
    const schoolYear = Array.isArray(r.school_years)
      ? r.school_years[0]
      : r.school_years;
    return {
      id: r.id,
      moyenne: r.moyenne,
      rang: r.rang,
      niveau_depart: r.niveau_depart,
      niveau_admission: r.niveau_admission,
      classe_texte: r.classe_texte,
      awarded_prizes: r.awarded_prizes,
      notes: r.notes,
      school_year_label: schoolYear?.label ?? "—",
    };
  });

  const initials =
    `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();
  const totalPrizes = rows.reduce(
    (acc, r) => acc + r.awarded_prizes.length,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link href="/students">
            <ArrowLeft />
            Étudiants
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 border border-border">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {student.first_name} {student.last_name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {student.section}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {rows.length} résultat{rows.length > 1 ? "s" : ""} ·{" "}
                  {totalPrizes} prix
                </span>
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href={`/results/new?studentId=${student.id}`}>
              <ClipboardPlus />
              Saisir un résultat
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={studentResultColumns}
        data={rows}
        pagination={false}
      />
    </div>
  );
}
