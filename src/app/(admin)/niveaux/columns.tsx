"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { NiveauEditDialog } from "./niveau-edit-dialog";

export interface NiveauRow {
  id: string;
  section: string;
  code: string;
  progression_order: number;
}

export const niveauColumns: ColumnDef<NiveauRow>[] = [
  {
    accessorKey: "section",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.original.section}</span>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "progression_order",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ordre" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.progression_order}</span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <NiveauEditDialog niveau={row.original} />,
  },
];
