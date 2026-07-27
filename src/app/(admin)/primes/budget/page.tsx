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

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function BudgetPage({ searchParams }: Readonly<PageProps>) {
  const filters = await searchParams;
  const supabase = await createClient();

  const { data: schoolYears } = await supabase
    .from("school_years")
    .select("id, label, start_year")
    .order("start_year", { ascending: false });

  const years = schoolYears ?? [];
  const sessionId = filters.session ?? pickDefaultSchoolYear(years)?.id;

  let budget = computeBudget([], new Map(), 0);

  if (sessionId) {
    const [{ data: niveaux }, { data: typesPrimes }, { data: configs }, { data: depenses }] =
      await Promise.all([
        supabase
          .from("niveaux")
          .select("id, section, code, progression_order")
          .order("progression_order"),
        supabase
          .from("types_primes")
          .select("id, code, libelle")
          .eq("actif", true)
          .order("code"),
        supabase
          .from("configurations_primes")
          .select("id, niveau_id, type_prime_id")
          .eq("session_id", sessionId),
        supabase
          .from("depenses_complementaires")
          .select("montant")
          .eq("session_id", sessionId),
      ]);

    const niveauRows = niveaux ?? [];
    const typeRows = typesPrimes ?? [];
    const configRows = configs ?? [];

    const { data: results } = await supabase
      .from("results")
      .select("school_year_id, section, niveau_depart, awarded_prizes")
      .eq("school_year_id", sessionId);

    let costLines: { configuration_prime_id: string; quantite: number; prix_session: number }[] = [];
    if (configRows.length > 0) {
      const { data } = await supabase
        .from("configuration_prime_articles")
        .select("configuration_prime_id, quantite, prix_session")
        .in("configuration_prime_id", configRows.map((c) => c.id));
      costLines = data ?? [];
    }

    const costByConfig = new Map<string, number>();
    for (const line of costLines) {
      costByConfig.set(
        line.configuration_prime_id,
        (costByConfig.get(line.configuration_prime_id) ?? 0) + line.quantite * line.prix_session
      );
    }

    const niveauById = new Map(niveauRows.map((n) => [n.id, n]));
    const typeById = new Map(typeRows.map((t) => [t.id, t]));

    const beneficiaryCounts = computeBeneficiaryCounts(
      results ?? [],
      sessionId,
      niveauRows,
      typeRows
    );

    const budgetLines: BudgetLineInput[] = configRows
      .map((c) => {
        const niveau = niveauById.get(c.niveau_id);
        const type = typeById.get(c.type_prime_id);
        if (!niveau || !type) return null;
        return {
          niveauId: c.niveau_id,
          niveauCode: `${niveau.code} (${niveau.section === "francophone" ? "Franco." : "Anglo."})`,
          typePrimeId: c.type_prime_id,
          typePrimeLibelle: type.libelle,
          unitCost: costByConfig.get(c.id) ?? 0,
          progressionOrder: niveau.progression_order,
        } satisfies BudgetLineInput & { progressionOrder: number };
      })
      .filter((l): l is BudgetLineInput & { progressionOrder: number } => l !== null)
      .sort((a, b) => a.progressionOrder - b.progressionOrder || a.typePrimeLibelle.localeCompare(b.typePrimeLibelle));

    const depensesTotal = (depenses ?? []).reduce((sum, d) => sum + d.montant, 0);

    budget = computeBudget(budgetLines, beneficiaryCounts, depensesTotal);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estimation budgétaire"
        description="Budget calculé automatiquement à partir des primes configurées et du nombre de bénéficiaires issus des résultats."
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">Bénéficiaires</p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {budget.totalBeneficiaires}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">Budget des primes</p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {formatMontant(budget.budgetPrimes)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Dépenses complémentaires
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {formatMontant(budget.depensesComplementaires)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">Budget global</p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {formatMontant(budget.budgetGlobal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {budget.lines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucune prime configurée pour cette session. Rendez-vous sur la page
            Configuration pour composer les primes par niveau.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-sm bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Niveau</TableHead>
                <TableHead>Type de prime</TableHead>
                <TableHead>Bénéficiaires</TableHead>
                <TableHead>Coût unitaire</TableHead>
                <TableHead>Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budget.lines.map((line) => (
                <TableRow key={`${line.niveauId}:${line.typePrimeId}`}>
                  <TableCell className="font-medium text-foreground">
                    {line.niveauCode}
                  </TableCell>
                  <TableCell>{line.typePrimeLibelle}</TableCell>
                  <TableCell className="font-mono text-xs">{line.beneficiaries}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatMontant(line.unitCost)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {formatMontant(line.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="text-right font-medium text-foreground">
                  Budget total des primes
                </TableCell>
                <TableCell className="font-mono text-sm font-semibold text-foreground">
                  {formatMontant(budget.budgetPrimes)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
