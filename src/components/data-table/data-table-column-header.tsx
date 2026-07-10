"use client";

import { type Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation();

  if (!column.getCanSort()) {
    return <span className={cn("font-semibold", className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
          >
            {title}
            {sorted === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : sorted === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : (
              <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="text-xs">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="gap-2">
            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
            {t("table.sortAsc")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="gap-2">
            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
            {t("table.sortDesc")}
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)} className="gap-2">
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                {t("table.hide")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
