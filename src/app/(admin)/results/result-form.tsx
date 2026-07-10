"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, TriangleAlert } from "lucide-react";
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
import type { ResultFormState } from "./actions";
import { resultSchema, type ResultValues } from "./schema";
import type { Section } from "@/lib/supabase/types";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  section: Section;
}

interface SchoolYear {
  id: string;
  label: string;
}

interface Niveau {
  section: Section;
  code: string;
  progression_order: number;
}

interface ResultFormProps {
  action: (formData: FormData) => Promise<ResultFormState>;
  students: Student[];
  schoolYears: SchoolYear[];
  niveaux: Niveau[];
  defaultStudentId?: string;
  defaultValues?: Partial<ResultValues>;
  submitLabel: string;
}

export function ResultForm({
  action,
  students,
  schoolYears,
  niveaux,
  defaultStudentId,
  defaultValues,
  submitLabel,
}: Readonly<ResultFormProps>) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [manualReviewNotes, setManualReviewNotes] = useState<string[] | null>(
    null
  );
  const isEditing = !!defaultValues;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResultValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      student_id: defaultStudentId ?? "",
      section:
        defaultValues?.section ??
        students.find((s) => s.id === defaultStudentId)?.section,
      ...defaultValues,
    },
  });

  const studentId = watch("student_id");
  const section = watch("section");

  useEffect(() => {
    if (isEditing) return;
    const student = students.find((s) => s.id === studentId);
    if (student) setValue("section", student.section);
    // Only auto-fill section from the selected student on create, not edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, isEditing]);

  const niveauOptions = niveaux
    .filter((n) => n.section === section)
    .sort((a, b) => a.progression_order - b.progression_order);

  function onSubmit(values: ResultValues) {
    setServerError(null);
    setManualReviewNotes(null);

    const formData = new FormData();
    formData.set("student_id", values.student_id);
    formData.set("school_year_id", values.school_year_id);
    formData.set("section", values.section);
    formData.set("niveau_depart", values.niveau_depart);
    if (values.niveau_admission) {
      formData.set("niveau_admission", values.niveau_admission);
    }
    formData.set("moyenne", values.moyenne);
    if (values.rang) {
      formData.set("rang", values.rang);
    }

    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        setServerError(result.error);
        toast.error(result.error);
      }
      if (result?.manualReviewNotes) {
        setManualReviewNotes(result.manualReviewNotes);
        toast.warning(
          "Résultat enregistré — certains critères demandent une vérification manuelle."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-8"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Contexte
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student_id">Étudiant</Label>
            <Controller
              name="student_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="student_id"
                    className="w-full"
                    aria-invalid={!!errors.student_id}
                  >
                    <SelectValue placeholder="Choisir un étudiant" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.last_name} {s.first_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.student_id && (
              <p className="text-sm text-destructive">
                {errors.student_id.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school_year_id">Année scolaire</Label>
            <Controller
              name="school_year_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="school_year_id"
                    className="w-full"
                    aria-invalid={!!errors.school_year_id}
                  >
                    <SelectValue placeholder="Choisir une année" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.school_year_id && (
              <p className="text-sm text-destructive">
                {errors.school_year_id.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Parcours scolaire
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
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
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="francophone">Francophone</SelectItem>
                    <SelectItem value="anglophone">Anglophone</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.section && (
              <p className="text-sm text-destructive">
                {errors.section.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="niveau_depart">Niveau de départ</Label>
            <Controller
              name="niveau_depart"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="niveau_depart"
                    className="w-full"
                    aria-invalid={!!errors.niveau_depart}
                  >
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveauOptions.map((n) => (
                      <SelectItem key={n.code} value={n.code}>
                        {n.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.niveau_depart && (
              <p className="text-sm text-destructive">
                {errors.niveau_depart.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="niveau_admission">Niveau d&apos;admission</Label>
            <Controller
              name="niveau_admission"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v)}
                >
                  <SelectTrigger id="niveau_admission" className="w-full">
                    <SelectValue placeholder="Aucun (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveauOptions.map((n) => (
                      <SelectItem key={n.code} value={n.code}>
                        {n.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        {!section && (
          <p className="text-xs text-muted-foreground">
            Choisissez d&apos;abord un étudiant ou une section pour voir les
            niveaux correspondants.
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Performance
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="moyenne">Moyenne (/20)</Label>
            <Input
              id="moyenne"
              type="number"
              step="0.01"
              min={0}
              max={20}
              placeholder="ex. 15,50"
              aria-invalid={!!errors.moyenne}
              {...register("moyenne")}
            />
            {errors.moyenne && (
              <p className="text-sm text-destructive">
                {errors.moyenne.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rang">Rang (optionnel)</Label>
            <Input
              id="rang"
              type="number"
              min={1}
              placeholder="ex. 3"
              {...register("rang")}
            />
            {errors.rang && (
              <p className="text-sm text-destructive">{errors.rang.message}</p>
            )}
          </div>
        </div>
      </fieldset>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {manualReviewNotes && manualReviewNotes.length > 0 && (
        <Alert>
          <TriangleAlert />
          <AlertDescription>
            <p className="mb-1 font-medium text-foreground">
              Résultat enregistré. Vérification manuelle requise pour :
            </p>
            <ul className="list-disc pl-5">
              {manualReviewNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end border-t border-border pt-4">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto sm:min-w-40"
        >
          {isPending ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
