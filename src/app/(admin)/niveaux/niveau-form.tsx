"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNiveau } from "./actions";
import { niveauSchema, type NiveauValues } from "./schema";

export function NiveauForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NiveauValues>({
    resolver: zodResolver(niveauSchema),
  });

  function onSubmit(values: NiveauValues) {
    setServerError(null);
    const formData = new FormData();
    formData.set("section", values.section);
    formData.set("code", values.code);
    formData.set("progression_order", values.progression_order);

    startTransition(async () => {
      const result = await createNiveau(formData);
      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
      } else {
        reset();
        toast.success(`Niveau ${values.code} ajouté.`);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="section">Section</Label>
        <Controller
          name="section"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="section"
                className="w-full"
                aria-invalid={!!errors.section}
              >
                <SelectValue placeholder="Choisir une section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="francophone">Francophone</SelectItem>
                <SelectItem value="anglophone">Anglophone</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.section && (
          <p className="text-sm text-destructive">{errors.section.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Code (ex. UNIVERSITE 1, 6e, FORM 3)</Label>
        <Input
          id="code"
          placeholder="UNIVERSITE 1"
          aria-invalid={!!errors.code}
          {...register("code")}
        />
        {errors.code && (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="progression_order">
          Ordre de progression (rang dans le cursus)
        </Label>
        <Input
          id="progression_order"
          type="number"
          min={0}
          placeholder="16"
          aria-invalid={!!errors.progression_order}
          {...register("progression_order")}
        />
        {errors.progression_order && (
          <p className="text-sm text-destructive">
            {errors.progression_order.message}
          </p>
        )}
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Ajout..." : "Ajouter"}
      </Button>
    </form>
  );
}
