"use client";

import { type Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableFacetedFilter, type FilterOption } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export interface FilterField {
  columnId: string;
  title: string;
  options: FilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filterFields?: FilterField[];
  showViewOptions?: boolean;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder,
  filterFields = [],
  showViewOptions = true,
  className,
}: DataTableToolbarProps<TData>) {
  const { t } = useTranslation();
  const isFiltered = table.getState().columnFilters.length > 0;
  const searchValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
    : "";

  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-border", className)}>
      {searchKey && (
        <div className="relative flex-1 min-w-[160px] max-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            aria-label={searchPlaceholder ?? t("table.search")}
            placeholder={searchPlaceholder ?? t("table.search")}
            value={searchValue}
            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            className="pl-8 h-8 text-xs rounded-sm"
          />
        </div>
      )}

      {filterFields.map((field) => (
        <DataTableFacetedFilter
          key={field.columnId}
          column={table.getColumn(field.columnId)}
          title={field.title}
          options={field.options}
        />
      ))}

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {t("table.reset")}
          <X className="ml-1.5 h-3 w-3" />
        </Button>
      )}

      {showViewOptions && <DataTableViewOptions table={table} />}
    </div>
  );
}
