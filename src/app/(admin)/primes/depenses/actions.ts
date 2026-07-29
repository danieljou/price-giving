"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { depenseFormSchema } from "./schema";

export interface DepenseFormState {
  error?: string;
  success?: boolean;
}

function parseDepenseForm(formData: FormData) {
  return depenseFormSchema.safeParse({
    libelle: formData.get("libelle"),
    categorie: formData.get("categorie"),
    description: (formData.get("description") as string) || null,
    montant: formData.get("montant"),
    observation: (formData.get("observation") as string) || null,
  });
}

function revalidateDepensePaths() {
  revalidatePath("/primes/depenses");
  revalidatePath("/primes/budget");
  revalidatePath("/primes/dashboard");
  revalidatePath("/primes/etats");
}

export async function createDepense(
  sessionId: string,
  formData: FormData
): Promise<DepenseFormState> {
  const parsed = parseDepenseForm(formData);
  if (!parsed.success) {
    return { error: "Champs invalides. Vérifiez le libellé et le montant." };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("depenses_complementaires")
    .insert({
      session_id: sessionId,
      libelle: parsed.data.libelle,
      categorie: parsed.data.categorie,
      description: parsed.data.description,
      montant: parsed.data.montant,
      observation: parsed.data.observation,
    })
    .select()
    .single();

  if (error) {
    return { error: "Erreur lors de l'ajout de la dépense." };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "depense",
    p_entity_id: created.id,
    p_action: "create",
    p_before: null,
    p_after: created,
  });

  revalidateDepensePaths();
  return { success: true };
}

export async function updateDepense(
  depenseId: string,
  formData: FormData
): Promise<DepenseFormState> {
  const parsed = parseDepenseForm(formData);
  if (!parsed.success) {
    return { error: "Champs invalides. Vérifiez le libellé et le montant." };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("depenses_complementaires")
    .select()
    .eq("id", depenseId)
    .single();

  const { data: updated, error } = await supabase
    .from("depenses_complementaires")
    .update({
      libelle: parsed.data.libelle,
      categorie: parsed.data.categorie,
      description: parsed.data.description,
      montant: parsed.data.montant,
      observation: parsed.data.observation,
    })
    .eq("id", depenseId)
    .select()
    .single();

  if (error) {
    return { error: "Erreur lors de la mise à jour de la dépense." };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "depense",
    p_entity_id: depenseId,
    p_action: "update",
    p_before: before ?? null,
    p_after: updated,
  });

  revalidateDepensePaths();
  return { success: true };
}

export async function deleteDepense(depenseId: string): Promise<DepenseFormState> {
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("depenses_complementaires")
    .select()
    .eq("id", depenseId)
    .single();

  const { error } = await supabase
    .from("depenses_complementaires")
    .delete()
    .eq("id", depenseId);

  if (error) {
    return { error: "Erreur lors de la suppression de la dépense." };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "depense",
    p_entity_id: depenseId,
    p_action: "delete",
    p_before: before ?? null,
    p_after: null,
  });

  revalidateDepensePaths();
  return { success: true };
}
