import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { articleColumns, type ArticleRow } from "./columns";
import { ArticleFormDialog } from "./article-form-dialog";

export default async function CataloguePage() {
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, code, libelle, categorie, description, unite, prix_reference, actif"
    )
    .order("categorie")
    .order("libelle");

  const rows: ArticleRow[] = articles ?? [];
  const categories = [...new Set(rows.map((a) => a.categorie))].sort();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalogue des articles"
        description="Référentiel général des articles pouvant composer une prime, indépendant des sessions. Le prix ici défini n'est qu'une valeur par défaut."
      >
        <ArticleFormDialog />
      </PageHeader>

      <DataTable
        columns={articleColumns}
        data={rows}
        searchKey="libelle"
        searchPlaceholder="Rechercher un article..."
        pageSize={15}
        filterFields={[
          {
            columnId: "categorie",
            title: "Catégorie",
            options: categories.map((c) => ({ label: c, value: c })),
          },
          {
            columnId: "actif",
            title: "Statut",
            options: [
              { label: "Actif", value: "true" },
              { label: "Inactif", value: "false" },
            ],
          },
        ]}
      />
    </div>
  );
}
