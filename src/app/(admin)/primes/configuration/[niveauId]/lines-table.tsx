"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { lineAmount } from "@/lib/primes/cost";
import { formatMontant } from "@/lib/primes/format";
import { removeArticleLine, updateArticleLine } from "./actions";

export interface CompositionLine {
  id: string;
  article_id: string;
  article_code: string;
  article_libelle: string;
  unite: string;
  quantite: number;
  prix_session: number;
  observation: string | null;
}

function LineRow({ line }: Readonly<{ line: CompositionLine }>) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [quantite, setQuantite] = useState(String(line.quantite));
  const [prixSession, setPrixSession] = useState(String(line.prix_session));
  const [observation, setObservation] = useState(line.observation ?? "");

  const liveTotal = lineAmount(Number(quantite) || 0, Number(prixSession) || 0);

  function save() {
    const formData = new FormData();
    formData.set("quantite", quantite);
    formData.set("prix_session", prixSession);
    formData.set("observation", observation);

    startTransition(async () => {
      const result = await updateArticleLine(line.id, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeArticleLine(line.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${line.article_libelle} retiré de la composition.`);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="max-w-45">
        <p
          className="truncate font-medium text-foreground"
          title={line.article_libelle}
        >
          {line.article_libelle}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {line.article_code}
        </p>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0.01}
          step="1"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          onBlur={save}
          className="h-8 w-20"
          disabled={isPending}
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{line.unite}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step="1"
          value={prixSession}
          onChange={(e) => setPrixSession(e.target.value)}
          onBlur={save}
          className="h-8 w-28"
          disabled={isPending}
        />
      </TableCell>
      <TableCell className="font-mono text-xs font-medium text-foreground">
        {formatMontant(liveTotal)}
      </TableCell>
      <TableCell>
        <Input
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          onBlur={save}
          placeholder="Observation (optionnel)"
          className="h-8 w-40"
          disabled={isPending}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Retirer ${line.article_libelle}`}
          onClick={remove}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 aria-hidden="true" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function LinesTable({ lines }: Readonly<{ lines: CompositionLine[] }>) {
  const total = lines.reduce(
    (sum, l) => sum + lineAmount(l.quantite, l.prix_session),
    0
  );

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          Aucun article dans cette prime
        </p>
        <p className="text-xs text-muted-foreground">
          Ajoutez des articles depuis le catalogue pour composer la prime.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>Article</TableHead>
          <TableHead>Quantité</TableHead>
          <TableHead>Unité</TableHead>
          <TableHead>Prix (session)</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Observation</TableHead>
          <TableHead className="sr-only">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={4} className="text-right font-medium text-foreground">
            Coût total de la prime
          </TableCell>
          <TableCell colSpan={3} className="font-mono text-sm font-semibold text-foreground">
            {formatMontant(total)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
