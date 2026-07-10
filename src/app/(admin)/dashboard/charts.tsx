"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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

export const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

// Fixed categorical order — a prize keeps its hue everywhere, filters included.
const PRIZE_ORDER = ["SPECIAL", "EXC", "ENC", "EXC_PLUS"] as const;

const prizeChartConfig = {
  SPECIAL: { label: "Prix Spécial", color: "var(--chart-1)" },
  EXC: { label: "Excellence", color: "var(--chart-2)" },
  ENC: { label: "Encouragement", color: "var(--chart-3)" },
  EXC_PLUS: { label: "Excellence+", color: "var(--chart-4)" },
} satisfies ChartConfig;

const sectionChartConfig = {
  francophone: { label: "Francophone", color: "var(--chart-1)" },
  anglophone: { label: "Anglophone", color: "var(--chart-2)" },
} satisfies ChartConfig;

const countChartConfig = {
  count: { label: "Lauréats", color: "var(--chart-1)" },
} satisfies ChartConfig;

export interface PrizeCount {
  prize: string;
  count: number;
}

export interface YearPrizeRow {
  year: string;
  SPECIAL: number;
  EXC: number;
  ENC: number;
  EXC_PLUS: number;
}

export interface SectionCount {
  section: string;
  count: number;
}

export interface NiveauCount {
  niveau: string;
  count: number;
}

export function PrizeBarChart({ data }: Readonly<{ data: PrizeCount[] }>) {
  const ordered = PRIZE_ORDER.map((code) => ({
    prize: code,
    label: prizeChartConfig[code].label,
    count: data.find((d) => d.prize === code)?.count ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Lauréats par prix
        </CardTitle>
        <CardDescription>Toutes années confondues</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={prizeChartConfig} className="h-56 w-full">
          <BarChart data={ordered} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.35} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.06 }}
              content={<ChartTooltipContent nameKey="prize" />}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList
                dataKey="count"
                position="top"
                className="fill-foreground"
                fontSize={12}
              />
              {ordered.map((entry) => (
                <Cell
                  key={entry.prize}
                  fill={`var(--color-${entry.prize})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function YearStackedBarChart({
  data,
}: Readonly<{ data: YearPrizeRow[] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Évolution par année scolaire
        </CardTitle>
        <CardDescription>Répartition des prix par année</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={prizeChartConfig} className="h-56 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeOpacity={0.35} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.06 }}
              content={<ChartTooltipContent />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {PRIZE_ORDER.map((code, i) => (
              <Bar
                key={code}
                dataKey={code}
                stackId="prizes"
                fill={`var(--color-${code})`}
                maxBarSize={48}
                // 4px rounded cap only on the topmost stacked segment
                radius={i === PRIZE_ORDER.length - 1 ? [4, 4, 0, 0] : 0}
                // 2px surface gap between stacked segments
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function SectionBarChart({
  data,
}: Readonly<{ data: SectionCount[] }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Lauréats par section
        </CardTitle>
        <CardDescription>Francophone / Anglophone</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={sectionChartConfig} className="h-56 w-full">
          <BarChart data={data} layout="vertical" margin={{ right: 32 }}>
            <CartesianGrid horizontal={false} strokeOpacity={0.35} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="section"
              type="category"
              tickLine={false}
              axisLine={false}
              width={92}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) =>
                v.charAt(0).toUpperCase() + v.slice(1)
              }
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.06 }}
              content={<ChartTooltipContent nameKey="section" />}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
              <LabelList
                dataKey="count"
                position="right"
                className="fill-foreground"
                fontSize={12}
              />
              {data.map((entry) => (
                <Cell
                  key={entry.section}
                  fill={`var(--color-${entry.section})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function NiveauBarChart({
  data,
}: Readonly<{ data: NiveauCount[] }>) {
  // Magnitude across many categories → single hue, sorted descending.
  const top = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Niveaux les plus primés
        </CardTitle>
        <CardDescription>Top 8 par niveau de départ</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={countChartConfig} className="h-56 w-full">
          <BarChart data={top} layout="vertical" margin={{ right: 32 }}>
            <CartesianGrid horizontal={false} strokeOpacity={0.35} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="niveau"
              type="category"
              tickLine={false}
              axisLine={false}
              width={72}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.06 }}
              content={<ChartTooltipContent nameKey="niveau" />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
            >
              <LabelList
                dataKey="count"
                position="right"
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
