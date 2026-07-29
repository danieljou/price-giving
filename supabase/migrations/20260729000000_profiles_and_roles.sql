-- Introduces a minimal role system (saisie / admin). Roles are assigned by
-- hand in the Supabase SQL editor — no in-app management UI. Every table
-- keeps its existing permissive RLS for normal CRUD; is_admin() is used by
-- later migrations to gate specific actions (manual review resolution)
-- that must stay off-limits to the "saisie" role.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'saisie' check (role in ('saisie', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

alter table profiles enable row level security;

-- Users may only read their own role. No insert/update/delete policy for
-- `authenticated` on purpose: role assignment is a manual, out-of-band
-- action (Supabase SQL editor / service role), never something the app
-- itself can grant.
create policy "select_own_profile" on profiles
  for select to authenticated using (id = auth.uid());

-- Reads only the caller's own profile (already permitted by the policy
-- above), so `security invoker` is enough — no privilege escalation needed.
create or replace function is_admin()
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;
