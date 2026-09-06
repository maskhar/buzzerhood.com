-- 0027: Allow audited self-service profile updates.

alter table buzzerhood.auth_security_events
  drop constraint if exists auth_security_events_event_type_check;

alter table buzzerhood.auth_security_events
  add constraint auth_security_events_event_type_check check (event_type in (
    'login_succeeded',
    'login_failed',
    'refresh_rotated',
    'refresh_replayed',
    'session_revoked',
    'sessions_revoked',
    'account_registered',
    'password_changed',
    'account_status_changed',
    'profile_updated'
  ));

insert into buzzerhood.schema_migrations(version,filename)
values('0027','0027_allow_profile_update_audit_event.sql')
on conflict(version) do nothing;
