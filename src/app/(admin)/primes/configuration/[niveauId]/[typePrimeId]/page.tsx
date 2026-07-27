import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { configCost } from "@/lib/primes/cost";
import { formatMontant } from "@/lib/primes/format";
import { ArticlePicker, type PickerArticle } from "./article-picker";
import { LinesTable, type CompositionLine } from "./lines-table";

interface PageProps {
  params: Promise<{ niveauId: string; typePrimeId: string }>;
  searchParams: Promise<{ session?: string; section?: string }>;
}

interface LineJoinRow {
  id: string;
  article_id: string;
  quantite: number;
  prix_session: number;
  observation: string | null;
  articles: { code: string; libelle: string; unite: string } | { code: string; libelle: string; unite: string }[] | null;
}

function joinedArticle(row: LineJoinRow) {
  return Array.isArray(row.articles) ? (row.articles[0] ?? null) : row.articles;
}

export default async function ConfigurationEditorPage({
  params,
  searchParams,
}: Readonly<PageProps>) {
  const { niveauId, typePrimeId } = await params;
  const { session: sessionId, section } = await searchParams;

  if (!sessionId) redirect("/primes/configuration");

  const supabase = await createClient();

  const [{ data: niveau }, { data: typePrime }, { data: sessionRow }] =
    await Promise.all([
      supabase
        .from("niveaux")
        .select("id, section, code")
        .eq("id", niveauId)
        .single(),
      supabase
        .from("types_primes")
        .select("id, code, libelle")
        .eq("id", typePrimeId)
        .single(),
      supabase.from("school_years").select("id, label").eq("id", sessionId).single(),
    ]);

  if (!niveau || !typePrime || !sessionRow) notFound();

  const { data: config } = await supabase
    .from("configurations_primes")
    .upsert(
      { session_id: sessionRow.id, niveau_id: niveau.id, type_prime_id: typePrime.id },
      { onConflict: "session_id,niveau_id,type_prime_id" }
    )
    .select("id")
    .single();

  if (!config) notFound();

  const [{ data: lineRows }, { data: articles }, { data: results }] =
    await Promise.all([
      supabase
        .from("configuration_prime_articles")
        .select("id, article_id, quantite, prix_session, observation, articles(code, libelle, unite)")
        .eq("configuration_prime_id", config.id)
        .order("created_at"),
      supabase
        .from("articles")
        .select("id, code, libelle, categorie, prix_reference")
        .eq("actif", true)
        .order("libelle"),
      supabase
        .from("results")
        .select("awarded_prizes")
        .eq("school_year_id", sessionRow.id)
        .eq("section", niveau.section)
        .eq("niveau_depart", niveau.code),
    ]);

  const lines: CompositionLine[] = ((lineRows ?? []) as unknown as LineJoinRow[]).map(
    (row) => {
      const article = joinedArticle(row);
      return {
        id: row.id,
        article_id: row.article_id,
        article_code: article?.code ?? "—",
        article_libelle: article?.libelle ?? "Article supprimé",
        unite: article?.unite ?? "",
        quantite: row.quantite,
        prix_session: row.prix_session,
        observation: row.observation,
      };
    }
  );

  const cost = configCost(lines.map((l) => ({ quantite: l.quantite, prix_session: l.prix_session })));
  const beneficiaries = (results ?? []).filter((r) =>
    r.awarded_prizes.includes(typePrime.code)
  ).length;
  const estimatedBudget = cost * beneficiaries;

  const pickerArticles: PickerArticle[] = (articles ?? []).map((a) => ({
    id: a.id,
    code: a.code,
    libelle: a.libelle,
    categorie: a.categorie,
    prix_reference: a.prix_reference,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${typePrime.libelle} — ${niveau.code}`}
        description={`Session ${sessionRow.label}`}
      >
        <Button variant="outline" asChild>
          <Link
            href={`/primes/configuration?session=${sessionRow.id}&section=${section ?? niveau.section}`}
          >
            <ArrowLeft aria-hidden="true" />
            Retour à la configuration
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Coût de la prime
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {formatMontant(cost)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Bénéficiaires
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {beneficiaries}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Budget estimé
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {formatMontant(estimatedBudget)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Composition de la prime</CardTitle>
          <ArticlePicker
            configId={config.id}
            articles={pickerArticles}
            existingArticleIds={lines.map((l) => l.article_id)}
          />
        </CardHeader>
        <CardContent>
          <LinesTable lines={lines} />
        </CardContent>
      </Card>
    </div>
  );
}
