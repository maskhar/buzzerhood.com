-- 0004: helpers, profile bootstrap trigger, grants, and RLS foundation.
create or replace function buzzerhood.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function buzzerhood.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into buzzerhood.profiles (id, display_name, avatar_path)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name'), ''),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_buzzerhood_profile on auth.users;
create trigger on_auth_user_created_buzzerhood_profile
after insert on auth.users
for each row execute function buzzerhood.handle_new_auth_user();

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
      and m.profile_id = auth.uid()
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
    where ur.profile_id = auth.uid()
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
    where ur.profile_id = auth.uid()
      and ur.revoked_at is null
      and p.key = target_permission_key
  );
$$;

revoke all on function buzzerhood.set_updated_at() from public;
revoke all on function buzzerhood.handle_new_auth_user() from public;
revoke all on function buzzerhood.is_active_organization_member(uuid) from public;
revoke all on function buzzerhood.has_system_role(text) from public;
revoke all on function buzzerhood.has_permission(text) from public;

grant usage on schema buzzerhood to authenticated, service_role;
grant select on buzzerhood.roles, buzzerhood.permissions, buzzerhood.role_permissions to authenticated;
grant select, update(display_name, avatar_path) on buzzerhood.profiles to authenticated;
grant select on buzzerhood.organizations, buzzerhood.organization_members to authenticated;
grant select on buzzerhood.partners, buzzerhood.partner_platform_accounts, buzzerhood.partner_audience_metrics to anon, authenticated;
grant select on buzzerhood.partner_rates to authenticated;
grant execute on function buzzerhood.is_active_organization_member(uuid), buzzerhood.has_system_role(text), buzzerhood.has_permission(text) to authenticated;

do $$ declare target_table regclass; begin
  foreach target_table in array array['buzzerhood.profiles'::regclass,'buzzerhood.organizations'::regclass,'buzzerhood.organization_members'::regclass,'buzzerhood.roles'::regclass,'buzzerhood.permissions'::regclass,'buzzerhood.role_permissions'::regclass,'buzzerhood.user_roles'::regclass,'buzzerhood.partners'::regclass,'buzzerhood.partner_platform_accounts'::regclass,'buzzerhood.partner_audience_metrics'::regclass,'buzzerhood.partner_rates'::regclass]
  loop
    execute format('alter table %s enable row level security', target_table);
    execute format('alter table %s force row level security', target_table);
  end loop;
end $$;

drop trigger if exists set_profiles_updated_at on buzzerhood.profiles;
create trigger set_profiles_updated_at before update on buzzerhood.profiles for each row execute function buzzerhood.set_updated_at();
drop trigger if exists set_organizations_updated_at on buzzerhood.organizations;
create trigger set_organizations_updated_at before update on buzzerhood.organizations for each row execute function buzzerhood.set_updated_at();
drop trigger if exists set_organization_members_updated_at on buzzerhood.organization_members;
create trigger set_organization_members_updated_at before update on buzzerhood.organization_members for each row execute function buzzerhood.set_updated_at();
drop trigger if exists set_partners_updated_at on buzzerhood.partners;
create trigger set_partners_updated_at before update on buzzerhood.partners for each row execute function buzzerhood.set_updated_at();
drop trigger if exists set_partner_platform_accounts_updated_at on buzzerhood.partner_platform_accounts;
create trigger set_partner_platform_accounts_updated_at before update on buzzerhood.partner_platform_accounts for each row execute function buzzerhood.set_updated_at();

drop policy if exists profiles_self_read on buzzerhood.profiles;
drop policy if exists profiles_self_update on buzzerhood.profiles;
drop policy if exists roles_read_authorized on buzzerhood.roles;
drop policy if exists permissions_read_authorized on buzzerhood.permissions;
drop policy if exists role_permissions_read_authorized on buzzerhood.role_permissions;
drop policy if exists user_roles_read_authorized on buzzerhood.user_roles;
drop policy if exists organizations_member_read on buzzerhood.organizations;
drop policy if exists organization_members_member_read on buzzerhood.organization_members;
drop policy if exists partners_public_read on buzzerhood.partners;
drop policy if exists partners_authorized_read on buzzerhood.partners;
drop policy if exists partner_accounts_public_read on buzzerhood.partner_platform_accounts;
drop policy if exists partner_metrics_public_read on buzzerhood.partner_audience_metrics;
drop policy if exists partner_rates_admin_read on buzzerhood.partner_rates;

create policy profiles_self_read on buzzerhood.profiles for select to authenticated using (id = auth.uid() or buzzerhood.has_permission('users.read'));
create policy profiles_self_update on buzzerhood.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy roles_read_authorized on buzzerhood.roles for select to authenticated using (buzzerhood.has_permission('roles.read'));
create policy permissions_read_authorized on buzzerhood.permissions for select to authenticated using (buzzerhood.has_permission('roles.read'));
create policy role_permissions_read_authorized on buzzerhood.role_permissions for select to authenticated using (buzzerhood.has_permission('roles.read'));
create policy user_roles_read_authorized on buzzerhood.user_roles for select to authenticated using (profile_id = auth.uid() or buzzerhood.has_permission('roles.read'));
create policy organizations_member_read on buzzerhood.organizations for select to authenticated using (buzzerhood.is_active_organization_member(id) or buzzerhood.has_permission('organizations.read'));
create policy organization_members_member_read on buzzerhood.organization_members for select to authenticated using (profile_id = auth.uid() or buzzerhood.is_active_organization_member(organization_id) or buzzerhood.has_permission('organizations.read'));
create policy partners_public_read on buzzerhood.partners for select to anon, authenticated using (is_public is true);
create policy partners_authorized_read on buzzerhood.partners for select to authenticated using (is_public is true or (organization_id is not null and buzzerhood.is_active_organization_member(organization_id)) or buzzerhood.has_permission('partners.read'));
create policy partner_accounts_public_read on buzzerhood.partner_platform_accounts for select to anon, authenticated using (exists (select 1 from buzzerhood.partners p where p.id = partner_id and p.is_public is true));
create policy partner_metrics_public_read on buzzerhood.partner_audience_metrics for select to anon, authenticated using (exists (select 1 from buzzerhood.partner_platform_accounts a join buzzerhood.partners p on p.id = a.partner_id where a.id = platform_account_id and p.is_public is true));
create policy partner_rates_admin_read on buzzerhood.partner_rates for select to authenticated using (buzzerhood.has_permission('partners.manage'));




