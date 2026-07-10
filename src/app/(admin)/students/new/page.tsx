"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStudent } from "../actions";
import { studentSchema, type StudentValues } from "../schema";

export default function NewStudentPage() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentValues>({
    resolver: zodResolver(studentSchema),
  });

  function onSubmit(values: StudentValues) {
    setServerError(null);
    const formData = new FormData();
    formData.set("first_name", values.first_name);
    formData.set("last_name", values.last_name);
    formData.set("section", values.section);
    if (values.date_of_birth) {
      formData.set("date_of_birth", values.date_of_birth);
    }

    startTransition(async () => {
      const result = await createStudent(formData);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="Nouvel étudiant"
        description="L'étudiant pourra ensuite recevoir un résultat par année scolaire"
      />
      <Card>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  aria-invalid={!!errors.first_name}
                  {...register("first_name")}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  aria-invalid={!!errors.last_name}
                  {...register("last_name")}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">
                    {errors.last_name.message}
                  </p>
                )}
              </div>

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
                  <p className="text-sm text-destructive">
                    {errors.section.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date_of_birth">
                  Date de naissance (optionnel)
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register("date_of_birth")}
                />
              </div>
            </div>

            {serverError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end border-t border-border pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto sm:min-w-40"
              >
                {isPending ? "Création..." : "Créer l'étudiant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
