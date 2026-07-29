import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { configCost } from "@/lib/primes/cost";
import { AuditHistory } from "@/components/audit-history";
import type { PickerArticle } from "./article-picker";
import { NiveauEditorTabs, type TabData } from "./niveau-editor-tabs";
import type { CompositionLine } from "./lines-table";

interface PageProps {
  params: Promise<{ niveauId: string }>;
  searchParams: Promise<{ session?: string; type?: string }>;
}

interface LineJoinRow {
  id: string;
  article_id: string;
  quantite: number;
  prix_session: number;
  observation: string | null;
  articles:
    | { code: string; libelle: string; unite: string }
    | { code: string; libelle: string; unite: string }[]
    | null;
}

function joinedArticle(row: LineJoinRow) {
  return Array.isArray(row.articles) ? (row.articles[0] ?? null) : row.articles;
}

export default async function NiveauConfigurationPage({
  params,
  searchParams,
}: Readonly<PageProps>) {
  const { niveauId } = await params;
  const { session: sessionId, type: requestedTypeId } = await searchParams;

  if (!sessionId) redirect("/primes/configuration");

  const supabase = await createClient();

  const [{ data: niveau }, { data: sessionRow }, { data: typesPrimes }, { data: articles }] =
    await Promise.all([
      supabase.from("niveaux").select("id, section, code").eq("id", niveauId).single(),
      supabase.from("school_years").select("id, label").eq("id", sessionId).single(),
      supabase.from("types_primes").select("id, code, libelle").eq("actif", true).order("code"),
      supabase
        .from("articles")
        .select("id, code, libelle, categorie, prix_reference")
        .eq("actif", true)
        .order("libelle"),
    ]);

  if (!niveau || !sessionRow || !typesPrimes || typesPrimes.length === 0) notFound();

  const { data: results } = await supabase
    .from("results")
    .select("awarded_prizes")
    .eq("school_year_id", sessionRow.id)
    .eq("section", niveau.section)
    .eq("niveau_depart", niveau.code);

  const tabs: TabData[] = [];
  for (const type of typesPrimes) {
    const { data: config } = await supabase
      .from("configurations_primes")
      .upsert(
        { session_id: sessionRow.id, niveau_id: niveau.id, type_prime_id: type.id },
        { onConflict: "session_id,niveau_id,type_prime_id" }
      )
      .select("id")
      .single();

    if (!config) continue;

    const { data: lineRows } = await supabase
      .from("configuration_prime_articles")
      .select(
        "id, article_id, quantite, prix_session, observation, articles(code, libelle, unite)"
      )
      .eq("configuration_prime_id", config.id)
      .order("created_at");

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

    const cost = configCost(
      lines.map((l) => ({ quantite: l.quantite, prix_session: l.prix_session }))
    );
    const beneficiaries = (results ?? []).filter((r) =>
      (r.awarded_prizes as readonly string[]).includes(type.code)
    ).length;

    tabs.push({
      typePrimeId: type.id,
      code: type.code,
      libelle: type.libelle,
      configId: config.id,
      lines,
      cost,
      beneficiaries,
      history:
        lines.length > 0 ? (
          <AuditHistory
            entityType="prime_config"
            entityId={lines.map((l) => l.id)}
          />
        ) : undefined,
    });
  }

  if (tabs.length === 0) notFound();

  const defaultTypeId =
    (requestedTypeId && tabs.some((t) => t.typePrimeId === requestedTypeId)
      ? requestedTypeId
      : undefined) ?? tabs[0].typePrimeId;

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
        title={`Niveau ${niveau.code}`}
        description={`Session ${sessionRow.label} — composez chaque type de prime pour ce niveau depuis les onglets ci-dessous.`}
      >
        <Button variant="outline" asChild>
          <Link href={`/primes/configuration?session=${sessionRow.id}`}>
            <ArrowLeft aria-hidden="true" />
            Retour à la configuration
          </Link>
        </Button>
      </PageHeader>

      <NiveauEditorTabs tabs={tabs} defaultTypeId={defaultTypeId} articles={pickerArticles} />
    </div>
  );
}
