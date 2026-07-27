"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMontant } from "@/lib/primes/format";
import { addArticleLine } from "./actions";

export interface PickerArticle {
  id: string;
  code: string;
  libelle: string;
  categorie: string;
  prix_reference: number;
}

export function ArticlePicker({
  configId,
  articles,
  existingArticleIds,
}: Readonly<{
  configId: string;
  articles: PickerArticle[];
  existingArticleIds: string[];
}>) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const available = articles.filter((a) => !existingArticleIds.includes(a.id));

  function select(article: PickerArticle) {
    startTransition(async () => {
      const result = await addArticleLine(
        configId,
        article.id,
        article.prix_reference
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}
          Ajouter un article
          <ChevronsUpDown className="opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Rechercher un article du catalogue..." />
          <CommandList>
            <CommandEmpty>Aucun article disponible.</CommandEmpty>
            <CommandGroup>
              {available.map((article) => (
                <CommandItem
                  key={article.id}
                  value={`${article.code} ${article.libelle} ${article.categorie}`}
                  onSelect={() => select(article)}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{article.libelle}</span>
                    <span className="text-xs text-muted-foreground">
                      {article.categorie} · {formatMontant(article.prix_reference)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
