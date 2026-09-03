-- 0017: Backend B2 organization/partner API authorization and least-privilege grants.

create unique index if not exists partner_platform_accounts_one_primary_idx
  on buzzerhood.partner_platform_accounts(partner_id) where is_primary is true;
create unique index if not exists partner_members_one_pending_owner_application_idx
  on buzzerhood.partner_members(profile_id) where role='owner' and status='invited';

create or replace function buzzerhood.can_manage_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select buzzerhood.has_permission('organizations.manage') or exists (
    select 1 from buzzerhood.organization_members m
    where m.organization_id = target_organization_id
      and m.profile_id = buzzerhood.current_user_id()
      and m.status = 'active' and m.role in ('owner','manager')
  )
$$;

create or replace function buzzerhood.can_manage_partner(target_partner_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select buzzerhood.has_permission('partners.manage') or exists (
    select 1 from buzzerhood.partner_members m
    where m.partner_id = target_partner_id
      and m.profile_id = buzzerhood.current_user_id()
      and m.status = 'active' and m.role in ('owner','manager')
  )
$$;

create or replace function buzzerhood.create_client_organization(input_name text, input_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare organization_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if actor_id is null then raise exception 'authentication required'; end if;
  if exists(select 1 from buzzerhood.partner_members where profile_id=actor_id and role='owner' and status='invited') then raise exception 'partner application already pending'; end if;
  if not exists (select 1 from buzzerhood.profiles where id = actor_id) then raise exception 'profile missing'; end if;
  if char_length(trim(input_name)) < 2 or char_length(trim(input_name)) > 160 then raise exception 'invalid organization name'; end if;
  if input_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid organization slug'; end if;
  insert into buzzerhood.organizations(kind,name,slug) values ('client',trim(input_name),input_slug) returning id into organization_id;
  insert into buzzerhood.organization_members(organization_id,profile_id,role,status,joined_at)
  values (organization_id,actor_id,'owner','active',now());
  return organization_id;
end $$;

create or replace function buzzerhood.create_partner_application(input_kind text,input_display_name text,input_partner_type text,input_category text,input_niche text,input_location text,input_bio text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare partner_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if actor_id is null then raise exception 'authentication required'; end if;
  if input_kind not in ('individual','organization') then raise exception 'invalid partner kind'; end if;
  if char_length(trim(input_display_name)) < 2 or char_length(trim(input_display_name)) > 160 then raise exception 'invalid partner name'; end if;
  insert into buzzerhood.partners(partner_kind,display_name,partner_type,category,niche,location,bio,verification_status,is_public)
  values(input_kind,trim(input_display_name),nullif(trim(input_partner_type),''),nullif(trim(input_category),''),nullif(trim(input_niche),''),nullif(trim(input_location),''),nullif(trim(input_bio),''),'pending',false)
  returning id into partner_id;
  insert into buzzerhood.partner_members(partner_id,profile_id,role,status,invited_by)
  values(partner_id,actor_id,'owner','invited',actor_id);
  return partner_id;
end $$;

create or replace function buzzerhood.request_partner_claim(input_partner_id uuid,input_evidence text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claim_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if actor_id is null then raise exception 'authentication required'; end if;
  if char_length(trim(input_evidence)) < 20 or char_length(trim(input_evidence)) > 4000 then raise exception 'invalid evidence'; end if;
  if not exists(select 1 from buzzerhood.partners where id=input_partner_id and verification_status='unclaimed') then raise exception 'partner unavailable for claim'; end if;
  insert into buzzerhood.partner_claim_requests(partner_id,claimant_profile_id,evidence)
  values(input_partner_id,actor_id,trim(input_evidence))
  on conflict(partner_id) where status='pending' do nothing returning id into claim_id;
  if claim_id is null then raise exception 'claim already pending'; end if;
  return claim_id;
end $$;

create or replace function buzzerhood.review_partner_application(input_partner_id uuid,input_decision text,input_review_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  if input_decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
  perform 1 from buzzerhood.partners where id=input_partner_id and verification_status='pending' for update;
  if not found then raise exception 'pending partner not found'; end if;
  update buzzerhood.partners set verification_status=input_decision,is_public=(input_decision='approved'),updated_at=now() where id=input_partner_id;
  update buzzerhood.partner_members set status=case when input_decision='approved' then 'active'::buzzerhood.membership_status else 'removed'::buzzerhood.membership_status end,joined_at=case when input_decision='approved' then coalesce(joined_at,now()) else joined_at end,updated_at=now() where partner_id=input_partner_id and status='invited';
  insert into buzzerhood.partner_application_reviews(partner_id,decision,reviewed_by,review_note) values(input_partner_id,input_decision,actor_id,nullif(trim(input_review_note),''));
  return input_partner_id;
end $$;

create or replace function buzzerhood.approve_partner_claim(input_claim_id uuid,input_review_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claim_row buzzerhood.partner_claim_requests%rowtype; existing_owner boolean; actor_id uuid := buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  select * into claim_row from buzzerhood.partner_claim_requests where id=input_claim_id and status='pending' for update;
  if not found then raise exception 'pending claim not found'; end if;
  perform 1 from buzzerhood.partners where id=claim_row.partner_id for update;
  select exists(select 1 from buzzerhood.partner_members where partner_id=claim_row.partner_id and role='owner' and status='active') into existing_owner;
  if existing_owner then raise exception 'partner already has active owner'; end if;
  insert into buzzerhood.partner_members(partner_id,profile_id,role,status,invited_by,joined_at)
  values(claim_row.partner_id,claim_row.claimant_profile_id,'owner','active',actor_id,now())
  on conflict(partner_id,profile_id) do update set role='owner',status='active',invited_by=actor_id,joined_at=now(),updated_at=now();
  update buzzerhood.partner_claim_requests set status='approved',reviewed_by=actor_id,reviewed_at=now(),review_note=nullif(trim(input_review_note),''),updated_at=now() where id=claim_row.id;
  update buzzerhood.partner_claim_requests set status='rejected',reviewed_by=actor_id,reviewed_at=now(),review_note='Another claim was approved.',updated_at=now() where partner_id=claim_row.partner_id and id<>claim_row.id and status='pending';
  update buzzerhood.partners set verification_status='approved',updated_at=now() where id=claim_row.partner_id;
  return claim_row.partner_id;
end $$;

create or replace function buzzerhood.reject_partner_claim(input_claim_id uuid,input_review_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claim_partner_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  update buzzerhood.partner_claim_requests set status='rejected',reviewed_by=actor_id,reviewed_at=now(),review_note=nullif(trim(input_review_note),''),updated_at=now() where id=input_claim_id and status='pending' returning partner_id into claim_partner_id;
  if claim_partner_id is null then raise exception 'pending claim not found'; end if;
  return claim_partner_id;
end $$;

revoke all on function buzzerhood.can_manage_organization(uuid),buzzerhood.can_manage_partner(uuid),buzzerhood.create_client_organization(text,text),buzzerhood.create_partner_application(text,text,text,text,text,text,text),buzzerhood.request_partner_claim(uuid,text),buzzerhood.review_partner_application(uuid,text,text),buzzerhood.approve_partner_claim(uuid,text),buzzerhood.reject_partner_claim(uuid,text) from public;
grant execute on function buzzerhood.can_manage_organization(uuid),buzzerhood.can_manage_partner(uuid),buzzerhood.create_client_organization(text,text),buzzerhood.create_partner_application(text,text,text,text,text,text,text),buzzerhood.request_partner_claim(uuid,text),buzzerhood.review_partner_application(uuid,text,text),buzzerhood.approve_partner_claim(uuid,text),buzzerhood.reject_partner_claim(uuid,text) to authenticated,buzzerhood_app;
grant execute on function buzzerhood.is_active_organization_member(uuid),buzzerhood.is_active_partner_member(uuid),buzzerhood.has_permission(text) to buzzerhood_app;

grant select,insert,update(name,slug,updated_at) on buzzerhood.organizations to buzzerhood_app;
grant select on buzzerhood.organization_members to buzzerhood_app;
grant select,update(display_name,legal_name,partner_type,category,niche,location,bio,updated_at) on buzzerhood.partners to buzzerhood_app;
grant select on buzzerhood.partner_members,buzzerhood.partner_claim_requests,buzzerhood.partner_application_reviews to buzzerhood_app;
grant select,insert,update,delete on buzzerhood.partner_platform_accounts to buzzerhood_app;
grant select on buzzerhood.partner_audience_metrics to buzzerhood_app;
grant select,insert,update on buzzerhood.partner_rates to buzzerhood_app;
grant select on buzzerhood.public_network_partners to buzzerhood_app;

drop policy if exists organizations_app_read on buzzerhood.organizations;
drop policy if exists organizations_app_update on buzzerhood.organizations;
drop policy if exists organization_members_app_read on buzzerhood.organization_members;
drop policy if exists partners_app_read on buzzerhood.partners;
drop policy if exists partners_app_update on buzzerhood.partners;
drop policy if exists partner_members_app_read on buzzerhood.partner_members;
drop policy if exists partner_claims_app_read on buzzerhood.partner_claim_requests;
drop policy if exists partner_reviews_app_read on buzzerhood.partner_application_reviews;
drop policy if exists partner_accounts_app_read on buzzerhood.partner_platform_accounts;
drop policy if exists partner_accounts_app_write on buzzerhood.partner_platform_accounts;
drop policy if exists partner_metrics_app_read on buzzerhood.partner_audience_metrics;
drop policy if exists partner_rates_app_read on buzzerhood.partner_rates;
drop policy if exists partner_rates_app_write on buzzerhood.partner_rates;

create policy organizations_app_read on buzzerhood.organizations for select to buzzerhood_app using(buzzerhood.is_active_organization_member(id) or buzzerhood.has_permission('organizations.read'));
create policy organizations_app_update on buzzerhood.organizations for update to buzzerhood_app using(buzzerhood.can_manage_organization(id)) with check(buzzerhood.can_manage_organization(id));
create policy organization_members_app_read on buzzerhood.organization_members for select to buzzerhood_app using(buzzerhood.is_active_organization_member(organization_id) or buzzerhood.has_permission('organizations.read'));
create policy partners_app_read on buzzerhood.partners for select to buzzerhood_app using(buzzerhood.is_active_partner_member(id) or buzzerhood.has_permission('partners.read'));
create policy partners_app_update on buzzerhood.partners for update to buzzerhood_app using(buzzerhood.can_manage_partner(id)) with check(buzzerhood.can_manage_partner(id));
create policy partner_members_app_read on buzzerhood.partner_members for select to buzzerhood_app using(profile_id=buzzerhood.current_user_id() or buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.read'));
create policy partner_claims_app_read on buzzerhood.partner_claim_requests for select to buzzerhood_app using(claimant_profile_id=buzzerhood.current_user_id() or buzzerhood.has_permission('partners.read'));
create policy partner_reviews_app_read on buzzerhood.partner_application_reviews for select to buzzerhood_app using(buzzerhood.has_permission('partners.read'));
create policy partner_accounts_app_read on buzzerhood.partner_platform_accounts for select to buzzerhood_app using(buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.read'));
create policy partner_accounts_app_write on buzzerhood.partner_platform_accounts for all to buzzerhood_app using(buzzerhood.can_manage_partner(partner_id)) with check(buzzerhood.can_manage_partner(partner_id));
create policy partner_metrics_app_read on buzzerhood.partner_audience_metrics for select to buzzerhood_app using(exists(select 1 from buzzerhood.partner_platform_accounts a where a.id=platform_account_id and (buzzerhood.is_active_partner_member(a.partner_id) or buzzerhood.has_permission('partners.read'))));
create policy partner_rates_app_read on buzzerhood.partner_rates for select to buzzerhood_app using(buzzerhood.is_active_partner_member(partner_id) or buzzerhood.has_permission('partners.manage'));
create policy partner_rates_app_write on buzzerhood.partner_rates for all to buzzerhood_app using(buzzerhood.can_manage_partner(partner_id)) with check(buzzerhood.can_manage_partner(partner_id));

insert into buzzerhood.schema_migrations(version,filename)
values('0017','0017_backend_organization_partner_api.sql') on conflict(version) do nothing;
