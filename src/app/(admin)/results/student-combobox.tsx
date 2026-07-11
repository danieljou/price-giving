"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quickCreateStudent } from "../students/actions";
import type { Section } from "@/lib/supabase/types";

export interface ComboStudent {
  id: string;
  first_name: string;
  last_name: string;
  section: Section;
}

interface StudentComboboxProps {
  students: ComboStudent[];
  value: string;
  onSelect: (student: ComboStudent) => void;
  /** Appends the newly created student to the caller's list. */
  onCreated: (student: ComboStudent) => void;
  invalid?: boolean;
}

export function StudentCombobox({
  students,
  value,
  onSelect,
  onCreated,
  invalid,
}: Readonly<StudentComboboxProps>) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [section, setSection] = useState<Section | "">("");

  const selected = students.find((s) => s.id === value);

  function openCreateDialog() {
    // Pre-fill the name from what the admin was searching for
    const words = search.trim().split(/\s+/);
    setLastName(words[0] ?? "");
    setFirstName(words.slice(1).join(" "));
    setSection("");
    setOpen(false);
    setCreateOpen(true);
  }

  function submitCreate() {
    if (!firstName.trim() || !lastName.trim() || !section) {
      toast.error("Nom, prénom et section sont requis.");
      return;
    }
    const formData = new FormData();
    formData.set("first_name", firstName.trim());
    formData.set("last_name", lastName.trim());
    formData.set("section", section);

    startTransition(async () => {
      const result = await quickCreateStudent(formData);
      if (result.error || !result.student) {
        toast.error(result.error ?? "Erreur lors de la création.");
        return;
      }
      toast.success(
        `${result.student.last_name} ${result.student.first_name} créé(e).`
      );
      onCreated(result.student);
      onSelect(result.student);
      setCreateOpen(false);
      setSearch("");
    });
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              `${selected.last_name} ${selected.first_name}`
            ) : (
              <span className="text-muted-foreground">
                Rechercher un étudiant…
              </span>
            )}
            <ChevronsUpDown
              className="size-4 shrink-0 opacity-50"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Nom ou prénom…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Aucun étudiant trouvé.</CommandEmpty>
              <CommandGroup>
                {students.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={`${s.last_name} ${s.first_name}`}
                    onSelect={() => {
                      onSelect(s);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        s.id === value ? "opacity-100" : "opacity-0"
                      )}
                      aria-hidden="true"
                    />
                    {s.last_name} {s.first_name}
                    <span className="ml-auto text-xs capitalize text-muted-foreground">
                      {s.section}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup forceMount>
                <CommandItem forceMount onSelect={openCreateDialog}>
                  <UserPlus className="size-4" aria-hidden="true" />
                  Ajouter un nouvel étudiant…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel étudiant</DialogTitle>
            <DialogDescription>
              Création rapide — l&apos;étudiant sera sélectionné
              automatiquement dans le formulaire.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quick-last-name">Nom</Label>
              <Input
                id="quick-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quick-first-name">Prénom</Label>
              <Input
                id="quick-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="quick-section">Section</Label>
              <Select
                value={section}
                onValueChange={(v) => setSection(v as Section)}
              >
                <SelectTrigger id="quick-section" className="w-full">
                  <SelectValue placeholder="Choisir une section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="francophone">Francophone</SelectItem>
                  <SelectItem value="anglophone">Anglophone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={submitCreate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus aria-hidden="true" />
              )}
              Créer et sélectionner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
