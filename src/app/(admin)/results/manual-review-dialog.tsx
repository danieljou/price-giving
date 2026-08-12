"use client";

import { useState, useTransition } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveManualReview } from "./actions";
import type { PrizeCode } from "@/lib/supabase/types";

export const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
  EXC_PLUS: "Prix d'Excellence+",
};

const DELIBERATION_PRIZE_OPTIONS: PrizeCode[] = [
  "SPECIAL",
  "EXC",
  "ENC",
  "EXC_PLUS",
];

/** Deliberation dialog for manual review: lets an admin award zero, one, or
 *  several prizes at once (e.g. EXC and ENC together) in a single call to
 *  resolveManualReview, instead of one prize per click. Shared between the
 *  review queue and the laureates table.
 *
 *  Pre-checks whatever prizes the result already has (awardedPrizes) —
 *  resolveManualReview overwrites awarded_prizes wholesale, so a result that
 *  already auto-qualified for one prize (e.g. ENC) but needs a manual call on
 *  another (e.g. EXC) would otherwise lose the ENC the moment an admin opens
 *  this dialog and hits Valider without re-checking it. */
export function ManualReviewDialog({
  resultId,
  awardedPrizes = [],
  size = "icon",
}: Readonly<{
  resultId: string;
  awardedPrizes?: PrizeCode[];
  size?: "icon" | "icon-sm";
}>) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PrizeCode[]>(awardedPrizes);
  const [isPending, startTransition] = useTransition();

  function openDialog() {
    setSelected(awardedPrizes);
    setOpen(true);
  }

  function toggle(code: PrizeCode, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, code] : prev.filter((c) => c !== code)
    );
  }

  function submit() {
    startTransition(async () => {
      const result = await resolveManualReview(resultId, selected);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        selected.length > 0
          ? "Délibération enregistrée."
          : "Aucun prix attribué."
      );
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        aria-label="Délibérer"
        onClick={openDialog}
      >
        <Gavel aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Délibération manuelle</DialogTitle>
            <DialogDescription>
              Sélectionnez un ou plusieurs prix à attribuer (aucune case
              cochée = aucun prix). Les prix déjà attribués sont précochés.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {DELIBERATION_PRIZE_OPTIONS.map((code) => (
              <label key={code} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(code)}
                  onCheckedChange={(v) => toggle(code, v === true)}
                />
                {PRIZE_LABELS[code]}
              </label>
            ))}
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
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
