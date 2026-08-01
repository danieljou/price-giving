-- Renames the university sub-level codes from the technical
-- "UNIVERSITE N"/"UNIVERSITY N" seeded in 20260801000000_university_levels.sql
-- to the labels actually wanted for display: "Niveau N (Nème année)" for
-- francophone, "Year N" for anglophone. niveaux.code isn't a foreign key
-- (criteria/results reference it by plain text match), so every table that
-- stores the old code has to be updated together.

update niveaux set code = 'Niveau 1 (1ère année)' where section = 'francophone' and code = 'UNIVERSITE 1';
update niveaux set code = 'Niveau 2 (2ème année)' where section = 'francophone' and code = 'UNIVERSITE 2';
update niveaux set code = 'Niveau 3 (3ème année)' where section = 'francophone' and code = 'UNIVERSITE 3';
update niveaux set code = 'Niveau 4 (4ème année)' where section = 'francophone' and code = 'UNIVERSITE 4';
update niveaux set code = 'Niveau 5 (5ème année)' where section = 'francophone' and code = 'UNIVERSITE 5';
update niveaux set code = 'Niveau 6 (6ème année)' where section = 'francophone' and code = 'UNIVERSITE 6';
update niveaux set code = 'Niveau 7 (7ème année)' where section = 'francophone' and code = 'UNIVERSITE 7';

update niveaux set code = 'Year 1' where section = 'anglophone' and code = 'UNIVERSITY 1';
update niveaux set code = 'Year 2' where section = 'anglophone' and code = 'UNIVERSITY 2';
update niveaux set code = 'Year 3' where section = 'anglophone' and code = 'UNIVERSITY 3';
update niveaux set code = 'Year 4' where section = 'anglophone' and code = 'UNIVERSITY 4';
update niveaux set code = 'Year 5' where section = 'anglophone' and code = 'UNIVERSITY 5';
update niveaux set code = 'Year 6' where section = 'anglophone' and code = 'UNIVERSITY 6';
update niveaux set code = 'Year 7' where section = 'anglophone' and code = 'UNIVERSITY 7';

update criteria set niveau_depart = 'Niveau 1 (1ère année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 1';
update criteria set niveau_depart = 'Niveau 2 (2ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 2';
update criteria set niveau_depart = 'Niveau 3 (3ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 3';
update criteria set niveau_depart = 'Niveau 4 (4ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 4';
update criteria set niveau_depart = 'Niveau 5 (5ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 5';
update criteria set niveau_depart = 'Niveau 6 (6ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 6';
update criteria set niveau_depart = 'Niveau 7 (7ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 7';

update criteria set niveau_admission = 'Niveau 2 (2ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 2';
update criteria set niveau_admission = 'Niveau 3 (3ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 3';
update criteria set niveau_admission = 'Niveau 4 (4ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 4';
update criteria set niveau_admission = 'Niveau 5 (5ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 5';
update criteria set niveau_admission = 'Niveau 6 (6ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 6';
update criteria set niveau_admission = 'Niveau 7 (7ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 7';

update criteria set niveau_depart = 'Year 1' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 1';
update criteria set niveau_depart = 'Year 2' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 2';
update criteria set niveau_depart = 'Year 3' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 3';
update criteria set niveau_depart = 'Year 4' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 4';
update criteria set niveau_depart = 'Year 5' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 5';
update criteria set niveau_depart = 'Year 6' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 6';
update criteria set niveau_depart = 'Year 7' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 7';

update criteria set niveau_admission = 'Year 2' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 2';
update criteria set niveau_admission = 'Year 3' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 3';
update criteria set niveau_admission = 'Year 4' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 4';
update criteria set niveau_admission = 'Year 5' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 5';
update criteria set niveau_admission = 'Year 6' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 6';
update criteria set niveau_admission = 'Year 7' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 7';

-- Defensive: in case a result was already entered against the old codes
-- between the two migrations being applied.
update results set niveau_depart = 'Niveau 1 (1ère année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 1';
update results set niveau_depart = 'Niveau 2 (2ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 2';
update results set niveau_depart = 'Niveau 3 (3ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 3';
update results set niveau_depart = 'Niveau 4 (4ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 4';
update results set niveau_depart = 'Niveau 5 (5ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 5';
update results set niveau_depart = 'Niveau 6 (6ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 6';
update results set niveau_depart = 'Niveau 7 (7ème année)' where section = 'francophone' and niveau_depart = 'UNIVERSITE 7';

update results set niveau_admission = 'Niveau 2 (2ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 2';
update results set niveau_admission = 'Niveau 3 (3ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 3';
update results set niveau_admission = 'Niveau 4 (4ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 4';
update results set niveau_admission = 'Niveau 5 (5ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 5';
update results set niveau_admission = 'Niveau 6 (6ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 6';
update results set niveau_admission = 'Niveau 7 (7ème année)' where section = 'francophone' and niveau_admission = 'UNIVERSITE 7';

update results set niveau_depart = 'Year 1' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 1';
update results set niveau_depart = 'Year 2' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 2';
update results set niveau_depart = 'Year 3' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 3';
update results set niveau_depart = 'Year 4' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 4';
update results set niveau_depart = 'Year 5' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 5';
update results set niveau_depart = 'Year 6' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 6';
update results set niveau_depart = 'Year 7' where section = 'anglophone' and niveau_depart = 'UNIVERSITY 7';

update results set niveau_admission = 'Year 2' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 2';
update results set niveau_admission = 'Year 3' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 3';
update results set niveau_admission = 'Year 4' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 4';
update results set niveau_admission = 'Year 5' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 5';
update results set niveau_admission = 'Year 6' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 6';
update results set niveau_admission = 'Year 7' where section = 'anglophone' and niveau_admission = 'UNIVERSITY 7';
