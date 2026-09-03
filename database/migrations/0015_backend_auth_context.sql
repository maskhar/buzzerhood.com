-- 0015: transaction-local Backend identity with Supabase auth.uid() fallback.

create or replace function buzzerhood.current_user_id()
returns uuid
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  backend_user_id text;
begin
  backend_user_id := nullif(btrim(current_setting('app.user_id', true)), '');
  if backend_user_id is not null then
    begin
      return backend_user_id::uuid;
    exception
      when invalid_text_representation then return null;
    end;
  end if;
  return auth.uid();
end;
$$;

create or replace function buzzerhood.is_active_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from buzzerhood.organization_members m
    where m.organization_id = target_organization_id
      and m.profile_id = buzzerhood.current_user_id()
      and m.status = 'active'
  );
$$;

create or replace function buzzerhood.has_system_role(target_role_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from buzzerhood.user_roles ur
    join buzzerhood.roles r on r.id = ur.role_id
    where ur.profile_id = buzzerhood.current_user_id()
      and ur.revoked_at is null
      and r.scope = 'system'
      and r.key = target_role_key
  );
$$;

create or replace function buzzerhood.has_permission(target_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from buzzerhood.user_roles ur
    join buzzerhood.role_permissions rp on rp.role_id = ur.role_id
    join buzzerhood.permissions p on p.id = rp.permission_id
    where ur.profile_id = buzzerhood.current_user_id()
      and ur.revoked_at is null
      and p.key = target_permission_key
  );
$$;

create or replace function buzzerhood.is_active_partner_member(target_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from buzzerhood.partner_members m
    where m.partner_id = target_partner_id
      and m.profile_id = buzzerhood.current_user_id()
      and m.status = 'active'
  );
$$;

revoke all on function buzzerhood.current_user_id() from public;
grant execute on function buzzerhood.current_user_id() to authenticated, buzzerhood_app;
-- The invoker helper intentionally calls the transitional Supabase identity function.
-- Schema USAGE does not grant access to auth tables.
grant usage on schema auth to buzzerhood_app;
grant execute on function auth.uid() to buzzerhood_app;

drop policy if exists profiles_self_read on buzzerhood.profiles;
drop policy if exists profiles_self_update on buzzerhood.profiles;
drop policy if exists user_roles_read_authorized on buzzerhood.user_roles;
drop policy if exists organization_members_member_read on buzzerhood.organization_members;
drop policy if exists partner_members_member_read on buzzerhood.partner_members;
drop policy if exists partner_claims_claimant_read on buzzerhood.partner_claim_requests;
drop policy if exists partners_owner_or_admin_read on buzzerhood.partners;

create policy profiles_self_read on buzzerhood.profiles for select to authenticated
using (id = buzzerhood.current_user_id() or buzzerhood.has_permission('users.read'));
create policy profiles_self_update on buzzerhood.profiles for update to authenticated
using (id = buzzerhood.current_user_id()) with check (id = buzzerhood.current_user_id());
create policy user_roles_read_authorized on buzzerhood.user_roles for select to authenticated
using (profile_id = buzzerhood.current_user_id() or buzzerhood.has_permission('roles.read'));
create policy organization_members_member_read on buzzerhood.organization_members for select to authenticated
using (profile_id = buzzerhood.current_user_id() or buzzerhood.is_active_organization_member(organization_id) or buzzerhood.has_permission('organizations.read'));
create policy partner_members_member_read on buzzerhood.partner_members for select to authenticated
using (profile_id = buzzerhood.current_user_id() or buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.read'));
create policy partner_claims_claimant_read on buzzerhood.partner_claim_requests for select to authenticated
using (claimant_profile_id = buzzerhood.current_user_id() or buzzerhood.has_permission('partners.read'));
create policy partners_owner_or_admin_read on buzzerhood.partners for select to authenticated
using (
  buzzerhood.has_permission('partners.read')
  or exists (
    select 1 from buzzerhood.partner_members member
    where member.partner_id = id
      and member.profile_id = buzzerhood.current_user_id()
  )
);

insert into buzzerhood.schema_migrations(version, filename)
values ('0015', '0015_backend_auth_context.sql')
on conflict (version) do nothing;
