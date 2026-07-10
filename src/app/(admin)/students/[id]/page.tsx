import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
      "id, moyenne, rang, niveau_depart, niveau_admission, awarded_prizes, school_years(label, start_year)"
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
      awarded_prizes: r.awarded_prizes,
      school_year_label: schoolYear?.label ?? "—",
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm capitalize text-muted-foreground">
            {student.section}
          </p>
        </div>
        <Button asChild>
          <Link href={`/results/new?studentId=${student.id}`}>
            <ClipboardPlus />
            Saisir un résultat
          </Link>
        </Button>
      </div>

      <DataTable
        columns={studentResultColumns}
        data={rows}
        pagination={false}
      />
    </div>
  );
}
