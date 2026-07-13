import Link from "next/link";
import { Upload, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { studentColumns } from "./columns";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, section")
    .order("last_name");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Étudiants"
        description={`${students?.length ?? 0} étudiant${(students?.length ?? 0) > 1 ? "s" : ""} enregistré${(students?.length ?? 0) > 1 ? "s" : ""}`}
      >
        <Button variant="outline" asChild>
          <Link href="/students/import">
            <Upload />
            Importer
          </Link>
        </Button>
        <Button asChild>
          <Link href="/students/new">
            <UserPlus />
            Nouvel étudiant
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={studentColumns}
        data={students ?? []}
        emptyContent={
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Aucun étudiant enregistré
            </p>
            <p className="text-sm text-muted-foreground">
              Commencez par créer un étudiant avec le bouton ci-dessus.
            </p>
          </div>
        }
        searchKey="last_name"
        searchPlaceholder="Rechercher un nom..."
        filterFields={[
          {
            columnId: "section",
            title: "Section",
            options: [
              { label: "Francophone", value: "francophone" },
              { label: "Anglophone", value: "anglophone" },
            ],
          },
        ]}
      />
    </div>
  );
}
