import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { createStudent } from "../actions";
import { StudentForm } from "../student-form";

export default function NewStudentPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="Nouvel étudiant"
        description="L'étudiant pourra ensuite recevoir un résultat par année scolaire"
      />
      <Card>
        <CardContent>
          <StudentForm
            action={createStudent}
            submitLabel="Créer l'étudiant"
            submitPendingLabel="Création..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
