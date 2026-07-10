"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";

export interface SchoolYearRow {
  id: string;
  label: string;
  start_year: number;
}

export const schoolYearColumns: ColumnDef<SchoolYearRow>[] = [
  {
    accessorKey: "label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Libellé" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.label}</span>
    ),
  },
  {
    accessorKey: "start_year",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Année de début" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.start_year}</span>
    ),
  },
];
