"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdmin } from "@/lib/supabase/role";
import { normalizePhone } from "@/app/login/schema";
import { createUserSchema, setRoleSchema } from "./schema";

export interface UserFormState {
  error?: string;
}

export async function createUser(
  formData: FormData
): Promise<UserFormState> {
  if (!(await isAdmin())) {
    return { error: "Seul un compte admin peut créer un utilisateur." };
  }

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") ?? undefined,
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "Email valide, mot de passe (8 caractères min.) et rôle requis.",
    };
  }

  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : undefined;
  const service = createServiceClient();

  const { data, error } = await service.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    phone,
    phone_confirm: phone ? true : undefined,
  });

  if (error || !data.user) {
    return {
      error:
        error?.code === "email_exists"
          ? "Un compte existe déjà avec cet email."
          : "Erreur lors de la création de l'utilisateur.",
    };
  }

  const { error: profileError } = await service
    .from("profiles")
    .insert({ id: data.user.id, role: parsed.data.role });

  if (profileError) {
    return {
      error:
        "Utilisateur créé, mais l'attribution du rôle a échoué — réessayez depuis la liste.",
    };
  }

  const supabase = await createClient();
  await supabase.rpc("log_audit", {
    p_entity_type: "user",
    p_entity_id: data.user.id,
    p_action: "create",
    p_before: null,
    p_after: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/users");
  return {};
}

export async function setUserRole(
  userId: string,
  formData: FormData
): Promise<UserFormState> {
  if (!(await isAdmin())) {
    return { error: "Seul un compte admin peut changer un rôle." };
  }

  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  if (actor?.id === userId) {
    return { error: "Vous ne pouvez pas modifier votre propre rôle." };
  }

  const parsed = setRoleSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) {
    return { error: "Rôle invalide." };
  }

  const service = createServiceClient();
  const { data: before } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await service
    .from("profiles")
    .upsert({ id: userId, role: parsed.data.role });

  if (error) {
    return { error: "Erreur lors du changement de rôle." };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "user",
    p_entity_id: userId,
    p_action: "set_role",
    p_before: before,
    p_after: { role: parsed.data.role },
  });

  revalidatePath("/users");
  return {};
}

export async function deleteUser(userId: string): Promise<UserFormState> {
  if (!(await isAdmin())) {
    return { error: "Seul un compte admin peut supprimer un utilisateur." };
  }

  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  if (actor?.id === userId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  const service = createServiceClient();
  const { data: before } = await service.auth.admin.getUserById(userId);

  const { error } = await service.auth.admin.deleteUser(userId);
  if (error) {
    return { error: "Erreur lors de la suppression de l'utilisateur." };
  }

  await supabase.rpc("log_audit", {
    p_entity_type: "user",
    p_entity_id: userId,
    p_action: "delete",
    p_before: before?.user ? { email: before.user.email } : null,
    p_after: null,
  });

  revalidatePath("/users");
  return {};
}
