-- The new in-app user management (create/delete accounts, change roles)
-- logs through the existing log_audit() function like every other admin
-- action, but audit_log.entity_type's check constraint didn't have a 'user'
-- value yet.

alter table audit_log drop constraint audit_log_entity_type_check;
alter table audit_log add constraint audit_log_entity_type_check
  check (entity_type in ('result', 'manual_review', 'prime_config', 'depense', 'user'));
