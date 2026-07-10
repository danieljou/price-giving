"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

export interface LaureateRow {
  id: string;
  niveau_depart: string;
  niveau_admission: string | null;
  moyenne: number | null;
  rang: number | null;
  awarded_prizes: string[];
  section: string;
  student_name: string;
  school_year_label: string;
}

export const laureateColumns: ColumnDef<LaureateRow>[] = [
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
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.awarded_prizes.map((code) => (
          <Badge key={code} variant="secondary">
            {PRIZE_LABELS[code] ?? code}
          </Badge>
        ))}
      </div>
    ),
  },
];
