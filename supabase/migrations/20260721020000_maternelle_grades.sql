-- Maternelle was collapsed into a single generic "JARDIN" level, so every
-- kindergarten result had to be entered under that one catch-all code even
-- though there are three real grades per section: PS/MS/GS (francophone),
-- PN/N1/N2 (anglophone). Adds them as selectable niveaux, at the same
-- progression_order as JARDIN since they don't need to sort against each
-- other, plus the matching auto-qualifying SPECIAL prize transitions
-- (mirroring the existing JARDIN -> SIL/CLASS 1/CPS criteria). JARDIN itself
-- is left untouched so existing results keep working.

insert into niveaux (section, code, progression_order) values
  ('francophone', 'PS', 1),
  ('francophone', 'MS', 1),
  ('francophone', 'GS', 1),
  ('anglophone', 'PN', 1),
  ('anglophone', 'N1', 1),
  ('anglophone', 'N2', 1)
on conflict (section, code) do nothing;

insert into criteria
  (prize_code, section, niveau_depart, niveau_admission, moyenne_min, moyenne_max, moyenne_max_inclusive, rang_max, auto_qualify, requires_manual_review, condition_raw)
values
  ('SPECIAL', 'francophone', 'PS', 'MS', null, null, true, null, true, false, 'PS -> MS'),
  ('SPECIAL', 'francophone', 'MS', 'GS', null, null, true, null, true, false, 'MS -> GS'),
  ('SPECIAL', 'francophone', 'GS', 'SIL', null, null, true, null, true, false, 'GS -> SIL'),
  ('SPECIAL', 'francophone', 'GS', 'CPS', null, null, true, null, true, false, 'GS -> CPS'),
  ('SPECIAL', 'anglophone', 'PN', 'N1', null, null, true, null, true, false, 'PN -> N1'),
  ('SPECIAL', 'anglophone', 'N1', 'N2', null, null, true, null, true, false, 'N1 -> N2'),
  ('SPECIAL', 'anglophone', 'N2', 'CLASS 1', null, null, true, null, true, false, 'N2 -> CLASS 1'),
  ('SPECIAL', 'anglophone', 'N2', 'CPS', null, null, true, null, true, false, 'N2 -> CPS');
