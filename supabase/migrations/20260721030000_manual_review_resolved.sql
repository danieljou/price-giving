-- Marking a manual-review result as decided used to destructively clear
-- manual_review_notes, losing the original condition text and making the
-- decision one-way. Track "decided" as its own flag instead so admins can
-- toggle a result back to pending if they change their mind.

alter table results add column if not exists manual_review_resolved boolean not null default false;
