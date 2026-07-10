"use client";

import { type Column } from "@tanstack/react-table";
import { Check, PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title: string;
  options: FilterOption[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { t } = useTranslation();
  const selected = new Set(column?.getFilterValue() as string[]);

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    column?.setFilterValue(next.size ? Array.from(next) : undefined);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-sm border-dashed gap-1.5">
          <PlusCircle className="h-3.5 w-3.5" />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              {selected.size <= 2 ? (
                Array.from(selected).map((v) => (
                  <Badge key={v} variant="secondary" className="rounded-sm px-1.5 py-0 text-[10px] font-medium">
                    {options.find((o) => o.value === v)?.label ?? v}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="rounded-sm px-1.5 py-0 text-[10px] font-medium">
                  {selected.size} {t("table.selected")}
                </Badge>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[210px] p-0" align="start">
        <div className="py-1">
          {options.map((opt) => {
            const isSelected = selected.has(opt.value);
            const count = column?.getFacetedUniqueValues()?.get(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-muted text-foreground"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                    isSelected ? "bg-primary border-primary" : "border-input bg-transparent",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </span>
                {opt.icon && <opt.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <span className="flex-1 text-left truncate">{opt.label}</span>
                {count != null && (
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground/70">{count}</span>
                )}
              </button>
            );
          })}
        </div>
        {selected.size > 0 && (
          <>
            <Separator />
            <button
              onClick={() => column?.setFilterValue(undefined)}
              className="flex w-full items-center justify-center py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("table.clearFilters")}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
