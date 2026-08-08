import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { updateStudent } from "../../actions";
import { StudentForm } from "../../student-form";

export default async function EditStudentPage({
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

  const boundUpdateStudent = updateStudent.bind(null, student.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="Modifier l'étudiant"
        description={`${student.first_name} ${student.last_name}`}
      />
      <Card>
        <CardContent>
          <StudentForm
            action={boundUpdateStudent}
            defaultValues={{
              first_name: student.first_name,
              last_name: student.last_name,
              section: student.section,
              date_of_birth: student.date_of_birth ?? undefined,
            }}
            submitLabel="Mettre à jour"
            submitPendingLabel="Mise à jour..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
