"use client";

import Link from "next/link";
import { Gavel, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveManualReview } from "../results/actions";
import type { PrizeCode } from "@/lib/supabase/types";

const PRIZE_LABELS: Record<PrizeCode, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

const DELIBERATION_PRIZE_OPTIONS: PrizeCode[] = [
  "SPECIAL",
  "EXC",
  "ENC",
  "EXC_PLUS",
];

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Délibérer">
              <Gavel aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Attribuer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DELIBERATION_PRIZE_OPTIONS.map((code) => (
              <DropdownMenuItem
                key={code}
                onClick={() => void resolveManualReview(row.original.id, code)}
              >
                {PRIZE_LABELS[code]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void resolveManualReview(row.original.id, null)}
            >
              Aucun prix
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
