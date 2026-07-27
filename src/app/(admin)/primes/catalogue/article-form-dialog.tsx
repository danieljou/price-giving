"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createArticle, updateArticle } from "./actions";
import type { ArticleRow } from "./columns";

const CATEGORY_SUGGESTIONS = [
  "Fournitures",
  "Matériel scolaire",
  "Habillement",
  "Récompense",
  "Électronique",
  "Livres",
];

export function ArticleFormDialog({
  article,
}: Readonly<{ article?: ArticleRow }>) {
  const isEdit = !!article;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(article?.code ?? "");
  const [libelle, setLibelle] = useState(article?.libelle ?? "");
  const [categorie, setCategorie] = useState(article?.categorie ?? "");
  const [description, setDescription] = useState(article?.description ?? "");
  const [unite, setUnite] = useState(article?.unite ?? "unité");
  const [prixReference, setPrixReference] = useState(
    article ? String(article.prix_reference) : ""
  );
  const [actif, setActif] = useState(article?.actif ?? true);

  function submit() {
    const formData = new FormData();
    formData.set("code", code);
    formData.set("libelle", libelle);
    formData.set("categorie", categorie);
    formData.set("description", description ?? "");
    formData.set("unite", unite);
    formData.set("prix_reference", prixReference);
    formData.set("actif", String(actif));

    startTransition(async () => {
      const result = isEdit
        ? await updateArticle(article.id, formData)
        : await createArticle(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Article mis à jour." : "Article ajouté au catalogue.");
      setOpen(false);
      if (!isEdit) {
        setCode("");
        setLibelle("");
        setCategorie("");
        setDescription("");
        setUnite("unité");
        setPrixReference("");
        setActif(true);
      }
    });
  }

  return (
    <>
      {isEdit ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Modifier l'article ${article.libelle}`}
          onClick={() => setOpen(true)}
        >
          <Pencil aria-hidden="true" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          Nouvel article
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier l'article" : "Nouvel article"}
            </DialogTitle>
            <DialogDescription>
              Le prix de référence sert de valeur par défaut lors de la
              configuration d&apos;une session — il peut y être personnalisé
              sans jamais modifier cette fiche.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="art-code">Code</Label>
                <Input
                  id="art-code"
                  placeholder="CAH-200"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="art-libelle">Libellé</Label>
                <Input
                  id="art-libelle"
                  placeholder="Cahier 200 pages"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="art-categorie">Catégorie</Label>
                <Input
                  id="art-categorie"
                  list="article-category-suggestions"
                  placeholder="Fournitures"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                />
                <datalist id="article-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="art-unite">Unité</Label>
                <Input
                  id="art-unite"
                  placeholder="unité"
                  value={unite}
                  onChange={(e) => setUnite(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="art-prix">Prix de référence (XAF)</Label>
              <Input
                id="art-prix"
                type="number"
                step="1"
                min={0}
                placeholder="350"
                value={prixReference}
                onChange={(e) => setPrixReference(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="art-description">Description (optionnel)</Label>
              <Textarea
                id="art-description"
                rows={2}
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={actif}
                onCheckedChange={(v) => setActif(v === true)}
              />
              Article actif (proposé lors des configurations)
            </label>
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
