-- resolve_manual_review always overwrote results.awarded_prizes with a
-- 0-or-1-element array, even though awarded_prizes is a text[] meant to
-- support a student earning more than one prize. That made it impossible to
-- award e.g. EXC and ENC together through manual deliberation — picking a
-- second prize silently replaced the first instead of adding to it. Replaces
-- the single p_prize_code arg with p_prize_codes text[] so the whole
-- selection is written atomically.

drop function if exists resolve_manual_review(uuid, text);

create or replace function resolve_manual_review(p_result_id uuid, p_prize_codes text[])
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
    awarded_prizes = coalesce(p_prize_codes, '{}'::text[]),
    manual_review_resolved = true
  where id = p_result_id
  returning to_jsonb(results) into v_after;

  perform log_audit('manual_review', p_result_id, 'resolve', v_before, v_after);
end;
$$;

grant execute on function resolve_manual_review(uuid, text[]) to authenticated;
