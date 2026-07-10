-- PRIX_SPECIAL laureates have no moyenne (maternelle transitions are
-- auto-qualifying), so results.moyenne must accept null.

alter table results alter column moyenne drop not null;

alter table results drop constraint if exists results_moyenne_check;

alter table results
  add constraint results_moyenne_check
  check (moyenne is null or (moyenne >= 0 and moyenne <= 20));
a