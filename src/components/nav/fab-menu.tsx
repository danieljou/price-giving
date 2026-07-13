"use client";

import Link from "next/link";
import { Plus, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { FAB_NAV_ITEMS } from "./nav-items";
import { ThemeToggleFabRow } from "./theme-toggle";

interface FabMenuProps {
  onLogout: () => Promise<void>;
}

export function FabMenu({ onLogout }: Readonly<FabMenuProps>) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Plus d'options"
          className="fixed right-4 bottom-18 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="mb-16 rounded-t-xl md:hidden">
        <SheetHeader>
          <SheetTitle>Plus d&apos;options</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-6">
          {FAB_NAV_ITEMS.map((item) => (
            <SheetClose key={item.href} asChild>
              <Link
                href={item.href}
                className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <item.icon
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </SheetClose>
          ))}
          <ThemeToggleFabRow />
          <form action={onLogout}>
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
            >
              <LogOut className="size-5" aria-hidden="true" />
              Déconnexion
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
