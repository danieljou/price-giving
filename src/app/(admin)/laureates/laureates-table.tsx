"use client";

import { DataTable } from "@/components/data-table";
import { getLaureateColumns, type LaureateRow } from "./columns";

interface LaureatesTableProps {
  rows: LaureateRow[];
  canDeliberate: boolean;
}

/** Thin client wrapper — `getLaureateColumns` lives in a "use client" module,
 *  so it must be called from client code, not synchronously from the
 *  server-rendered laureates page. */
export function LaureatesTable({
  rows,
  canDeliberate,
}: Readonly<LaureatesTableProps>) {
  return (
    <DataTable
      columns={getLaureateColumns(canDeliberate)}
      data={rows}
      searchKey="student_name"
      searchPlaceholder="Rechercher un lauréat..."
      emptyContent={
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Aucun lauréat pour ces filtres
          </p>
          <p className="text-sm text-muted-foreground">
            Modifiez les filtres ou saisissez de nouveaux résultats.
          </p>
        </div>
      }
    />
  );
}
