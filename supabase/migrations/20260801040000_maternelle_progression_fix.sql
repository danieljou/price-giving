-- PS/MS/GS (francophone) and PN/N1/N2 (anglophone) were all seeded at the
-- same progression_order (1) — see 20260721020000_maternelle_grades.sql —
-- which made the result-entry admission dropdown (result-form.tsx, filters
-- by "progression_order >= depart's order") accept e.g. GS -> PS as a valid
-- admission, going backwards. Splits them into their real 3 yearly tiers,
-- one-to-one: PS=PN, MS=N1, GS=N2. Every niveau at or above SIL/CLASS 1 (the
-- level right after maternelle) shifts up by 2 to make room, mirroring the
-- renumbering just applied to NIVEAU_ORDER in src/lib/prizes/niveau-order.ts
-- so the DB ordinal and the TS sort ordinal stay in sync. PS, PN and JARDIN
-- keep progression_order = 1 (unchanged, no-ops below are omitted for them).

update niveaux set progression_order = 2 where code = 'MS';
update niveaux set progression_order = 2 where code = 'N1';
update niveaux set progression_order = 3 where code = 'GS';
update niveaux set progression_order = 3 where code = 'N2';

update niveaux set progression_order = 4 where code = 'SIL';
update niveaux set progression_order = 4 where code = 'CLASS 1';
update niveaux set progression_order = 4 where code = 'CPS';
update niveaux set progression_order = 5 where code = 'CP';
update niveaux set progression_order = 5 where code = 'CLASS 2';
update niveaux set progression_order = 6 where code = 'CE1';
update niveaux set progression_order = 6 where code = 'CLASS 3';
update niveaux set progression_order = 7 where code = 'CE2';
update niveaux set progression_order = 7 where code = 'CLASS 4';
update niveaux set progression_order = 8 where code = 'CM1';
update niveaux set progression_order = 8 where code = 'CLASS 5';
update niveaux set progression_order = 8 where code = 'CEP';
update niveaux set progression_order = 9 where code = 'CM2';
update niveaux set progression_order = 9 where code = 'CLASS 6';
update niveaux set progression_order = 10 where code = '6e';
update niveaux set progression_order = 10 where code = 'FORM 1';
update niveaux set progression_order = 11 where code = '5e';
update niveaux set progression_order = 11 where code = 'FORM 2';
update niveaux set progression_order = 12 where code = '4e';
update niveaux set progression_order = 12 where code = 'FORM 3';
update niveaux set progression_order = 13 where code = '3e';
update niveaux set progression_order = 13 where code = 'FORM 4';
update niveaux set progression_order = 13 where code = 'BEPC';
update niveaux set progression_order = 14 where code = '2nd';
update niveaux set progression_order = 14 where code = 'FORM 5';
update niveaux set progression_order = 15 where code = '1ere';
update niveaux set progression_order = 15 where code = 'LOWER 6';
update niveaux set progression_order = 15 where code = 'PROBATOIRE';
update niveaux set progression_order = 16 where code = 'Tle';
update niveaux set progression_order = 16 where code = 'UPPER 6';
update niveaux set progression_order = 16 where code = 'BACC';
update niveaux set progression_order = 17 where code = 'UNIVERSITE';
update niveaux set progression_order = 17 where code = 'UNIVERSITY';

update niveaux set progression_order = 18 where code = 'Niveau 1 (1ère année)';
update niveaux set progression_order = 18 where code = 'Year 1';
update niveaux set progression_order = 19 where code = 'Niveau 2 (2ème année)';
update niveaux set progression_order = 19 where code = 'Year 2';
update niveaux set progression_order = 20 where code = 'Niveau 3 (3ème année)';
update niveaux set progression_order = 20 where code = 'Year 3';
update niveaux set progression_order = 21 where code = 'Niveau 4 (4ème année)';
update niveaux set progression_order = 21 where code = 'Year 4';
update niveaux set progression_order = 22 where code = 'Niveau 5 (5ème année)';
update niveaux set progression_order = 22 where code = 'Year 5';
update niveaux set progression_order = 23 where code = 'Niveau 6 (6ème année)';
update niveaux set progression_order = 23 where code = 'Year 6';
update niveaux set progression_order = 24 where code = 'Niveau 7 (7ème année)';
update niveaux set progression_order = 24 where code = 'Year 7';
