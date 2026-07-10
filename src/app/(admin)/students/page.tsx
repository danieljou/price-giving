import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { studentColumns } from "./columns";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, section")
    .order("last_name");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Étudiants</h1>
        <Button asChild>
          <Link href="/students/new">
            <UserPlus />
            Nouvel étudiant
          </Link>
        </Button>
      </div>

      <DataTable
        columns={studentColumns}
        data={students ?? []}
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
