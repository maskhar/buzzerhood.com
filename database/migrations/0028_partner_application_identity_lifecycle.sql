-- 0028: Active application identity uniqueness and reversible approved Partner archive.
create or replace function buzzerhood.normalize_partner_whatsapp(value text) returns text language sql immutable strict set search_path='' as $$
  with input as (select regexp_replace(btrim(value),'[^0-9]','','g') digits)
  select case when digits like '62%' then '+'||digits when digits like '0%' then '+62'||substr(digits,2) when digits like '8%' then '+62'||digits else '+'||digits end from input
$$;

alter table buzzerhood.public_partner_applications
  add column if not exists normalized_email text generated always as (lower(btrim(email))) stored,
  add column if not exists normalized_whatsapp text generated always as (buzzerhood.normalize_partner_whatsapp(whatsapp)) stored,
  add column if not exists partner_id uuid references buzzerhood.partners(id);
alter table buzzerhood.partners add column if not exists archived_at timestamptz, add column if not exists archived_by uuid references buzzerhood.profiles(id);
update buzzerhood.public_partner_applications application set partner_id=partner.id from buzzerhood.partners partner where partner.source_data->>'public_partner_application_id'=application.id::text;
create unique index if not exists public_partner_applications_active_email_idx on buzzerhood.public_partner_applications(normalized_email) where archived_at is null and status in ('pending','approved');
create unique index if not exists public_partner_applications_active_whatsapp_idx on buzzerhood.public_partner_applications(normalized_whatsapp) where archived_at is null and status in ('pending','approved');
create index if not exists public_partner_applications_partner_idx on buzzerhood.public_partner_applications(partner_id) where partner_id is not null;

create or replace function buzzerhood.review_public_partner_application(input_application_id uuid,input_decision text,input_review_note text default null) returns uuid language plpgsql set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id(); begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  if input_decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
  perform 1 from buzzerhood.public_partner_applications where id=input_application_id and status='pending' and archived_at is null for update;
  if not found then raise exception 'pending public partner application not found'; end if;
  update buzzerhood.public_partner_applications set status=input_decision,reviewed_by=actor_id,reviewed_at=now(),review_note=nullif(trim(input_review_note),''),updated_at=now() where id=input_application_id;
  return input_application_id;
end $$;

create or replace function buzzerhood.set_public_partner_application_archived(input_application_id uuid,input_archived boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id(); application buzzerhood.public_partner_applications%rowtype; begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  select * into application from buzzerhood.public_partner_applications where id=input_application_id for update; if not found then raise exception 'public partner application not found'; end if;
  if input_archived then
    update buzzerhood.public_partner_applications set archived_at=coalesce(archived_at,now()),archived_by=coalesce(archived_by,actor_id),updated_at=now() where id=application.id;
    if application.status='approved' and application.partner_id is not null then
      update buzzerhood.partners set archived_at=coalesce(archived_at,now()),archived_by=coalesce(archived_by,actor_id),updated_at=now() where id=application.partner_id;
      update buzzerhood.partner_members set status='suspended',updated_at=now() where partner_id=application.partner_id and status='active';
    end if;
  else
    if application.status='approved' and application.partner_id is not null then perform 1 from buzzerhood.partners where id=application.partner_id and archived_at is not null for update; if not found then raise exception 'partner already active'; end if; end if;
    update buzzerhood.public_partner_applications set archived_at=null,archived_by=null,updated_at=now() where id=application.id;
    if application.status='approved' and application.partner_id is not null then
      update buzzerhood.partners set archived_at=null,archived_by=null,updated_at=now() where id=application.partner_id;
      update buzzerhood.partner_members set status='active',joined_at=coalesce(joined_at,now()),updated_at=now() where partner_id=application.partner_id and status='suspended';
    end if;
  end if;
  return application.id;
end $$;

drop function buzzerhood.create_partner_invitation(uuid,text,timestamptz);
create function buzzerhood.create_partner_invitation(input_application_id uuid,input_token_hash text,input_expires_at timestamptz)
returns table(user_id uuid,partner_id uuid,email text,display_name text,invitation_required boolean) language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id(); app buzzerhood.public_partner_applications%rowtype; existing_partner_id uuid; existing_user_id uuid; existing_user_status buzzerhood.user_status; new_user_id uuid:=gen_random_uuid(); new_partner_id uuid:=gen_random_uuid(); begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  select * into app from buzzerhood.public_partner_applications where id=input_application_id and status='approved' and archived_at is null for update;
  if not found then raise exception 'approved public partner application not found'; end if;
  if app.partner_id is not null then raise exception 'application already registered'; end if;
  select previous.partner_id into existing_partner_id from buzzerhood.public_partner_applications previous join buzzerhood.partners partner on partner.id=previous.partner_id where previous.id<>app.id and previous.status='approved' and previous.archived_at is not null and partner.archived_at is not null and previous.normalized_email=app.normalized_email and previous.normalized_whatsapp=app.normalized_whatsapp limit 1;
  if existing_partner_id is not null then
    select users.id,users.status into existing_user_id,existing_user_status from buzzerhood.partner_members members join buzzerhood.profiles profiles on profiles.id=members.profile_id join buzzerhood.users users on users.id=profiles.user_id where members.partner_id=existing_partner_id and members.role='owner' order by members.created_at limit 1 for update of users,members;
    if existing_user_id is null or existing_user_status in ('suspended','disabled') then raise exception 'archived partner account requires manual review'; end if;
    update buzzerhood.partners set display_name=app.full_name,partner_type=app.category,category=app.category,location=app.city,bio=app.message,archived_at=null,archived_by=null,updated_at=now() where id=existing_partner_id;
    update buzzerhood.public_partner_applications applications set partner_id=existing_partner_id,updated_at=now() where applications.id=app.id;
    if existing_user_status='active' then update buzzerhood.partner_members members set status='active',joined_at=coalesce(members.joined_at,now()),updated_at=now() where members.partner_id=existing_partner_id and members.profile_id=existing_user_id and members.status='suspended'; return query select existing_user_id,existing_partner_id,app.email,app.full_name,false; return; end if;
    update buzzerhood.partner_members members set status='invited',updated_at=now() where members.partner_id=existing_partner_id and members.profile_id=existing_user_id and members.status in ('suspended','invited');
    update buzzerhood.account_action_tokens tokens set used_at=coalesce(tokens.used_at,now()) where tokens.user_id=existing_user_id and tokens.kind='partner_invitation' and tokens.used_at is null;
    insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) values(existing_user_id,'partner_invitation',input_token_hash,input_expires_at,actor_id);
    return query select existing_user_id,existing_partner_id,app.email,app.full_name,true; return;
  end if;
  if exists(select 1 from buzzerhood.users users where users.normalized_email=app.normalized_email) then raise exception 'email already registered'; end if;
  insert into buzzerhood.users(id,email,normalized_email,password_hash,status) values(new_user_id,app.email,app.normalized_email,'$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','pending_activation');
  insert into buzzerhood.profiles(id,user_id,display_name) values(new_user_id,new_user_id,app.full_name);
  insert into buzzerhood.partners(id,display_name,partner_kind,partner_type,category,location,bio,verification_status,is_public,source_data) values(new_partner_id,app.full_name,'individual',app.category,app.category,app.city,app.message,'approved',false,jsonb_build_object('public_partner_application_id',app.id));
  insert into buzzerhood.partner_members(partner_id,profile_id,role,status,invited_by) values(new_partner_id,new_user_id,'owner','invited',actor_id);
  insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) values(new_user_id,'partner_invitation',input_token_hash,input_expires_at,actor_id);
  update buzzerhood.public_partner_applications set partner_id=new_partner_id,updated_at=now() where id=app.id;
  return query select new_user_id,new_partner_id,app.email,app.full_name,true;
end $$;

revoke all on function buzzerhood.normalize_partner_whatsapp(text) from public,anon,authenticated;
revoke all on function buzzerhood.create_partner_invitation(uuid,text,timestamptz) from public,anon,authenticated;
revoke all on function buzzerhood.set_public_partner_application_archived(uuid,boolean) from public,anon,authenticated;
grant execute on function buzzerhood.normalize_partner_whatsapp(text),buzzerhood.create_partner_invitation(uuid,text,timestamptz),buzzerhood.set_public_partner_application_archived(uuid,boolean) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0028','0028_partner_application_identity_lifecycle.sql') on conflict(version) do nothing;
