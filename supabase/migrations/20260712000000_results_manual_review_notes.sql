-- Persist the manual-review notes produced by computePrizes (previously only
-- shown transiently in a toast at save time) so they can be tracked in a
-- dedicated review queue instead of being lost.

alter table results add column if not exists manual_review_notes text[] not null default '{}';
