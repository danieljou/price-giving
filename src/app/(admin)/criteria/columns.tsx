"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { typePrimeBadgeClass } from "@/lib/primes/prize-visuals";
import { statusToneClass } from "@/lib/status-tones";
import { CriterionEditDialog } from "./criterion-edit-dialog";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Excellence",
  ENC: "Encouragement",
};

export interface CriterionRow {
  id: string;
  prize_code: string;
  section: string;
  niveau_depart: string;
  niveau_admission: string | null;
  moyenne_min: number | null;
  moyenne_max: number | null;
  moyenne_max_inclusive: boolean;
  rang_max: number | null;
  auto_qualify: boolean;
  requires_manual_review: boolean;
  condition_raw: string;
}

/** Human-readable rendering of the structured condition. */
export function conditionSummary(c: CriterionRow): string {
  if (c.auto_qualify) return "Automatique";
  if (c.requires_manual_review) return "Vérification manuelle";
  const parts: string[] = [];
  if (c.moyenne_min != null && c.moyenne_max != null) {
    parts.push(
      `${c.moyenne_min} ≤ moyenne ${c.moyenne_max_inclusive ? "≤" : "<"} ${c.moyenne_max}`
    );
  } else if (c.moyenne_min != null) {
    parts.push(`moyenne ≥ ${c.moyenne_min}`);
  } else if (c.moyenne_max != null) {
    parts.push(
      `moyenne ${c.moyenne_max_inclusive ? "≤" : "<"} ${c.moyenne_max}`
    );
  }
  if (c.rang_max != null) parts.push(`rang ≤ ${c.rang_max}`);
  return parts.length > 0 ? parts.join(" et ") : "—";
}

export const criteriaColumns: ColumnDef<CriterionRow>[] = [
  {
    accessorKey: "prize_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prix" />
    ),
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className={typePrimeBadgeClass(row.original.prize_code)}
      >
        {PRIZE_LABELS[row.original.prize_code] ?? row.original.prize_code}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) =>
      value.includes(row.getValue(id)),
  },
  {
    accessorKey: "section",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Section" />
    ),
    cell: ({ row }) => (
      <span className="capitalize">{row.original.section}</span>
    ),
    filterFn: (row, id, value: string[]) =>
      value.includes(row.getValue(id)),
  },
  {
    id: "transition",
    header: "Départ → Admission",
    cell: ({ row }) => (
      <span>
        {row.original.niveau_depart}
        {row.original.niveau_admission
          ? ` → ${row.original.niveau_admission}`
          : ""}
      </span>
    ),
  },
  {
    id: "condition",
    header: "Condition appliquée",
    cell: ({ row }) => {
      const c = row.original;
      if (c.requires_manual_review) {
        return (
          <Badge variant="outline" className={statusToneClass("pending")}>
            Vérification manuelle
          </Badge>
        );
      }
      if (c.auto_qualify) {
        return (
          <Badge variant="outline" className={statusToneClass("positive")}>
            Automatique
          </Badge>
        );
      }
      return <span className="font-mono text-xs">{conditionSummary(c)}</span>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <CriterionEditDialog criterion={row.original} />,
  },
];
