"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table";
import { formatMontant } from "@/lib/primes/format";
import { deleteDepense } from "./actions";
import { DepenseFormDialog } from "./depense-form-dialog";

export interface DepenseRow {
  id: string;
  libelle: string;
  categorie: string;
  description: string | null;
  montant: number;
  observation: string | null;
}

function DeleteDepenseButton({ depense }: Readonly<{ depense: DepenseRow }>) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function remove() {
    startTransition(async () => {
      const result = await deleteDepense(depense.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Dépense « ${depense.libelle} » supprimée.`);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Supprimer la dépense ${depense.libelle}`}
      onClick={remove}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 aria-hidden="true" />
      )}
    </Button>
  );
}

export const depenseColumns: ColumnDef<DepenseRow>[] = [
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
      accessorKey: "montant",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Montant" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-foreground">
          {formatMontant(row.original.montant)}
        </span>
      ),
    },
    {
      accessorKey: "observation",
      header: "Observation",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.observation ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DepenseFormDialog depense={row.original} />
          <DeleteDepenseButton depense={row.original} />
        </div>
      ),
    },
  ];
