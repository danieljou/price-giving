"use client";

import { ArrowLeft, ChartColumn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NiveauBarChart,
  PrizeBarChart,
  SectionBarChart,
  type NiveauCount,
  type PrizeCount,
  type SectionCount,
} from "../dashboard/charts";
import type { LaureateRow } from "./columns";

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

interface StatsSheetProps {
  /** The currently filtered rows shown on the page — stats reflect exactly what's on screen. */
  rows: LaureateRow[];
  scopeLabel: string;
}

/** Slide-out panel with a chart breakdown of the currently filtered laureates
 *  (prize / section / niveau) — a scoped, at-a-glance complement to the
 *  full-history charts on the dashboard. */
export function StatsSheet({ rows, scopeLabel }: Readonly<StatsSheetProps>) {
  const laureates = rows.filter((r) => r.awarded_prizes.length > 0);

  const prizeCounts: PrizeCount[] = [
    ...countBy(
      laureates.flatMap((r) => r.awarded_prizes),
      (code) => code
    ).entries(),
  ].map(([prize, count]) => ({ prize, count }));

  const sectionCounts: SectionCount[] = ["francophone", "anglophone"].map(
    (section) => ({
      section,
      count: laureates.filter((r) => r.section === section).length,
    })
  );

  const niveauCounts: NiveauCount[] = [
    ...countBy(laureates, (r) => r.niveau_depart).entries(),
  ].map(([niveau, count]) => ({ niveau, count }));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <ArrowLeft aria-hidden="true" />
          Statistiques
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1.5">
            <ChartColumn className="size-4" aria-hidden="true" />
            Statistiques
          </SheetTitle>
          <SheetDescription>
            {laureates.length} lauréat{laureates.length > 1 ? "s" : ""} — {scopeLabel}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          {laureates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun lauréat pour les filtres actuels.
            </p>
          ) : (
            <>
              <PrizeBarChart data={prizeCounts} />
              <SectionBarChart data={sectionCounts} />
              <NiveauBarChart data={niveauCounts} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
