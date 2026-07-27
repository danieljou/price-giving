"use client";

import Link from "next/link";
import { StickyNote } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

export interface StudentResultRow {
  id: string;
  moyenne: number | null;
  rang: number | null;
  niveau_depart: string;
  niveau_admission: string | null;
  classe_texte: string | null;
  awarded_prizes: string[];
  notes: string | null;
  school_year_label: string;
}

export const studentResultColumns: ColumnDef<StudentResultRow>[] = [
  {
    accessorKey: "school_year_label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Année" />
    ),
  },
  {
    id: "niveaux",
    header: "Classe (départ → arrivée)",
    cell: ({ row }) => (
      <span>
        {row.original.classe_texte ??
          `${row.original.niveau_depart} → ${row.original.niveau_admission ?? "—"}`}
      </span>
    ),
  },
  {
    accessorKey: "moyenne",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Moyenne" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">
        {row.original.moyenne != null ? `${row.original.moyenne}/20` : "—"}
      </span>
    ),
  },
  {
    accessorKey: "rang",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rang" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.rang ?? "—"}</span>
    ),
  },
  {
    id: "prizes",
    header: "Prix",
    cell: ({ row }) =>
      row.original.awarded_prizes.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {row.original.awarded_prizes.map((code) => (
            <Badge key={code} variant="secondary">
              {PRIZE_LABELS[code] ?? code}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "notes",
    header: () => <span className="sr-only">Notes</span>,
    cell: ({ row }) =>
      row.original.notes ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <StickyNote
              className="h-4 w-4 text-muted-foreground"
              aria-label="Notes"
            />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs whitespace-pre-wrap text-left">
            {row.original.notes}
          </TooltipContent>
        </Tooltip>
      ) : null,
  },
  {
    id: "actions",
    enableHiding: false,
    header: "",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/results/${row.original.id}/edit`}>Modifier</Link>
      </Button>
    ),
  },
];
