"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { articleFormSchema } from "./schema";

export interface ArticleFormState {
  error?: string;
  success?: boolean;
}

function parseArticleForm(formData: FormData) {
  return articleFormSchema.safeParse({
    code: formData.get("code"),
    libelle: formData.get("libelle"),
    categorie: formData.get("categorie"),
    description: (formData.get("description") as string) || null,
    unite: formData.get("unite"),
    prix_reference: formData.get("prix_reference"),
    actif: formData.get("actif"),
  });
}

function uniqueCodeError(error: { code?: string }): string | null {
  return error.code === "23505" ? "Ce code article existe déjà." : null;
}

export async function createArticle(
  formData: FormData
): Promise<ArticleFormState> {
  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return { error: "Champs invalides. Vérifiez le code, le libellé et le prix." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("articles").insert({
    code: parsed.data.code,
    libelle: parsed.data.libelle,
    categorie: parsed.data.categorie,
    description: parsed.data.description,
    unite: parsed.data.unite,
    prix_reference: parsed.data.prix_reference,
    actif: parsed.data.actif === "true",
  });

  if (error) {
    return { error: uniqueCodeError(error) ?? "Erreur lors de la création de l'article." };
  }

  revalidatePath("/primes/catalogue");
  return { success: true };
}

export async function updateArticle(
  articleId: string,
  formData: FormData
): Promise<ArticleFormState> {
  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return { error: "Champs invalides. Vérifiez le code, le libellé et le prix." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({
      code: parsed.data.code,
      libelle: parsed.data.libelle,
      categorie: parsed.data.categorie,
      description: parsed.data.description,
      unite: parsed.data.unite,
      prix_reference: parsed.data.prix_reference,
      actif: parsed.data.actif === "true",
    })
    .eq("id", articleId);

  if (error) {
    return { error: uniqueCodeError(error) ?? "Erreur lors de la mise à jour de l'article." };
  }

  revalidatePath("/primes/catalogue");
  revalidatePath("/primes/configuration");
  return { success: true };
}
