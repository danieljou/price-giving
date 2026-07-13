"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchStudents, type StudentSearchResult } from "@/app/(admin)/search-actions";
import { ALL_NAV_ITEMS } from "./nav-items";

/** Any component can open the palette by dispatching this window event —
 *  used by the visible "Rechercher" button since it lives outside this
 *  component's own state. */
export const OPEN_COMMAND_MENU_EVENT = "price-giving:open-command-menu";

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentSearchResult[]>([]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_MENU_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onOpenEvent);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const timeout = setTimeout(() => {
      if (trimmed.length < 2) {
        setStudents([]);
      } else {
        void searchStudents(trimmed).then(setStudents);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const matchingNavItems = ALL_NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Recherche"
      description="Rechercher un étudiant ou une page"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Rechercher un étudiant, une page…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          {matchingNavItems.length > 0 && (
            <CommandGroup heading="Navigation">
              {matchingNavItems.map((item) => (
                <CommandItem key={item.href} onSelect={() => go(item.href)}>
                  <item.icon aria-hidden="true" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {students.length > 0 && (
            <CommandGroup heading="Étudiants">
              {students.map((s) => (
                <CommandItem
                  key={s.id}
                  onSelect={() => go(`/students/${s.id}`)}
                >
                  <Users aria-hidden="true" />
                  {s.last_name} {s.first_name}
                  <span className="ml-auto text-xs capitalize text-muted-foreground">
                    {s.section}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
