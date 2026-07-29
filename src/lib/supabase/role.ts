import "server-only";
import { createClient } from "./server";
import type { UserRole } from "./types";

/** Current user's role (defaults to "saisie" when signed out or when no
 *  `profiles` row exists yet — safe default, matches the DB column default). */
export async function getCurrentRole(): Promise<UserRole> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "saisie";

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return data?.role ?? "saisie";
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentRole()) === "admin";
}
