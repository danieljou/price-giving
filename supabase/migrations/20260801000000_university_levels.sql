-- University was modeled as a single flat "UNIVERSITE"/"UNIVERSITY" niveau
-- with no year granularity, so results couldn't distinguish a 1st-year
-- student from a 7th-year one. Adds 7 selectable sub-levels per section
-- (year 1..7), placed right after the existing UNIVERSITE/UNIVERSITY tier
-- (progression_order 15) so historical results on the flat code keep
-- sorting correctly. Each year transitions to the next, with EXC/ENC
-- criteria requiring manual review at every step — university deliberation
-- is manual end to end, mirroring the existing UNIVERSITE/UNIVERSITY
-- criteria (see critères.json, PRIX_EXCELLENCE / PRIX_ENCOURAGEMENT).

insert into niveaux (section, code, progression_order) values
  ('francophone', 'UNIVERSITE 1', 16),
  ('francophone', 'UNIVERSITE 2', 17),
  ('francophone', 'UNIVERSITE 3', 18),
  ('francophone', 'UNIVERSITE 4', 19),
  ('francophone', 'UNIVERSITE 5', 20),
  ('francophone', 'UNIVERSITE 6', 21),
  ('francophone', 'UNIVERSITE 7', 22),
  ('anglophone', 'UNIVERSITY 1', 16),
  ('anglophone', 'UNIVERSITY 2', 17),
  ('anglophone', 'UNIVERSITY 3', 18),
  ('anglophone', 'UNIVERSITY 4', 19),
  ('anglophone', 'UNIVERSITY 5', 20),
  ('anglophone', 'UNIVERSITY 6', 21),
  ('anglophone', 'UNIVERSITY 7', 22)
on conflict (section, code) do nothing;

insert into criteria
  (prize_code, section, niveau_depart, niveau_admission, moyenne_min, moyenne_max, moyenne_max_inclusive, rang_max, auto_qualify, requires_manual_review, condition_raw)
values
  ('EXC', 'francophone', 'UNIVERSITE 1', 'UNIVERSITE 2', null, null, true, null, false, true, 'UNIVERSITE 1 -> UNIVERSITE 2 (délibération)'),
  ('EXC', 'francophone', 'UNIVERSITE 2', 'UNIVERSITE 3', null, null, true, null, false, true, 'UNIVERSITE 2 -> UNIVERSITE 3 (délibération)'),
  ('EXC', 'francophone', 'UNIVERSITE 3', 'UNIVERSITE 4', null, null, true, null, false, true, 'UNIVERSITE 3 -> UNIVERSITE 4 (délibération)'),
  ('EXC', 'francophone', 'UNIVERSITE 4', 'UNIVERSITE 5', null, null, true, null, false, true, 'UNIVERSITE 4 -> UNIVERSITE 5 (délibération)'),
  ('EXC', 'francophone', 'UNIVERSITE 5', 'UNIVERSITE 6', null, null, true, null, false, true, 'UNIVERSITE 5 -> UNIVERSITE 6 (délibération)'),
  ('EXC', 'francophone', 'UNIVERSITE 6', 'UNIVERSITE 7', null, null, true, null, false, true, 'UNIVERSITE 6 -> UNIVERSITE 7 (délibération)'),
  ('EXC', 'francophone', 'UNIVERSITE 7', null, null, null, true, null, false, true, 'UNIVERSITE 7 (délibération)'),

  ('ENC', 'francophone', 'UNIVERSITE 1', 'UNIVERSITE 2', null, null, true, null, false, true, 'UNIVERSITE 1 -> UNIVERSITE 2 (délibération)'),
  ('ENC', 'francophone', 'UNIVERSITE 2', 'UNIVERSITE 3', null, null, true, null, false, true, 'UNIVERSITE 2 -> UNIVERSITE 3 (délibération)'),
  ('ENC', 'francophone', 'UNIVERSITE 3', 'UNIVERSITE 4', null, null, true, null, false, true, 'UNIVERSITE 3 -> UNIVERSITE 4 (délibération)'),
  ('ENC', 'francophone', 'UNIVERSITE 4', 'UNIVERSITE 5', null, null, true, null, false, true, 'UNIVERSITE 4 -> UNIVERSITE 5 (délibération)'),
  ('ENC', 'francophone', 'UNIVERSITE 5', 'UNIVERSITE 6', null, null, true, null, false, true, 'UNIVERSITE 5 -> UNIVERSITE 6 (délibération)'),
  ('ENC', 'francophone', 'UNIVERSITE 6', 'UNIVERSITE 7', null, null, true, null, false, true, 'UNIVERSITE 6 -> UNIVERSITE 7 (délibération)'),
  ('ENC', 'francophone', 'UNIVERSITE 7', null, null, null, true, null, false, true, 'UNIVERSITE 7 (délibération)'),

  ('EXC', 'anglophone', 'UNIVERSITY 1', 'UNIVERSITY 2', null, null, true, null, false, true, 'UNIVERSITY 1 -> UNIVERSITY 2 (deliberation)'),
  ('EXC', 'anglophone', 'UNIVERSITY 2', 'UNIVERSITY 3', null, null, true, null, false, true, 'UNIVERSITY 2 -> UNIVERSITY 3 (deliberation)'),
  ('EXC', 'anglophone', 'UNIVERSITY 3', 'UNIVERSITY 4', null, null, true, null, false, true, 'UNIVERSITY 3 -> UNIVERSITY 4 (deliberation)'),
  ('EXC', 'anglophone', 'UNIVERSITY 4', 'UNIVERSITY 5', null, null, true, null, false, true, 'UNIVERSITY 4 -> UNIVERSITY 5 (deliberation)'),
  ('EXC', 'anglophone', 'UNIVERSITY 5', 'UNIVERSITY 6', null, null, true, null, false, true, 'UNIVERSITY 5 -> UNIVERSITY 6 (deliberation)'),
  ('EXC', 'anglophone', 'UNIVERSITY 6', 'UNIVERSITY 7', null, null, true, null, false, true, 'UNIVERSITY 6 -> UNIVERSITY 7 (deliberation)'),
  ('EXC', 'anglophone', 'UNIVERSITY 7', null, null, null, true, null, false, true, 'UNIVERSITY 7 (deliberation)'),

  ('ENC', 'anglophone', 'UNIVERSITY 1', 'UNIVERSITY 2', null, null, true, null, false, true, 'UNIVERSITY 1 -> UNIVERSITY 2 (deliberation)'),
  ('ENC', 'anglophone', 'UNIVERSITY 2', 'UNIVERSITY 3', null, null, true, null, false, true, 'UNIVERSITY 2 -> UNIVERSITY 3 (deliberation)'),
  ('ENC', 'anglophone', 'UNIVERSITY 3', 'UNIVERSITY 4', null, null, true, null, false, true, 'UNIVERSITY 3 -> UNIVERSITY 4 (deliberation)'),
  ('ENC', 'anglophone', 'UNIVERSITY 4', 'UNIVERSITY 5', null, null, true, null, false, true, 'UNIVERSITY 4 -> UNIVERSITY 5 (deliberation)'),
  ('ENC', 'anglophone', 'UNIVERSITY 5', 'UNIVERSITY 6', null, null, true, null, false, true, 'UNIVERSITY 5 -> UNIVERSITY 6 (deliberation)'),
  ('ENC', 'anglophone', 'UNIVERSITY 6', 'UNIVERSITY 7', null, null, true, null, false, true, 'UNIVERSITY 6 -> UNIVERSITY 7 (deliberation)'),
  ('ENC', 'anglophone', 'UNIVERSITY 7', null, null, null, true, null, false, true, 'UNIVERSITY 7 (deliberation)');
