"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { typePrimeIcon, typePrimeBadgeClass } from "@/lib/primes/prize-visuals";
import { formatMontant } from "@/lib/primes/format";
import { ArticlePicker, type PickerArticle } from "./article-picker";
import { LinesTable, type CompositionLine } from "./lines-table";

export interface TabData {
  typePrimeId: string;
  code: string;
  libelle: string;
  configId: string;
  lines: CompositionLine[];
  cost: number;
  beneficiaries: number;
}

export function NiveauEditorTabs({
  tabs,
  defaultTypeId,
  articles,
}: Readonly<{
  tabs: TabData[];
  defaultTypeId: string;
  articles: PickerArticle[];
}>) {
  const [activeId, setActiveId] = useState(defaultTypeId);
  const active = tabs.find((t) => t.typePrimeId === activeId) ?? tabs[0];

  if (!active) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun type de prime actif n&apos;est configuré.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Types de prime">
        {tabs.map((tab) => {
          const Icon = typePrimeIcon(tab.code);
          const isActive = tab.typePrimeId === active.typePrimeId;
          return (
            <button
              key={tab.typePrimeId}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.typePrimeId)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? cn("border-transparent", typePrimeBadgeClass(tab.code))
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {tab.libelle}
              <span className="font-mono text-xs opacity-70">
                {tab.lines.length > 0 ? formatMontant(tab.cost) : "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Coût de la prime
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {formatMontant(active.cost)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Bénéficiaires
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {active.beneficiaries}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              Budget estimé
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
              {formatMontant(active.cost * active.beneficiaries)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Composition — {active.libelle}</CardTitle>
          <ArticlePicker
            configId={active.configId}
            articles={articles}
            existingArticleIds={active.lines.map((l) => l.article_id)}
          />
        </CardHeader>
        <CardContent>
          <LinesTable lines={active.lines} />
        </CardContent>
      </Card>
    </div>
  );
}
