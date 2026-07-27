-- Free-text field for admins to record additional context on a result
-- (e.g. a note explaining a manual decision), shown alongside the result
-- and included on the printed ceremony report.

alter table results add column if not exists notes text null;
