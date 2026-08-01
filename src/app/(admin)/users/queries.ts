import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { UserRole } from "@/lib/supabase/types";

export interface AppUserRow {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
}

/** Admin-only: merges auth.users (identity, via the service-role client) with
 *  profiles (role). Callers MUST verify isAdmin() first — see the warning on
 *  createServiceClient(). */
export async function listAppUsers(): Promise<AppUserRow[]> {
  const service = createServiceClient();

  const [{ data: usersData, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      service.auth.admin.listUsers({ perPage: 1000 }),
      service.from("profiles").select("id, role"),
    ]);

  if (usersError) throw usersError;
  if (profilesError) throw profilesError;

  const roleById = new Map(
    (profiles ?? []).map((p) => [p.id, p.role])
  );

  return usersData.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      role: roleById.get(u.id) ?? "saisie",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
}
