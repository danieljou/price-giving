"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCriterion } from "./actions";

const PRIZE_LABELS: Record<string, string> = {
  SPECIAL: "Prix Spécial",
  EXC: "Prix d'Excellence",
  ENC: "Prix d'Encouragement",
};

interface NiveauOption {
  section: string;
  code: string;
}

export function CriterionCreateDialog({
  niveaux,
}: Readonly<{ niveaux: NiveauOption[] }>) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [prizeCode, setPrizeCode] = useState("");
  const [section, setSection] = useState("");
  const [niveauDepart, setNiveauDepart] = useState("");
  const [niveauAdmission, setNiveauAdmission] = useState("");
  const [conditionRaw, setConditionRaw] = useState("");
  const [moyenneMin, setMoyenneMin] = useState("");
  const [moyenneMax, setMoyenneMax] = useState("");
  const [maxInclusive, setMaxInclusive] = useState(true);
  const [rangMax, setRangMax] = useState("");
  const [autoQualify, setAutoQualify] = useState(false);
  const [manualReview, setManualReview] = useState(false);

  const niveauOptions = niveaux.filter((n) => n.section === section);

  function reset() {
    setPrizeCode("");
    setSection("");
    setNiveauDepart("");
    setNiveauAdmission("");
    setConditionRaw("");
    setMoyenneMin("");
    setMoyenneMax("");
    setMaxInclusive(true);
    setRangMax("");
    setAutoQualify(false);
    setManualReview(false);
  }

  function submit() {
    const formData = new FormData();
    formData.set("prize_code", prizeCode);
    formData.set("section", section);
    formData.set("niveau_depart", niveauDepart);
    formData.set("niveau_admission", niveauAdmission);
    formData.set("condition_raw", conditionRaw);
    formData.set("moyenne_min", moyenneMin);
    formData.set("moyenne_max", moyenneMax);
    formData.set("moyenne_max_inclusive", String(maxInclusive));
    formData.set("rang_max", rangMax);
    formData.set("auto_qualify", String(autoQualify));
    formData.set("requires_manual_review", String(manualReview));

    startTransition(async () => {
      const result = await createCriterion(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Critère créé.");
      reset();
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Nouveau critère
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau critère</DialogTitle>
            <DialogDescription>
              Condition d&apos;attribution pour une transition de niveau.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-prize-code">Prix</Label>
                <Select value={prizeCode} onValueChange={setPrizeCode}>
                  <SelectTrigger id="new-prize-code" className="w-full">
                    <SelectValue placeholder="Choisir un prix" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIZE_LABELS).map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-section">Section</Label>
                <Select
                  value={section}
                  onValueChange={(v) => {
                    setSection(v);
                    setNiveauDepart("");
                    setNiveauAdmission("");
                  }}
                >
                  <SelectTrigger id="new-section" className="w-full">
                    <SelectValue placeholder="Choisir une section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="francophone">Francophone</SelectItem>
                    <SelectItem value="anglophone">Anglophone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-niveau-depart">Niveau départ</Label>
                <Select
                  value={niveauDepart}
                  onValueChange={setNiveauDepart}
                  disabled={!section}
                >
                  <SelectTrigger id="new-niveau-depart" className="w-full">
                    <SelectValue placeholder="Niveau départ" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveauOptions.map((n) => (
                      <SelectItem key={n.code} value={n.code}>
                        {n.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-niveau-admission">
                  Niveau admission (optionnel)
                </Label>
                <Select
                  value={niveauAdmission}
                  onValueChange={setNiveauAdmission}
                  disabled={!section}
                >
                  <SelectTrigger id="new-niveau-admission" className="w-full">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveauOptions.map((n) => (
                      <SelectItem key={n.code} value={n.code}>
                        {n.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-condition-raw">
                Condition (description affichée)
              </Label>
              <Input
                id="new-condition-raw"
                placeholder="ex. UNIVERSITE 1 -> UNIVERSITE 2"
                value={conditionRaw}
                onChange={(e) => setConditionRaw(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-moyenne-min">Moyenne min</Label>
                <Input
                  id="new-moyenne-min"
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
                <Label htmlFor="new-moyenne-max">Moyenne max</Label>
                <Input
                  id="new-moyenne-max"
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
                <Label htmlFor="new-rang-max">Rang max</Label>
                <Input
                  id="new-rang-max"
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
            <Button
              onClick={submit}
              disabled={
                isPending ||
                !prizeCode ||
                !section ||
                !niveauDepart ||
                !conditionRaw
              }
            >
              {isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
