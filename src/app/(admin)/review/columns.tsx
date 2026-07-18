"use client";

import Link from "next/link";
import { Check, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { resolveManualReview } from "../results/actions";

export interface ReviewRow {
  id: string;
  student_name: string;
  section: string;
  school_year_label: string;
  niveau_depart: string;
  niveau_admission: string | null;
  notes: string[];
}

export const reviewColumns: ColumnDef<ReviewRow>[] = [
  {
    accessorKey: "student_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Étudiant" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.student_name}</span>
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
  {
    accessorKey: "school_year_label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Année" />
    ),
  },
  {
    id: "niveaux",
    header: "Départ → Admission",
    cell: ({ row }) => (
      <span>
        {row.original.niveau_depart} →{" "}
        {row.original.niveau_admission ?? "—"}
      </span>
    ),
  },
  {
    id: "notes",
    header: "Condition à vérifier",
    cell: ({ row }) => (
      <ul className="list-disc space-y-0.5 pl-4 text-sm">
        {row.original.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Modifier le résultat" asChild>
          <Link href={`/results/${row.original.id}/edit`}>
            <Pencil aria-hidden="true" />
          </Link>
        </Button>
        <form action={resolveManualReview.bind(null, row.original.id)}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Marquer comme vérifié"
          >
            <Check aria-hidden="true" />
          </Button>
        </form>
      </div>
    ),
  },
];
