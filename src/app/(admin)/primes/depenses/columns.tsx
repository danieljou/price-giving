"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { History, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  history?: React.ReactNode;
}

function DepenseHistoryButton({ depense }: Readonly<{ depense: DepenseRow }>) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Historique de ${depense.libelle}`}
        >
          <History aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historique — {depense.libelle}</DialogTitle>
        </DialogHeader>
        {depense.history}
      </DialogContent>
    </Dialog>
  );
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
        <div className="max-w-56">
          <p
            className="truncate font-medium text-foreground"
            title={row.original.libelle}
          >
            {row.original.libelle}
          </p>
          {row.original.description && (
            <p
              className="truncate text-xs text-muted-foreground"
              title={row.original.description}
            >
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
        <span
          className="block max-w-40 truncate text-xs text-muted-foreground"
          title={row.original.observation ?? undefined}
        >
          {row.original.observation ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DepenseHistoryButton depense={row.original} />
          <DepenseFormDialog depense={row.original} />
          <DeleteDepenseButton depense={row.original} />
        </div>
      ),
    },
  ];
