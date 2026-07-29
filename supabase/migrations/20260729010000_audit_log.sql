-- Generic audit trail for results, manual review decisions, primes
-- configuration and dépenses complémentaires. One table, entity_type +
-- entity_id identify what was touched. Writable only through log_audit():
-- there is no insert/update/delete policy for `authenticated`, so the
-- client can never forge or edit history — only append via the function.

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('result', 'manual_review', 'prime_config', 'depense')),
  entity_id uuid not null,
  action text not null,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text null,
  before jsonb null,
  after jsonb null,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on audit_log (entity_type, entity_id, created_at desc);

alter table audit_log enable row level security;

create policy "authenticated_read" on audit_log
  for select to authenticated using (true);

create or replace function log_audit(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_before jsonb,
  p_after jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (entity_type, entity_id, action, actor_id, actor_email, before, after)
  values (
    p_entity_type,
    p_entity_id,
    p_action,
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    p_before,
    p_after
  );
end;
$$;

grant execute on function log_audit(text, uuid, text, jsonb, jsonb) to authenticated;
