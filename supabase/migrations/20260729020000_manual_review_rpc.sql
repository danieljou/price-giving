-- Replaces the direct client-side .update() on results for manual-review
-- resolution with two RPCs that enforce is_admin() before writing. Postgres
-- RLS can't tell this UPDATE apart from a normal saisie edit on the same
-- table/columns, so the check has to live in the function itself. Each RPC
-- also logs to audit_log atomically, under entity_type 'manual_review' with
-- the same entity_id as the result, so a result's edit history and its
-- manual-review decisions show up together.

create or replace function resolve_manual_review(p_result_id uuid, p_prize_code text)
returns void
language plpgsql
security invoker
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  if not is_admin() then
    raise exception 'Accès refusé : rôle admin requis' using errcode = '42501';
  end if;

  select to_jsonb(r) into v_before from results r where r.id = p_result_id;

  update results
  set
    awarded_prizes = case when p_prize_code is null then '{}'::text[] else array[p_prize_code] end,
    manual_review_resolved = true
  where id = p_result_id
  returning to_jsonb(results) into v_after;

  perform log_audit('manual_review', p_result_id, 'resolve', v_before, v_after);
end;
$$;

create or replace function reopen_manual_review(p_result_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_before jsonb;
  v_after jsonb;
begin
  if not is_admin() then
    raise exception 'Accès refusé : rôle admin requis' using errcode = '42501';
  end if;

  select to_jsonb(r) into v_before from results r where r.id = p_result_id;

  update results
  set awarded_prizes = '{}'::text[], manual_review_resolved = false
  where id = p_result_id
  returning to_jsonb(results) into v_after;

  perform log_audit('manual_review', p_result_id, 'reopen', v_before, v_after);
end;
$$;

grant execute on function resolve_manual_review(uuid, text) to authenticated;
grant execute on function reopen_manual_review(uuid) to authenticated;
