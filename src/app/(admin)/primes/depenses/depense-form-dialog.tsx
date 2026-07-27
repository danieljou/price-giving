"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createDepense, updateDepense } from "./actions";
import type { DepenseRow } from "./columns";

const CATEGORY_SUGGESTIONS = [
  "Transport",
  "Communication",
  "Location de salle",
  "Décoration",
  "Impression",
  "Sécurité",
  "Animation",
  "Sonorisation",
  "Photographie",
  "Divers",
];

export function DepenseFormDialog({
  sessionId,
  depense,
}: Readonly<{ sessionId: string; depense?: DepenseRow }>) {
  const isEdit = !!depense;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [libelle, setLibelle] = useState(depense?.libelle ?? "");
  const [categorie, setCategorie] = useState(depense?.categorie ?? "");
  const [description, setDescription] = useState(depense?.description ?? "");
  const [montant, setMontant] = useState(depense ? String(depense.montant) : "");
  const [observation, setObservation] = useState(depense?.observation ?? "");

  function submit() {
    const formData = new FormData();
    formData.set("libelle", libelle);
    formData.set("categorie", categorie);
    formData.set("description", description ?? "");
    formData.set("montant", montant);
    formData.set("observation", observation ?? "");

    startTransition(async () => {
      const result = isEdit
        ? await updateDepense(depense.id, formData)
        : await createDepense(sessionId, formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Dépense mise à jour." : "Dépense ajoutée.");
      setOpen(false);
      if (!isEdit) {
        setLibelle("");
        setCategorie("");
        setDescription("");
        setMontant("");
        setObservation("");
      }
    });
  }

  return (
    <>
      {isEdit ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Modifier la dépense ${depense.libelle}`}
          onClick={() => setOpen(true)}
        >
          <Pencil aria-hidden="true" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          Nouvelle dépense
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier la dépense" : "Nouvelle dépense complémentaire"}
            </DialogTitle>
            <DialogDescription>
              Dépenses non directement liées aux primes (transport, location de
              salle, communication...), intégrées automatiquement au budget
              global de la session.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-libelle">Libellé</Label>
              <Input
                id="dep-libelle"
                placeholder="Location de la salle"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dep-categorie">Catégorie</Label>
                <Input
                  id="dep-categorie"
                  list="depense-category-suggestions"
                  placeholder="Location de salle"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                />
                <datalist id="depense-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dep-montant">Montant (XAF)</Label>
                <Input
                  id="dep-montant"
                  type="number"
                  step="1"
                  min={0}
                  placeholder="150000"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-description">Description (optionnel)</Label>
              <Textarea
                id="dep-description"
                rows={2}
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dep-observation">Observation (optionnel)</Label>
              <Input
                id="dep-observation"
                value={observation ?? ""}
                onChange={(e) => setObservation(e.target.value)}
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
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
