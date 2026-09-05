-- 0021: partner invitation activation and password-reset lifecycle.

create table buzzerhood.account_action_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references buzzerhood.users(id) on delete cascade,
  kind text not null check (kind in ('partner_invitation','password_reset')),
  token_hash char(64) not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references buzzerhood.profiles(id),
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create index account_action_tokens_user_kind_idx on buzzerhood.account_action_tokens(user_id,kind,expires_at desc);
alter table buzzerhood.account_action_tokens enable row level security;
alter table buzzerhood.account_action_tokens force row level security;
revoke all on buzzerhood.account_action_tokens from public,anon,authenticated;
grant select,insert,update on buzzerhood.account_action_tokens to buzzerhood_app;
create policy account_action_tokens_app_access on buzzerhood.account_action_tokens for all to buzzerhood_app using (user_id=buzzerhood.current_user_id() or buzzerhood.has_permission('partners.manage')) with check (user_id=buzzerhood.current_user_id() or buzzerhood.has_permission('partners.manage'));

create or replace function buzzerhood.create_partner_invitation(input_application_id uuid,input_token_hash text,input_expires_at timestamptz)
returns table(user_id uuid,partner_id uuid,email text,display_name text) language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id(); app buzzerhood.public_partner_applications%rowtype; new_user_id uuid:=gen_random_uuid(); new_partner_id uuid:=gen_random_uuid();
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  select * into app from buzzerhood.public_partner_applications where id=input_application_id and status='approved' for update;
  if not found then raise exception 'approved public partner application not found'; end if;
  if exists(select 1 from buzzerhood.users u where u.normalized_email=lower(btrim(app.email))) then raise exception 'email already registered'; end if;
  insert into buzzerhood.users(id,email,normalized_email,password_hash,status) values(new_user_id,app.email,lower(btrim(app.email)),'$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','pending_activation');
  insert into buzzerhood.profiles(id,user_id,display_name) values(new_user_id,new_user_id,app.full_name);
  insert into buzzerhood.partners(id,display_name,partner_kind,partner_type,category,location,bio,verification_status,is_public,source_data) values(new_partner_id,app.full_name,'individual',app.category,app.category,app.city,app.message,'approved',false,jsonb_build_object('public_partner_application_id',app.id));
  insert into buzzerhood.partner_members(partner_id,profile_id,role,status,invited_by) values(new_partner_id,new_user_id,'owner','invited',actor_id);
  insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) values(new_user_id,'partner_invitation',input_token_hash,input_expires_at,actor_id);
  return query select new_user_id,new_partner_id,app.email,app.full_name;
end $$;

create or replace function buzzerhood.activate_partner_invitation(input_token_hash text,input_password_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare token_row buzzerhood.account_action_tokens%rowtype;
begin
  select * into token_row from buzzerhood.account_action_tokens where token_hash=input_token_hash and kind='partner_invitation' and used_at is null and expires_at>now() for update;
  if not found then raise exception 'invalid or expired token'; end if;
  update buzzerhood.users set password_hash=input_password_hash,status='active',email_verified_at=coalesce(email_verified_at,now()),password_changed_at=now() where id=token_row.user_id and status='pending_activation';
  if not found then raise exception 'account cannot be activated'; end if;
  update buzzerhood.partner_members set status='active',joined_at=coalesce(joined_at,now()),updated_at=now() where profile_id=token_row.user_id and status='invited';
  update buzzerhood.account_action_tokens set used_at=now() where id=token_row.id;
  insert into buzzerhood.auth_security_events(user_id,event_type,metadata) values(token_row.user_id,'account_status_changed',jsonb_build_object('status','active','source','partner_invitation'));
  return token_row.user_id;
end $$;

create or replace function buzzerhood.create_password_reset(input_normalized_email text,input_token_hash text,input_expires_at timestamptz) returns table(user_id uuid,email text,display_name text) language plpgsql security definer set search_path='' as $$
begin
  return query with target as (select u.id,u.email,p.display_name from buzzerhood.users u left join buzzerhood.profiles p on p.id=u.id where u.normalized_email=input_normalized_email and u.status='active' limit 1), revoked as (update buzzerhood.account_action_tokens t set used_at=now() from target where t.user_id=target.id and t.kind='password_reset' and t.used_at is null returning t.id), inserted as (insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at) select target.id,'password_reset',input_token_hash,input_expires_at from target returning user_id) select target.id,target.email,target.display_name from target;
end $$;

create or replace function buzzerhood.reset_password(input_token_hash text,input_password_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare token_row buzzerhood.account_action_tokens%rowtype;
begin
  select * into token_row from buzzerhood.account_action_tokens where token_hash=input_token_hash and kind='password_reset' and used_at is null and expires_at>now() for update;
  if not found then raise exception 'invalid or expired token'; end if;
  update buzzerhood.users set password_hash=input_password_hash,password_changed_at=now() where id=token_row.user_id and status='active';
  update buzzerhood.account_action_tokens set used_at=now() where id=token_row.id;
  update buzzerhood.refresh_sessions set revoked_at=coalesce(revoked_at,now()),revocation_reason='password_reset' where user_id=token_row.user_id and revoked_at is null;
  insert into buzzerhood.auth_security_events(user_id,event_type,metadata) values(token_row.user_id,'password_changed',jsonb_build_object('source','password_reset'));
  return token_row.user_id;
end $$;
revoke all on function buzzerhood.create_partner_invitation(uuid,text,timestamptz),buzzerhood.activate_partner_invitation(text,text),buzzerhood.create_password_reset(text,text,timestamptz),buzzerhood.reset_password(text,text) from public,anon,authenticated;
grant execute on function buzzerhood.create_partner_invitation(uuid,text,timestamptz),buzzerhood.activate_partner_invitation(text,text),buzzerhood.create_password_reset(text,text,timestamptz),buzzerhood.reset_password(text,text) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0021','0021_partner_activation_and_password_reset.sql') on conflict(version) do nothing;
