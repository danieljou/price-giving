"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Gavel, Pencil, RotateCcw, StickyNote } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { reopenManualReview, resolveManualReview } from "../results/actions";
import type { PrizeCode } from "@/lib/supabase/types";
import { typePrimeBadgeClass } from "@/lib/primes/prize-visuals";
import { statusToneClass } from "@/lib/status-tones";

const PRIZE_LABELS: Record<string, string> = {
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

export interface LaureateRow {
  id: string;
  niveau_depart: string;
  niveau_admission: string | null;
  /** Free-text transition as written on the official list (e.g. "6e M1 → 5e M1"). */
  classe_texte: string | null;
  moyenne: number | null;
  rang: number | null;
  awarded_prizes: string[];
  /** True when nothing was auto-awarded but a criterion needs a human call (e.g. an exam-pass condition like BEPC/PROBATOIRE/BACC not present in yearly data). */
  pending_review: boolean;
  /** True once an admin has marked a manual-review result as decided (reversible via reopenManualReview). */
  deliberated: boolean;
  notes: string | null;
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

function ResolveManualReviewMenu({
  resultId,
}: Readonly<{ resultId: string }>) {
  const [isPending, startTransition] = useTransition();

  function resolve(code: PrizeCode | null) {
    startTransition(async () => {
      const result = await resolveManualReview(resultId, code);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Délibérer"
          disabled={isPending}
        >
          <Gavel aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Attribuer</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DELIBERATION_PRIZE_OPTIONS.map((code) => (
          <DropdownMenuItem key={code} onClick={() => resolve(code)}>
            {PRIZE_LABELS[code]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => resolve(null)}>
          Aucun prix
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ReopenManualReviewButton({
  resultId,
}: Readonly<{ resultId: string }>) {
  const [isPending, startTransition] = useTransition();

  function reopen() {
    startTransition(async () => {
      const result = await reopenManualReview(resultId);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Revenir à non délibéré"
      disabled={isPending}
      onClick={reopen}
    >
      <RotateCcw aria-hidden="true" />
    </Button>
  );
}

export function getLaureateColumns(
  isAdmin: boolean
): ColumnDef<LaureateRow>[] {
  return [
  {
    id: "index",
    header: "N°",
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">{row.index + 1}</span>
    ),
  },
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
    cell: ({ row }) => {
      const prizeBadges = row.original.awarded_prizes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {row.original.awarded_prizes.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className={typePrimeBadgeClass(code)}
            >
              {PRIZE_LABELS[code] ?? code}
            </Badge>
          ))}
        </div>
      );

      if (row.original.pending_review) {
        return (
          <div className="flex items-center gap-1.5">
            {prizeBadges}
            <Badge variant="outline" className={statusToneClass("pending")}>
              Décision à prendre
            </Badge>
            {isAdmin && <ResolveManualReviewMenu resultId={row.original.id} />}
          </div>
        );
      }

      if (row.original.deliberated) {
        return (
          <div className="flex items-center gap-1.5">
            {prizeBadges}
            <Badge variant="outline" className={statusToneClass("positive")}>
              Délibéré
            </Badge>
            {isAdmin && <ReopenManualReviewButton resultId={row.original.id} />}
          </div>
        );
      }

      return prizeBadges || <span className="text-muted-foreground">—</span>;
    },
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
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Modifier le résultat de ${row.original.student_name}`}
        asChild
      >
        <Link href={`/results/${row.original.id}/edit`}>
          <Pencil aria-hidden="true" />
        </Link>
      </Button>
    ),
  },
  ];
}
