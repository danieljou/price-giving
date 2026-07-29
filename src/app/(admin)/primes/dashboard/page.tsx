import { Boxes, PiggyBank, Receipt, Tags, Users, Wallet } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { pickDefaultSchoolYear } from "@/lib/school-year";
import { computeBeneficiaryCounts } from "@/lib/primes/beneficiaries";
import { computeBudget, type BudgetLineInput } from "@/lib/primes/budget";
import { formatMontant } from "@/lib/primes/format";
import { kpiToneClass, type KpiTone } from "@/lib/kpi-tones";
import {
  BudgetByCategorieChart,
  BudgetByNiveauChart,
  BudgetByTypePrimeChart,
  type AmountByLabel,
} from "./charts";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: Readonly<{
  title: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: KpiTone;
}>) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${kpiToneClass(tone)}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-0.5 font-mono text-2xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PrimesDashboardPage({ searchParams }: Readonly<PageProps>) {
  const filters = await searchParams;
  const supabase = await createClient();

  const { data: schoolYears } = await supabase
    .from("school_years")
    .select("id, label, start_year")
    .order("start_year", { ascending: false });

  const years = schoolYears ?? [];
  const sessionId = filters.session ?? pickDefaultSchoolYear(years)?.id;

  let budget = computeBudget([], new Map(), 0);
  let byNiveau: AmountByLabel[] = [];
  let byTypePrime: AmountByLabel[] = [];
  let byCategorie: AmountByLabel[] = [];
  let articlesUtilises = 0;
  let categoriesUtilisees = 0;

  if (sessionId) {
    const [{ data: niveaux }, { data: typesPrimes }, { data: configs }, { data: depenses }, { data: catalogue }] =
      await Promise.all([
        supabase.from("niveaux").select("id, section, code, progression_order"),
        supabase.from("types_primes").select("id, code, libelle").eq("actif", true),
        supabase.from("configurations_primes").select("id, niveau_id, type_prime_id").eq("session_id", sessionId),
        supabase.from("depenses_complementaires").select("montant").eq("session_id", sessionId),
        supabase.from("articles").select("id, categorie"),
      ]);

    const niveauRows = niveaux ?? [];
    const typeRows = typesPrimes ?? [];
    const configRows = configs ?? [];
    const articleCategorieById = new Map((catalogue ?? []).map((a) => [a.id, a.categorie]));

    const { data: results } = await supabase
      .from("results")
      .select("school_year_id, section, niveau_depart, awarded_prizes")
      .eq("school_year_id", sessionId);

    let lines: { configuration_prime_id: string; article_id: string; quantite: number; prix_session: number }[] = [];
    if (configRows.length > 0) {
      const { data } = await supabase
        .from("configuration_prime_articles")
        .select("configuration_prime_id, article_id, quantite, prix_session")
        .in("configuration_prime_id", configRows.map((c) => c.id));
      lines = data ?? [];
    }

    const costByConfig = new Map<string, number>();
    for (const line of lines) {
      costByConfig.set(
        line.configuration_prime_id,
        (costByConfig.get(line.configuration_prime_id) ?? 0) + line.quantite * line.prix_session
      );
    }

    const niveauById = new Map(niveauRows.map((n) => [n.id, n]));
    const typeById = new Map(typeRows.map((t) => [t.id, t]));

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

    const depensesTotal = (depenses ?? []).reduce((sum, d) => sum + d.montant, 0);
    budget = computeBudget(budgetLines, beneficiaryCounts, depensesTotal);

    const niveauTotals = new Map<string, number>();
    const typeTotals = new Map<string, number>();
    for (const line of budget.lines) {
      niveauTotals.set(line.niveauCode, (niveauTotals.get(line.niveauCode) ?? 0) + line.subtotal);
      typeTotals.set(
        line.typePrimeLibelle,
        (typeTotals.get(line.typePrimeLibelle) ?? 0) + line.subtotal
      );
    }
    byNiveau = [...niveauTotals.entries()].map(([label, amount]) => ({ label, amount }));
    byTypePrime = [...typeTotals.entries()].map(([label, amount]) => ({ label, amount }));

    const categorieTotals = new Map<string, number>();
    const usedArticleIds = new Set<string>();
    for (const line of lines) {
      usedArticleIds.add(line.article_id);
      const categorie = articleCategorieById.get(line.article_id) ?? "Autre";
      categorieTotals.set(
        categorie,
        (categorieTotals.get(categorie) ?? 0) + line.quantite * line.prix_session
      );
    }
    byCategorie = [...categorieTotals.entries()].map(([label, amount]) => ({ label, amount }));
    articlesUtilises = usedArticleIds.size;
    categoriesUtilisees = categorieTotals.size;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tableau de bord financier"
        description="Vue d'ensemble du budget des primes de la session sélectionnée."
      />

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Bénéficiaires"
          value={String(budget.totalBeneficiaires)}
          hint="Toutes primes confondues"
          icon={Users}
          tone="blue"
        />
        <KpiCard
          title="Budget des primes"
          value={formatMontant(budget.budgetPrimes)}
          hint="Articles × bénéficiaires"
          icon={PiggyBank}
          tone="amber"
        />
        <KpiCard
          title="Dépenses complémentaires"
          value={formatMontant(budget.depensesComplementaires)}
          hint="Hors primes"
          icon={Receipt}
          tone="rose"
        />
        <KpiCard
          title="Budget global"
          value={formatMontant(budget.budgetGlobal)}
          hint="Primes + dépenses"
          icon={Wallet}
          tone="violet"
        />
        <KpiCard
          title="Catégories utilisées"
          value={String(categoriesUtilisees)}
          hint="Catégories d'articles"
          icon={Tags}
          tone="teal"
        />
        <KpiCard
          title="Articles utilisés"
          value={String(articlesUtilises)}
          hint="Articles distincts configurés"
          icon={Boxes}
          tone="slate"
        />
      </div>

      {budget.lines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune prime configurée pour cette session pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BudgetByNiveauChart data={byNiveau} />
          <BudgetByTypePrimeChart data={byTypePrime} />
          <BudgetByCategorieChart data={byCategorie} />
        </div>
      )}
    </div>
  );
}
