"use client";

import { type Table } from "@tanstack/react-table";
import { Check, Columns3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function DataTableViewOptions<TData>({ table }: { table: Table<TData> }) {
  const { t } = useTranslation();
  const toggleable = table.getAllColumns().filter((c) => c.getCanHide());
  if (toggleable.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-sm gap-1.5 ml-auto">
          <Columns3 className="h-3.5 w-3.5" />
          {t("table.columns")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("table.columnsVisible")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleable.map((col) => {
          const visible = col.getIsVisible();
          const label = typeof col.columnDef.meta === "object" && col.columnDef.meta && "title" in col.columnDef.meta
            ? String((col.columnDef.meta as { title?: string }).title)
            : col.id;
          return (
            <button
              key={col.id}
              onClick={() => col.toggleVisibility(!visible)}
              className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-sm transition-colors hover:bg-muted text-foreground"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                  visible ? "bg-primary border-primary" : "border-input bg-transparent",
                )}
              >
                {visible && <Check className="h-3 w-3 text-primary-foreground" />}
              </span>
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
