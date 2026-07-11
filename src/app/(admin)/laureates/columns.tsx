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
  /** Free-text transition as written on the official list (e.g. "6e M1 → 5e M1"). */
  classe_texte: string | null;
  moyenne: number | null;
  rang: number | null;
  awarded_prizes: string[];
  section: string;
  student_name: string;
  school_year_label: string;
}

/** Display transition: the admin's free text wins over the normalized codes. */
export function classeDisplay(row: LaureateRow): string {
  return (
    row.classe_texte ??
    `${row.niveau_depart} → ${row.niveau_admission ?? "—"}`
  );
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
    header: "Classe (départ → arrivée)",
    cell: ({ row }) => <span>{classeDisplay(row.original)}</span>,
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
