"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import type { Section } from "@/lib/supabase/types";

export interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  section: Section;
}

export const studentColumns: ColumnDef<StudentRow>[] = [
  {
    accessorKey: "last_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nom" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/students/${row.original.id}`}
        className="font-medium text-foreground hover:underline"
      >
        {row.original.last_name}
      </Link>
    ),
  },
  {
    accessorKey: "first_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prénom" />
    ),
  },
  {
    accessorKey: "section",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.original.section}</span>
    ),
  },
];
