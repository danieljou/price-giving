"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { statusToneClass } from "@/lib/status-tones";
import { UserRowActions } from "./user-row-actions";
import type { AppUserRow } from "./queries";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function getUserColumns(currentUserId: string): ColumnDef<AppUserRow>[] {
  return [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.email ?? "—"}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Téléphone" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.phone ?? "—"}</span>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rôle" />
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={statusToneClass(
            row.original.role === "admin" ? "positive" : "pending"
          )}
        >
          {row.original.role === "admin" ? "Admin" : "Saisie"}
        </Badge>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "last_sign_in_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dernière connexion" />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.last_sign_in_at)}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Créé le" />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <UserRowActions
          userId={row.original.id}
          role={row.original.role}
          email={row.original.email}
          isSelf={row.original.id === currentUserId}
        />
      ),
    },
  ];
}
