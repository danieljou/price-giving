import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/role";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { getUserColumns } from "./columns";
import { listAppUsers } from "./queries";
import { UserCreateDialog } from "./user-create-dialog";

export default async function UsersPage() {
  if (!(await isAdmin())) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const rows = await listAppUsers();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Utilisateurs"
        description="Comptes ayant accès à l'application et leur rôle (saisie ou admin)."
      >
        <UserCreateDialog />
      </PageHeader>

      <DataTable
        columns={getUserColumns(currentUser?.id ?? "")}
        data={rows}
        pageSize={15}
        showViewOptions
        searchKey="email"
        searchPlaceholder="Rechercher un email..."
        filterFields={[
          {
            columnId: "role",
            title: "Rôle",
            options: [
              { label: "Admin", value: "admin" },
              { label: "Saisie", value: "saisie" },
            ],
          },
        ]}
      />
    </div>
  );
}
