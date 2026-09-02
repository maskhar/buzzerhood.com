-- 0007: activate secure organization and partner identity foundations.
alter table buzzerhood.partners
  add column if not exists partner_kind text not null default 'individual' check (partner_kind in ('individual', 'organization')),
  add column if not exists legal_name text,
  add column if not exists location text,
  add column if not exists bio text;

create table if not exists buzzerhood.partner_members (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references buzzerhood.partners(id) on delete cascade,
  profile_id uuid not null references buzzerhood.profiles(id) on delete cascade,
  role buzzerhood.membership_role not null default 'member',
  status buzzerhood.membership_status not null default 'invited',
  invited_by uuid references buzzerhood.profiles(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, profile_id)
);

create table if not exists buzzerhood.partner_claim_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references buzzerhood.partners(id) on delete cascade,
  claimant_profile_id uuid not null references buzzerhood.profiles(id) on delete cascade,
  evidence text not null check (char_length(trim(evidence)) between 20 and 4000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references buzzerhood.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists partner_claim_requests_one_pending_per_partner_idx
  on buzzerhood.partner_claim_requests(partner_id) where status = 'pending';
create index if not exists partner_members_profile_active_idx
  on buzzerhood.partner_members(profile_id, status);
create index if not exists partner_claim_requests_claimant_idx
  on buzzerhood.partner_claim_requests(claimant_profile_id, status);

create or replace function buzzerhood.is_active_partner_member(target_partner_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from buzzerhood.partner_members m where m.partner_id = target_partner_id and m.profile_id = auth.uid() and m.status = 'active');
$$;

create or replace function buzzerhood.create_client_organization(input_name text, input_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare organization_id uuid; actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from buzzerhood.profiles where id = actor_id) then raise exception 'profile missing'; end if;
  if char_length(trim(input_name)) < 2 or char_length(trim(input_name)) > 160 then raise exception 'invalid organization name'; end if;
  if input_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid organization slug'; end if;
  insert into buzzerhood.organizations(kind, name, slug) values ('client', trim(input_name), input_slug) returning id into organization_id;
  insert into buzzerhood.organization_members(organization_id, profile_id, role, status, joined_at)
  values (organization_id, actor_id, 'owner', 'active', now());
  return organization_id;
end;
$$;

create or replace function buzzerhood.create_partner_application(input_kind text, input_display_name text, input_partner_type text, input_category text, input_niche text, input_location text, input_bio text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare partner_id uuid; actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'authentication required'; end if;
  if input_kind not in ('individual','organization') then raise exception 'invalid partner kind'; end if;
  if char_length(trim(input_display_name)) < 2 or char_length(trim(input_display_name)) > 160 then raise exception 'invalid partner name'; end if;
  insert into buzzerhood.partners(partner_kind, display_name, partner_type, category, niche, location, bio, verification_status, is_public)
  values (input_kind, trim(input_display_name), nullif(trim(input_partner_type), ''), nullif(trim(input_category), ''), nullif(trim(input_niche), ''), nullif(trim(input_location), ''), nullif(trim(input_bio), ''), 'pending', false)
  returning id into partner_id;
  insert into buzzerhood.partner_members(partner_id, profile_id, role, status, invited_by)
  values (partner_id, actor_id, 'owner', 'invited', actor_id);
  return partner_id;
end;
$$;

create or replace function buzzerhood.request_partner_claim(input_partner_id uuid, input_evidence text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claim_id uuid; actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from buzzerhood.partners where id = input_partner_id and verification_status = 'unclaimed') then raise exception 'partner unavailable for claim'; end if;
  insert into buzzerhood.partner_claim_requests(partner_id, claimant_profile_id, evidence)
  values (input_partner_id, actor_id, input_evidence)
  on conflict (partner_id) where status = 'pending' do nothing
  returning id into claim_id;
  if claim_id is null then raise exception 'claim already pending'; end if;
  return claim_id;
end;
$$;

create or replace function buzzerhood.approve_partner_claim(input_claim_id uuid, input_review_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claim_row buzzerhood.partner_claim_requests%rowtype; existing_owner boolean;
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  select * into claim_row from buzzerhood.partner_claim_requests where id = input_claim_id and status = 'pending' for update;
  if not found then raise exception 'pending claim not found'; end if;
  perform 1 from buzzerhood.partners where id = claim_row.partner_id for update;
  select exists(select 1 from buzzerhood.partner_members where partner_id = claim_row.partner_id and role = 'owner' and status = 'active') into existing_owner;
  if existing_owner then raise exception 'partner already has active owner'; end if;
  insert into buzzerhood.partner_members(partner_id, profile_id, role, status, invited_by, joined_at)
  values (claim_row.partner_id, claim_row.claimant_profile_id, 'owner', 'active', auth.uid(), now())
  on conflict (partner_id, profile_id) do update set role = 'owner', status = 'active', invited_by = auth.uid(), joined_at = now(), updated_at = now();
  update buzzerhood.partner_claim_requests set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_note = nullif(trim(input_review_note), ''), updated_at = now() where id = claim_row.id;
  update buzzerhood.partner_claim_requests set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_note = 'Another claim was approved.', updated_at = now() where partner_id = claim_row.partner_id and id <> claim_row.id and status = 'pending';
  update buzzerhood.partners set verification_status = 'approved', updated_at = now() where id = claim_row.partner_id;
  return claim_row.partner_id;
end;
$$;

revoke all on function buzzerhood.is_active_partner_member(uuid), buzzerhood.create_client_organization(text,text), buzzerhood.create_partner_application(text,text,text,text,text,text,text), buzzerhood.request_partner_claim(uuid,text), buzzerhood.approve_partner_claim(uuid,text) from public;
grant execute on function buzzerhood.is_active_partner_member(uuid), buzzerhood.create_client_organization(text,text), buzzerhood.create_partner_application(text,text,text,text,text,text,text), buzzerhood.request_partner_claim(uuid,text), buzzerhood.approve_partner_claim(uuid,text) to authenticated;

grant usage on schema buzzerhood to authenticated, service_role;
grant select on buzzerhood.partner_members, buzzerhood.partner_claim_requests to authenticated;
grant select, insert, update on buzzerhood.partner_platform_accounts, buzzerhood.partner_audience_metrics, buzzerhood.partner_rates to authenticated;

alter table buzzerhood.partner_members enable row level security;
alter table buzzerhood.partner_members force row level security;
alter table buzzerhood.partner_claim_requests enable row level security;
alter table buzzerhood.partner_claim_requests force row level security;

drop policy if exists partner_members_member_read on buzzerhood.partner_members;
drop policy if exists partner_members_admin_read on buzzerhood.partner_members;
drop policy if exists partner_claims_claimant_read on buzzerhood.partner_claim_requests;
drop policy if exists partner_claims_admin_read on buzzerhood.partner_claim_requests;
drop policy if exists partner_accounts_owner_manage on buzzerhood.partner_platform_accounts;
drop policy if exists partner_metrics_owner_manage on buzzerhood.partner_audience_metrics;
drop policy if exists partner_rates_owner_manage on buzzerhood.partner_rates;
create policy partner_members_member_read on buzzerhood.partner_members for select to authenticated using (profile_id = auth.uid() or buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.read'));
create policy partner_members_admin_read on buzzerhood.partner_members for all to authenticated using (buzzerhood.has_permission('partners.manage')) with check (buzzerhood.has_permission('partners.manage'));
create policy partner_claims_claimant_read on buzzerhood.partner_claim_requests for select to authenticated using (claimant_profile_id = auth.uid() or buzzerhood.has_permission('partners.read'));
create policy partner_claims_admin_read on buzzerhood.partner_claim_requests for all to authenticated using (buzzerhood.has_permission('partners.manage')) with check (buzzerhood.has_permission('partners.manage'));
create policy partner_accounts_owner_manage on buzzerhood.partner_platform_accounts for all to authenticated using (buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.manage')) with check (buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.manage'));
create policy partner_metrics_owner_manage on buzzerhood.partner_audience_metrics for all to authenticated using (exists (select 1 from buzzerhood.partner_platform_accounts a where a.id = platform_account_id and (buzzerhood.is_active_partner_member(a.partner_id) or buzzerhood.has_permission('partners.manage')))) with check (exists (select 1 from buzzerhood.partner_platform_accounts a where a.id = platform_account_id and (buzzerhood.is_active_partner_member(a.partner_id) or buzzerhood.has_permission('partners.manage'))));
create policy partner_rates_owner_manage on buzzerhood.partner_rates for all to authenticated using (buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.manage')) with check (buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.manage'));

drop trigger if exists set_partner_members_updated_at on buzzerhood.partner_members;
create trigger set_partner_members_updated_at before update on buzzerhood.partner_members for each row execute function buzzerhood.set_updated_at();
drop trigger if exists set_partner_claim_requests_updated_at on buzzerhood.partner_claim_requests;
create trigger set_partner_claim_requests_updated_at before update on buzzerhood.partner_claim_requests for each row execute function buzzerhood.set_updated_at();

insert into buzzerhood.schema_migrations (version, filename) values ('0007', '0007_partner_identity_and_client_organizations.sql') on conflict (version) do nothing;
