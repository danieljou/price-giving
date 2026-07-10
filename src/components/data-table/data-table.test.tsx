import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { resolvedLanguage: "fr" } }),
}));

import { DataTable } from "./data-table";
import { DataTableColumnHeader } from "./data-table-column-header";

type Row = { id: string; name: string; n: number };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name", cell: ({ row }) => row.original.name },
  {
    accessorKey: "n",
    header: ({ column }) => <DataTableColumnHeader column={column} title="N" />,
    cell: ({ row }) => row.original.n,
  },
];

const data: Row[] = [
  { id: "1", name: "Alpha", n: 2 },
  { id: "2", name: "Beta", n: 1 },
];

describe("DataTable", () => {
  it("rend les lignes de données", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("rend un en-tête de colonne triable", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByRole("button", { name: /N/ })).toBeInTheDocument();
  });

  it("affiche l'état vide", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("table.empty")).toBeInTheDocument();
  });

  it("affiche des skeletons en chargement (pas d'état vide)", () => {
    render(<DataTable columns={columns} data={[]} isLoading />);
    expect(screen.queryByText("table.empty")).not.toBeInTheDocument();
  });

  it("affiche la pagination au-delà de la taille de page", () => {
    const many: Row[] = Array.from({ length: 14 }, (_, i) => ({ id: String(i), name: `R${i}`, n: i }));
    render(<DataTable columns={columns} data={many} pageSize={5} />);
    expect(screen.getByLabelText("table.nextPage")).toBeInTheDocument();
  });

  it("masque la pagination si une seule page", () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    expect(screen.queryByLabelText("table.nextPage")).not.toBeInTheDocument();
  });
});
