"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type RowData,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

// Permet `meta: { title }` sur les colonnes (libellé pour le sélecteur de colonnes)
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    title?: string;
  }
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar, type FilterField } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Clé de colonne pour la recherche texte (toolbar) */
  searchKey?: string;
  searchPlaceholder?: string;
  /** Filtres facettés (toolbar) */
  filterFields?: FilterField[];
  /** Affiche le sélecteur de colonnes visibles */
  showViewOptions?: boolean;
  /** Affiche la pagination */
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyContent?: React.ReactNode;
  /** Affiche des lignes skeleton pendant le chargement */
  isLoading?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  filterFields = [],
  showViewOptions = false,
  pagination = true,
  pageSize = 10,
  pageSizeOptions,
  emptyContent,
  isLoading = false,
  className,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // DataTableFacetedFilter always stores its selection as a string[], which
  // needs an "is the row's value one of the selected options" filter rather
  // than the column's default (e.g. "includesString", which breaks — and
  // hides every row — as soon as 2+ checkboxes are selected). Applied here
  // instead of per-column so any column wired to a checkbox filter gets it
  // for free (mirrors the manual filterFn already used in criteria/columns.tsx).
  const facetedColumnIds = React.useMemo(
    () => new Set(filterFields.map((f) => f.columnId)),
    [filterFields]
  );
  const resolvedColumns = React.useMemo(() => {
    if (facetedColumnIds.size === 0) return columns;
    return columns.map((col) => {
      const id = col.id ?? ("accessorKey" in col ? String(col.accessorKey) : undefined);
      if (id && facetedColumnIds.has(id) && !col.filterFn) {
        return {
          ...col,
          filterFn: (row: Row<TData>, columnId: string, value: string[]) =>
            value.includes(row.getValue(columnId)),
        };
      }
      return col;
    });
  }, [columns, facetedColumnIds]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize } },
  });

  const hasToolbar = !!searchKey || filterFields.length > 0 || showViewOptions;
  const colCount = table.getAllColumns().length;

  return (
    <div className={cn("bg-card ring-1 ring-foreground/10 rounded-sm overflow-hidden", className)}>
      {hasToolbar && (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          filterFields={filterFields}
          showViewOptions={showViewOptions}
        />
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : header.column.getCanSort()
                              ? "none"
                              : undefined
                      }
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      className="h-9 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="border-b border-border">
                  {Array.from({ length: colCount }).map((__, j) => (
                    <TableCell key={j} className="px-3 py-3">
                      <Skeleton className="h-3 w-full rounded-sm" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colCount} className="p-0">
                  {emptyContent ?? (
                    <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                      {t("table.empty")}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && !isLoading && table.getPageCount() > 1 && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
}
