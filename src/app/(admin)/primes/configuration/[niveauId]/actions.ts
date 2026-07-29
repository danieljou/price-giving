"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface LineFormState {
  error?: string;
  success?: boolean;
}

const lineUpdateSchema = z.object({
  quantite: z.coerce.number().positive("La quantité doit être positive"),
  prix_session: z.coerce.number().min(0, "Le prix doit être positif"),
  observation: z.string().trim().max(300).nullable(),
});

function revalidateConfigPaths() {
  revalidatePath("/primes/configuration");
  revalidatePath("/primes/budget");
  revalidatePath("/primes/dashboard");
  revalidatePath("/primes/etats");
}

export async function addArticleLine(
  configId: string,
  articleId: string,
  prixDefaut: number
): Promise<LineFormState> {
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("configuration_prime_articles")
    .insert({
      configuration_prime_id: configId,
      article_id: articleId,
      quantite: 1,
      prix_session: prixDefaut,
    })
    .select()
    .single();

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Cet article figure déjà dans la composition."
          : "Erreur lors de l'ajout de l'article.",
    };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "prime_config",
    p_entity_id: created.id,
    p_action: "create",
    p_before: null,
    p_after: created,
  });

  revalidateConfigPaths();
  return { success: true };
}

export async function updateArticleLine(
  lineId: string,
  formData: FormData
): Promise<LineFormState> {
  const parsed = lineUpdateSchema.safeParse({
    quantite: formData.get("quantite"),
    prix_session: formData.get("prix_session"),
    observation: (formData.get("observation") as string) || null,
  });

  if (!parsed.success) {
    return { error: "Valeurs invalides (quantité et prix doivent être positifs)." };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("configuration_prime_articles")
    .select()
    .eq("id", lineId)
    .single();

  const { data: updated, error } = await supabase
    .from("configuration_prime_articles")
    .update({
      quantite: parsed.data.quantite,
      prix_session: parsed.data.prix_session,
      observation: parsed.data.observation,
    })
    .eq("id", lineId)
    .select()
    .single();

  if (error) {
    return { error: "Erreur lors de la mise à jour de la ligne." };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "prime_config",
    p_entity_id: lineId,
    p_action: "update",
    p_before: before ?? null,
    p_after: updated,
  });

  revalidateConfigPaths();
  return { success: true };
}

export async function removeArticleLine(lineId: string): Promise<LineFormState> {
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("configuration_prime_articles")
    .select()
    .eq("id", lineId)
    .single();

  const { error } = await supabase
    .from("configuration_prime_articles")
    .delete()
    .eq("id", lineId);

  if (error) {
    return { error: "Erreur lors de la suppression de la ligne." };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "prime_config",
    p_entity_id: lineId,
    p_action: "delete",
    p_before: before ?? null,
    p_after: null,
  });

  revalidateConfigPaths();
  return { success: true };
}
