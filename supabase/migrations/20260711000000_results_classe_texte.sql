-- Free-text class transition as written on the official list (e.g.
-- "6e M1 -> 5e M1", "SIL - CP"), alongside the normalized niveau codes
-- used for prize matching.

alter table results add column if not exists classe_texte text null;
