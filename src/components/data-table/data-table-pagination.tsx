"use client";

import { type Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 50],
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">{t("table.rows")}</span>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger size="sm" className="w-[64px] rounded-sm" aria-label={t("table.rows")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={`${n}`}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {t("table.page")}{" "}
          <span className="font-semibold text-foreground">
            {table.getState().pagination.pageIndex + 1}
          </span>{" "}
          {t("table.of")} {table.getPageCount()}
        </span>

        <div className="flex items-center gap-0.5 ml-1">
          <Button variant="outline" size="icon-sm" className="rounded-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label={t("table.firstPage")}>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon-sm" className="rounded-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label={t("table.prevPage")}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon-sm" className="rounded-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label={t("table.nextPage")}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon-sm" className="rounded-sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} aria-label={t("table.lastPage")}>
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
