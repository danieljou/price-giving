"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  awarded_prizes: string[];
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
    header: "Départ → Admission",
    cell: ({ row }) => (
      <span>
        {row.original.niveau_depart} → {row.original.niveau_admission ?? "—"}
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
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/results/${row.original.id}/edit`}>Modifier</Link>
      </Button>
    ),
  },
];
