"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateNiveau } from "./actions";
import type { NiveauRow } from "./columns";

export function NiveauEditDialog({
  niveau,
}: Readonly<{ niveau: NiveauRow }>) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [section, setSection] = useState(niveau.section);
  const [code, setCode] = useState(niveau.code);
  const [progressionOrder, setProgressionOrder] = useState(
    String(niveau.progression_order)
  );

  function submit() {
    const formData = new FormData();
    formData.set("section", section);
    formData.set("code", code);
    formData.set("progression_order", progressionOrder);

    startTransition(async () => {
      const result = await updateNiveau(niveau.id, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Niveau mis à jour.");
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Modifier le niveau ${niveau.code}`}
        onClick={() => setOpen(true)}
      >
        <Pencil aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier le niveau</DialogTitle>
            <DialogDescription>
              Un changement de code se répercute uniquement sur ce niveau —
              les critères existants qui référencent l&apos;ancien code
              devront être mis à jour séparément.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`section-${niveau.id}`}>Section</Label>
              <Select
                value={section}
                onValueChange={(v) => setSection(v as typeof section)}
              >
                <SelectTrigger id={`section-${niveau.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="francophone">Francophone</SelectItem>
                  <SelectItem value="anglophone">Anglophone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`code-${niveau.id}`}>Code</Label>
              <Input
                id={`code-${niveau.id}`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`order-${niveau.id}`}>
                Ordre de progression
              </Label>
              <Input
                id={`order-${niveau.id}`}
                type="number"
                min={0}
                value={progressionOrder}
                onChange={(e) => setProgressionOrder(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={submit} disabled={isPending}>
              {isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
