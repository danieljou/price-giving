"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatMontant } from "@/lib/primes/format";
import { statusToneClass } from "@/lib/status-tones";
import { ArticleFormDialog } from "./article-form-dialog";

export interface ArticleRow {
  id: string;
  code: string;
  libelle: string;
  categorie: string;
  description: string | null;
  unite: string;
  prix_reference: number;
  actif: boolean;
}

export const articleColumns: ColumnDef<ArticleRow>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "libelle",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Libellé" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.original.libelle}</p>
        {row.original.description && (
          <p className="text-xs text-muted-foreground">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "categorie",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Catégorie" />,
    cell: ({ row }) => <Badge variant="secondary">{row.original.categorie}</Badge>,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "unite",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unité" />,
  },
  {
    accessorKey: "prix_reference",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prix référence" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatMontant(row.original.prix_reference)}
      </span>
    ),
  },
  {
    accessorKey: "actif",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) =>
      row.original.actif ? (
        <Badge variant="outline" className={statusToneClass("positive")}>
          Actif
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          Inactif
        </Badge>
      ),
    filterFn: (row, id, value: string[]) =>
      value.includes(String(row.getValue(id))),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ArticleFormDialog article={row.original} />,
  },
];
