"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMontant } from "@/lib/primes/format";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export interface AmountByLabel {
  label: string;
  amount: number;
}

const amountChartConfig = {
  amount: { label: "Budget", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function BudgetByNiveauChart({ data }: Readonly<{ data: AmountByLabel[] }>) {
  const top = [...data].sort((a, b) => b.amount - a.amount).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Budget par niveau</CardTitle>
        <CardDescription>Top 10 niveaux par montant estimé</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={amountChartConfig} className="h-64 w-full">
          <BarChart data={top} layout="vertical" margin={{ right: 48 }}>
            <CartesianGrid horizontal={false} strokeOpacity={0.35} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={96}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.06 }}
              content={
                <ChartTooltipContent
                  nameKey="label"
                  formatter={(value) => formatMontant(Number(value))}
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} maxBarSize={20}>
              <LabelList
                dataKey="amount"
                position="right"
                className="fill-foreground"
                fontSize={11}
                formatter={(v: number) => formatMontant(v)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function BudgetByTypePrimeChart({ data }: Readonly<{ data: AmountByLabel[] }>) {
  const config = Object.fromEntries(
    data.map((d, i) => [d.label, { label: d.label, color: PIE_COLORS[i % PIE_COLORS.length] }])
  ) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Répartition par type de prime
        </CardTitle>
        <CardDescription>Part du budget des primes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto h-64 w-full max-w-72">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="label"
                  formatter={(value) => formatMontant(Number(value))}
                />
              }
            />
            <Pie data={data} dataKey="amount" nameKey="label" innerRadius={48} outerRadius={80}>
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="label" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function BudgetByCategorieChart({ data }: Readonly<{ data: AmountByLabel[] }>) {
  const top = [...data].sort((a, b) => b.amount - a.amount).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Budget par catégorie d&apos;article
        </CardTitle>
        <CardDescription>Répartition du coût des articles</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={amountChartConfig} className="h-64 w-full">
          <BarChart data={top} layout="vertical" margin={{ right: 48 }}>
            <CartesianGrid horizontal={false} strokeOpacity={0.35} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={96}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.06 }}
              content={
                <ChartTooltipContent
                  nameKey="label"
                  formatter={(value) => formatMontant(Number(value))}
                />
              }
            />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} maxBarSize={20}>
              <LabelList
                dataKey="amount"
                position="right"
                className="fill-foreground"
                fontSize={11}
                formatter={(v: number) => formatMontant(v)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
