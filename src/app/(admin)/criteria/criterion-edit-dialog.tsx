"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCriterion } from "./actions";
import type { CriterionRow } from "./columns";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
};

export function CriterionEditDialog({
  criterion,
}: Readonly<{ criterion: CriterionRow }>) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [moyenneMin, setMoyenneMin] = useState(
    criterion.moyenne_min != null ? String(criterion.moyenne_min) : ""
  );
  const [moyenneMax, setMoyenneMax] = useState(
    criterion.moyenne_max != null ? String(criterion.moyenne_max) : ""
  );
  const [maxInclusive, setMaxInclusive] = useState(
    criterion.moyenne_max_inclusive
  );
  const [rangMax, setRangMax] = useState(
    criterion.rang_max != null ? String(criterion.rang_max) : ""
  );
  const [autoQualify, setAutoQualify] = useState(criterion.auto_qualify);
  const [manualReview, setManualReview] = useState(
    criterion.requires_manual_review
  );

  function submit() {
    const formData = new FormData();
    formData.set("moyenne_min", moyenneMin);
    formData.set("moyenne_max", moyenneMax);
    formData.set("moyenne_max_inclusive", String(maxInclusive));
    formData.set("rang_max", rangMax);
    formData.set("auto_qualify", String(autoQualify));
    formData.set("requires_manual_review", String(manualReview));

    startTransition(async () => {
      const result = await updateCriterion(criterion.id, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "Critère mis à jour. Pensez à recalculer les années concernées."
      );
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Modifier le critère ${criterion.niveau_depart} → ${criterion.niveau_admission ?? ""}`}
        onClick={() => setOpen(true)}
      >
        <Pencil aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {PRIZE_LABELS[criterion.prize_code] ?? criterion.prize_code} —{" "}
              {criterion.niveau_depart}
              {criterion.niveau_admission
                ? ` → ${criterion.niveau_admission}`
                : ""}
            </DialogTitle>
            <DialogDescription className="capitalize">
              Section {criterion.section}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Condition d&apos;origine : «&nbsp;{criterion.condition_raw}&nbsp;»
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`min-${criterion.id}`}>Moyenne min</Label>
                <Input
                  id={`min-${criterion.id}`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={20}
                  placeholder="—"
                  value={moyenneMin}
                  onChange={(e) => setMoyenneMin(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`max-${criterion.id}`}>Moyenne max</Label>
                <Input
                  id={`max-${criterion.id}`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={20}
                  placeholder="—"
                  value={moyenneMax}
                  onChange={(e) => setMoyenneMax(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`rang-${criterion.id}`}>Rang max</Label>
                <Input
                  id={`rang-${criterion.id}`}
                  type="number"
                  min={1}
                  placeholder="—"
                  value={rangMax}
                  onChange={(e) => setRangMax(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={maxInclusive}
                  onCheckedChange={(v) => setMaxInclusive(v === true)}
                />
                Moyenne max incluse (≤ au lieu de &lt;)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={autoQualify}
                  onCheckedChange={(v) => setAutoQualify(v === true)}
                />
                Qualification automatique (aucune condition de moyenne)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={manualReview}
                  onCheckedChange={(v) => setManualReview(v === true)}
                />
                Vérification manuelle requise (jamais attribué automatiquement)
              </label>
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
