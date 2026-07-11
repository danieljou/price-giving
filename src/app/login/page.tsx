"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { login } from "./actions";
import { loginSchema, type LoginValues } from "./schema";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(values: LoginValues) {
    setServerError(null);
    const formData = new FormData();
    formData.set("identifier", values.identifier);
    formData.set("password", values.password);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="grid min-h-svh flex-1 lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(255_255_255/0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgb(0_0_0/0.25),transparent_60%)]"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            PRICE GIVING
          </span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Récompenser l&apos;excellence, année après année.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/75">
            Classification automatique des lauréats — Prix Spécial, Excellence,
            Encouragement et Excellence+ — sur la base des critères officiels,
            pour les sections francophone et anglophone.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Espace réservé aux administrateurs
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
              <GraduationCap className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl">Bon retour</CardTitle>
            <CardDescription>
              Connectez-vous à votre espace administrateur
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="identifier">Email ou téléphone</Label>
              <Input
                id="identifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="admin@exemple.com ou 6XX XX XX XX"
                aria-invalid={!!errors.identifier}
                aria-describedby={
                  errors.identifier ? "identifier-error" : undefined
                }
                {...register("identifier")}
              />
              {errors.identifier && (
                <p id="identifier-error" className="text-sm text-destructive">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isPending} className="mt-2">
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
