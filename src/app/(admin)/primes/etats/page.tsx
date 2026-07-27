import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pickDefaultSchoolYear } from "@/lib/school-year";
import { computeBeneficiaryCounts } from "@/lib/primes/beneficiaries";
import { computeBudget, type BudgetLineInput } from "@/lib/primes/budget";
import { formatMontant } from "@/lib/primes/format";
import { ExportMenu } from "./export-menu";
import type { ArticleSummaryRow, ConfigDetailRow, DepenseExportRow } from "./types";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function EtatsPage({ searchParams }: Readonly<PageProps>) {
  const filters = await searchParams;
  const supabase = await createClient();

  const { data: schoolYears } = await supabase
    .from("school_years")
    .select("id, label, start_year")
    .order("start_year", { ascending: false });

  const years = schoolYears ?? [];
  const sessionId = filters.session ?? pickDefaultSchoolYear(years)?.id;
  const sessionLabel = years.find((y) => y.id === sessionId)?.label ?? "—";

  let configDetail: ConfigDetailRow[] = [];
  let articleSummary: ArticleSummaryRow[] = [];
  let depenseRows: DepenseExportRow[] = [];
  let recap = { totalBeneficiaires: 0, budgetPrimes: 0, depensesComplementaires: 0, budgetGlobal: 0 };

  if (sessionId) {
    const [{ data: niveaux }, { data: typesPrimes }, { data: configs }, { data: depenses }] =
      await Promise.all([
        supabase.from("niveaux").select("id, section, code, progression_order"),
        supabase.from("types_primes").select("id, code, libelle").eq("actif", true),
        supabase.from("configurations_primes").select("id, niveau_id, type_prime_id").eq("session_id", sessionId),
        supabase
          .from("depenses_complementaires")
          .select("libelle, categorie, montant, observation")
          .eq("session_id", sessionId)
          .order("categorie"),
      ]);

    const niveauRows = niveaux ?? [];
    const typeRows = typesPrimes ?? [];
    const configRows = configs ?? [];
    depenseRows = depenses ?? [];

    const { data: results } = await supabase
      .from("results")
      .select("school_year_id, section, niveau_depart, awarded_prizes")
      .eq("school_year_id", sessionId);

    const niveauById = new Map(niveauRows.map((n) => [n.id, n]));
    const typeById = new Map(typeRows.map((t) => [t.id, t]));

    let lineRows: {
      configuration_prime_id: string;
      quantite: number;
      prix_session: number;
      articles: { libelle: string } | { libelle: string }[] | null;
    }[] = [];
    if (configRows.length > 0) {
      const { data } = await supabase
        .from("configuration_prime_articles")
        .select("configuration_prime_id, quantite, prix_session, articles(libelle)")
        .in("configuration_prime_id", configRows.map((c) => c.id));
      lineRows = data ?? [];
    }

    const configById = new Map(configRows.map((c) => [c.id, c]));
    const articleTotals = new Map<string, { quantite: number; montant: number }>();

    for (const line of lineRows) {
      const config = configById.get(line.configuration_prime_id);
      const niveau = config ? niveauById.get(config.niveau_id) : undefined;
      const type = config ? typeById.get(config.type_prime_id) : undefined;
      const article = Array.isArray(line.articles) ? (line.articles[0] ?? null) : line.articles;
      const libelle = article?.libelle ?? "Article supprimé";
      const montant = line.quantite * line.prix_session;

      configDetail.push({
        niveau: niveau?.code ?? "—",
        typePrime: type?.libelle ?? "—",
        article: libelle,
        quantite: line.quantite,
        prixSession: line.prix_session,
        montant,
      });

      const existing = articleTotals.get(libelle) ?? { quantite: 0, montant: 0 };
      articleTotals.set(libelle, {
        quantite: existing.quantite + line.quantite,
        montant: existing.montant + montant,
      });
    }

    articleSummary = [...articleTotals.entries()].map(([article, t]) => ({
      article,
      quantiteTotale: t.quantite,
      montantTotal: t.montant,
    }));

    const costByConfig = new Map<string, number>();
    for (const line of lineRows) {
      costByConfig.set(
        line.configuration_prime_id,
        (costByConfig.get(line.configuration_prime_id) ?? 0) + line.quantite * line.prix_session
      );
    }

    const beneficiaryCounts = computeBeneficiaryCounts(results ?? [], sessionId, niveauRows, typeRows);

    const budgetLines: BudgetLineInput[] = configRows
      .map((c) => {
        const niveau = niveauById.get(c.niveau_id);
        const type = typeById.get(c.type_prime_id);
        if (!niveau || !type) return null;
        return {
          niveauId: c.niveau_id,
          niveauCode: niveau.code,
          typePrimeId: c.type_prime_id,
          typePrimeLibelle: type.libelle,
          unitCost: costByConfig.get(c.id) ?? 0,
        };
      })
      .filter((l): l is BudgetLineInput => l !== null);

    const depensesTotal = depenseRows.reduce((sum, d) => sum + d.montant, 0);
    const budget = computeBudget(budgetLines, beneficiaryCounts, depensesTotal);
    recap = {
      totalBeneficiaires: budget.totalBeneficiaires,
      budgetPrimes: budget.budgetPrimes,
      depensesComplementaires: budget.depensesComplementaires,
      budgetGlobal: budget.budgetGlobal,
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="États et impressions"
        description="Configuration détaillée, articles, dépenses et récapitulatif financier de la session — exportables en PDF, Excel ou impression directe."
      >
        {sessionId && (
          <ExportMenu
            scopeLabel={sessionLabel}
            configDetail={configDetail}
            articleSummary={articleSummary}
            depenses={depenseRows}
            recap={recap}
          />
        )}
      </PageHeader>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <Select name="session" defaultValue={sessionId ?? ""}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Session académique" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Afficher</Button>
      </form>

      {!sessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Créez d&apos;abord une année scolaire.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Configuration détaillée</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Type de prime</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configDetail.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.niveau}</TableCell>
                      <TableCell>{r.typePrime}</TableCell>
                      <TableCell>{r.article}</TableCell>
                      <TableCell className="font-mono text-xs">{r.quantite}</TableCell>
                      <TableCell className="font-mono text-xs">{formatMontant(r.prixSession)}</TableCell>
                      <TableCell className="font-mono text-xs font-medium">{formatMontant(r.montant)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liste détaillée des articles</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Quantité totale</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articleSummary.map((r) => (
                    <TableRow key={r.article}>
                      <TableCell>{r.article}</TableCell>
                      <TableCell className="font-mono text-xs">{r.quantiteTotale}</TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {formatMontant(r.montantTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dépenses complémentaires</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Observation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depenseRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.libelle}</TableCell>
                      <TableCell>{r.categorie}</TableCell>
                      <TableCell className="font-mono text-xs font-medium">
                        {formatMontant(r.montant)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.observation ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>État récapitulatif</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Bénéficiaires</dt>
                  <dd className="font-mono text-lg font-semibold text-foreground">
                    {recap.totalBeneficiaires}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Budget des primes</dt>
                  <dd className="font-mono text-lg font-semibold text-foreground">
                    {formatMontant(recap.budgetPrimes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Dépenses diverses</dt>
                  <dd className="font-mono text-lg font-semibold text-foreground">
                    {formatMontant(recap.depensesComplementaires)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Budget final</dt>
                  <dd className="font-mono text-lg font-semibold text-foreground">
                    {formatMontant(recap.budgetGlobal)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
