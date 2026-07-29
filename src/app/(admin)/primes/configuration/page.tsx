import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
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
import { configCost } from "@/lib/primes/cost";
import { formatMontant } from "@/lib/primes/format";
import { typePrimeBadgeClass, typePrimeIcon } from "@/lib/primes/prize-visuals";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function ConfigurationPage({
  searchParams,
}: Readonly<PageProps>) {
  const filters = await searchParams;
  const supabase = await createClient();

  const [{ data: schoolYears }, { data: typesPrimes }] = await Promise.all([
    supabase
      .from("school_years")
      .select("id, label, start_year")
      .order("start_year", { ascending: false }),
    supabase
      .from("types_primes")
      .select("id, code, libelle")
      .eq("actif", true)
      .order("code"),
  ]);

  const years = schoolYears ?? [];
  const types = typesPrimes ?? [];
  const sessionId = filters.session ?? pickDefaultSchoolYear(years)?.id;

  const { data: niveaux } = await supabase
    .from("niveaux")
    .select("id, section, code, progression_order")
    .order("progression_order")
    .order("section");

  const niveauRows = niveaux ?? [];

  const cellByKey = new Map<string, { count: number; cost: number }>();
  if (sessionId && niveauRows.length > 0) {
    const { data: configs } = await supabase
      .from("configurations_primes")
      .select("id, niveau_id, type_prime_id")
      .eq("session_id", sessionId);

    const configRows = configs ?? [];
    if (configRows.length > 0) {
      const { data: lines } = await supabase
        .from("configuration_prime_articles")
        .select("configuration_prime_id, quantite, prix_session")
        .in(
          "configuration_prime_id",
          configRows.map((c) => c.id),
        );

      const linesByConfig = new Map<
        string,
        { quantite: number; prix_session: number }[]
      >();
      for (const line of lines ?? []) {
        const list = linesByConfig.get(line.configuration_prime_id) ?? [];
        list.push({ quantite: line.quantite, prix_session: line.prix_session });
        linesByConfig.set(line.configuration_prime_id, list);
      }

      for (const config of configRows) {
        const configLines = linesByConfig.get(config.id) ?? [];
        cellByKey.set(`${config.niveau_id}:${config.type_prime_id}`, {
          count: configLines.length,
          cost: configCost(configLines),
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuration des primes"
        description="Composez la prime de chaque niveau (francophone et anglophone) pour la session sélectionnée. Cliquez sur une cellule pour ajouter des articles, ajuster les quantités et les prix."
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

      {!sessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Créez d&apos;abord une année scolaire pour configurer ses primes.
          </CardContent>
        </Card>
      ) : niveauRows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun niveau défini.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-sm bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="whitespace-nowrap">Niveau</TableHead>
                {types.map((t) => {
                  const Icon = typePrimeIcon(t.code);
                  return (
                    <TableHead key={t.id} className="whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 ${typePrimeBadgeClass(t.code)}`}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {t.libelle}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {niveauRows.map((niveau) => (
                <TableRow key={niveau.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {niveau.code}
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal text-muted-foreground"
                      >
                        {niveau.section === "francophone"
                          ? "Franco."
                          : "Anglo."}
                      </Badge>
                    </div>
                  </TableCell>
                  {types.map((type) => {
                    const cell = cellByKey.get(`${niveau.id}:${type.id}`);
                    return (
                      <TableCell key={type.id} className="align-top">
                        <Link
                          href={`/primes/configuration/${niveau.id}?session=${sessionId}&type=${type.id}`}
                          className="block min-w-28 rounded-sm px-2 py-1.5 text-xs whitespace-normal break-words hover:bg-muted"
                        >
                          {cell ? (
                            <span className="font-medium text-foreground">
                              {cell.count} article{cell.count > 1 ? "s" : ""} ·{" "}
                              {formatMontant(cell.cost)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Non configuré
                            </span>
                          )}
                        </Link>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
