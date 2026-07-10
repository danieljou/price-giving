"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSchoolYear } from "./actions";
import { schoolYearSchema, type SchoolYearValues } from "./schema";

export function SchoolYearForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolYearValues>({
    resolver: zodResolver(schoolYearSchema),
  });

  function onSubmit(values: SchoolYearValues) {
    setServerError(null);
    const formData = new FormData();
    formData.set("label", values.label);
    formData.set("start_year", values.start_year);

    startTransition(async () => {
      const result = await createSchoolYear(formData);
      if (result?.error) {
        setServerError(result.error);
      } else {
        reset();
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
        <Label htmlFor="label">Libellé (ex. 2024-2025)</Label>
        <Input
          id="label"
          placeholder="2024-2025"
          aria-invalid={!!errors.label}
          {...register("label")}
        />
        {errors.label && (
          <p className="text-sm text-destructive">{errors.label.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start_year">Année de début (ex. 2024)</Label>
        <Input
          id="start_year"
          type="number"
          placeholder="2024"
          aria-invalid={!!errors.start_year}
          {...register("start_year")}
        />
        {errors.start_year && (
          <p className="text-sm text-destructive">
            {errors.start_year.message}
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
