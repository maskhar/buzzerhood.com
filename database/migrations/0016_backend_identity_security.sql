-- 0016: least-privilege B1 grants, RLS policies, and narrow pre-auth lookups.

create or replace function buzzerhood.lookup_auth_user(input_normalized_email text)
returns table (
  id uuid,
  email text,
  normalized_email text,
  password_hash text,
  status buzzerhood.user_status,
  password_changed_at timestamptz,
  last_login_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email, u.normalized_email, u.password_hash, u.status,
         u.password_changed_at, u.last_login_at
  from buzzerhood.users u
  where u.normalized_email = input_normalized_email
  limit 1
$$;

create or replace function buzzerhood.lookup_refresh_session(input_token_hash text)
returns table (
  id uuid,
  user_id uuid,
  family_id uuid,
  token_hash text,
  parent_session_id uuid,
  replaced_by_session_id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  rotated_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  replay_detected_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.user_id, s.family_id, s.token_hash::text,
         s.parent_session_id, s.replaced_by_session_id, s.created_at,
         s.expires_at, s.last_used_at, s.rotated_at, s.revoked_at,
         s.revocation_reason, s.replay_detected_at
  from buzzerhood.refresh_sessions s
  where s.token_hash = input_token_hash
  limit 1
$$;

revoke all on function buzzerhood.lookup_auth_user(text) from public;
revoke all on function buzzerhood.lookup_refresh_session(text) from public;
grant execute on function buzzerhood.lookup_auth_user(text) to buzzerhood_app;
grant execute on function buzzerhood.lookup_refresh_session(text) to buzzerhood_app;

grant usage on schema buzzerhood to buzzerhood_app;
grant select, insert, update on buzzerhood.users to buzzerhood_app;
grant select, insert, update on buzzerhood.refresh_sessions to buzzerhood_app;
grant select, insert on buzzerhood.auth_security_events to buzzerhood_app;
grant select, insert, update(display_name, avatar_path) on buzzerhood.profiles to buzzerhood_app;
grant select on buzzerhood.roles, buzzerhood.permissions, buzzerhood.role_permissions, buzzerhood.user_roles to buzzerhood_app;

drop policy if exists users_app_self_select on buzzerhood.users;
drop policy if exists users_app_self_insert on buzzerhood.users;
drop policy if exists users_app_self_update on buzzerhood.users;
drop policy if exists refresh_sessions_app_self_select on buzzerhood.refresh_sessions;
drop policy if exists refresh_sessions_app_self_insert on buzzerhood.refresh_sessions;
drop policy if exists refresh_sessions_app_self_update on buzzerhood.refresh_sessions;
drop policy if exists auth_events_app_self_select on buzzerhood.auth_security_events;
drop policy if exists auth_events_app_self_insert on buzzerhood.auth_security_events;
drop policy if exists profiles_app_self_select on buzzerhood.profiles;
drop policy if exists profiles_app_self_insert on buzzerhood.profiles;
drop policy if exists profiles_app_self_update on buzzerhood.profiles;
drop policy if exists roles_app_read on buzzerhood.roles;
drop policy if exists permissions_app_read on buzzerhood.permissions;
drop policy if exists role_permissions_app_read on buzzerhood.role_permissions;
drop policy if exists user_roles_app_self_read on buzzerhood.user_roles;

create policy users_app_self_select on buzzerhood.users for select to buzzerhood_app
using (id = buzzerhood.current_user_id());
create policy users_app_self_insert on buzzerhood.users for insert to buzzerhood_app
with check (id = buzzerhood.current_user_id());
create policy users_app_self_update on buzzerhood.users for update to buzzerhood_app
using (id = buzzerhood.current_user_id()) with check (id = buzzerhood.current_user_id());

create policy refresh_sessions_app_self_select on buzzerhood.refresh_sessions for select to buzzerhood_app
using (user_id = buzzerhood.current_user_id());
create policy refresh_sessions_app_self_insert on buzzerhood.refresh_sessions for insert to buzzerhood_app
with check (user_id = buzzerhood.current_user_id());
create policy refresh_sessions_app_self_update on buzzerhood.refresh_sessions for update to buzzerhood_app
using (user_id = buzzerhood.current_user_id()) with check (user_id = buzzerhood.current_user_id());

create policy auth_events_app_self_select on buzzerhood.auth_security_events for select to buzzerhood_app
using (user_id = buzzerhood.current_user_id());
create policy auth_events_app_self_insert on buzzerhood.auth_security_events for insert to buzzerhood_app
with check (user_id = buzzerhood.current_user_id());

create policy profiles_app_self_select on buzzerhood.profiles for select to buzzerhood_app
using (id = buzzerhood.current_user_id());
create policy profiles_app_self_insert on buzzerhood.profiles for insert to buzzerhood_app
with check (id = buzzerhood.current_user_id() and user_id = buzzerhood.current_user_id());
create policy profiles_app_self_update on buzzerhood.profiles for update to buzzerhood_app
using (id = buzzerhood.current_user_id()) with check (id = buzzerhood.current_user_id());

create policy roles_app_read on buzzerhood.roles for select to buzzerhood_app using (true);
create policy permissions_app_read on buzzerhood.permissions for select to buzzerhood_app using (true);
create policy role_permissions_app_read on buzzerhood.role_permissions for select to buzzerhood_app using (true);
create policy user_roles_app_self_read on buzzerhood.user_roles for select to buzzerhood_app
using (profile_id = buzzerhood.current_user_id());

insert into buzzerhood.schema_migrations(version, filename)
values ('0016', '0016_backend_identity_security.sql')
on conflict (version) do nothing;
