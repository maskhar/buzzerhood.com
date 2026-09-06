-- 0023: Super Admin user invitation and reversible access management.
drop policy if exists users_app_manage_read on buzzerhood.users;
drop policy if exists users_app_manage_update on buzzerhood.users;
create policy users_app_manage_read on buzzerhood.users for select to buzzerhood_app using (buzzerhood.has_permission('users.manage'));
create policy users_app_manage_update on buzzerhood.users for update to buzzerhood_app using (buzzerhood.has_permission('users.manage')) with check (buzzerhood.has_permission('users.manage'));
create or replace function buzzerhood.admin_create_user_invitation(input_email text,input_display_name text,input_role text,input_token_hash text,input_expires_at timestamptz)
returns table(id uuid,email text,display_name text,status text,role text) language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id(); new_id uuid:=gen_random_uuid(); role_id uuid;
begin
  if not buzzerhood.has_permission('users.manage') then raise exception 'permission denied'; end if;
  if input_role not in ('internal_team','admin','super_admin') then raise exception 'invalid system role'; end if;
  select r.id into role_id from buzzerhood.roles r where r.key=input_role and r.scope='system';
  insert into buzzerhood.users(id,email,normalized_email,password_hash,status) values(new_id,btrim(input_email),lower(btrim(input_email)),'$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','pending_activation');
  insert into buzzerhood.profiles(id,user_id,display_name) values(new_id,new_id,btrim(input_display_name));
  insert into buzzerhood.user_roles(profile_id,role_id,granted_by) values(new_id,role_id,actor_id);
  insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) values(new_id,'partner_invitation',input_token_hash,input_expires_at,actor_id);
  return query select new_id,btrim(input_email),btrim(input_display_name),'pending_activation',input_role;
end $$;

create or replace function buzzerhood.admin_set_user_status(input_user_id uuid,input_status text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('users.manage') then raise exception 'permission denied'; end if;
  if input_user_id=actor_id then raise exception 'cannot change own status'; end if;
  if input_status not in ('active','disabled') then raise exception 'invalid status'; end if;
  update buzzerhood.users set status=input_status::buzzerhood.user_status where id=input_user_id;
  if not found then raise exception 'user not found'; end if;
  if input_status='disabled' then update buzzerhood.refresh_sessions set revoked_at=coalesce(revoked_at,now()),revocation_reason='admin_disabled' where user_id=input_user_id and revoked_at is null; end if;
  insert into buzzerhood.auth_security_events(user_id,event_type,metadata) values(input_user_id,'account_status_changed',jsonb_build_object('status',input_status,'actor_id',actor_id));
  return input_user_id;
end $$;

revoke all on function buzzerhood.admin_create_user_invitation(text,text,text,text,timestamptz),buzzerhood.admin_set_user_status(uuid,text) from public,anon,authenticated;
grant execute on function buzzerhood.admin_create_user_invitation(text,text,text,text,timestamptz),buzzerhood.admin_set_user_status(uuid,text) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0023','0023_admin_user_management.sql') on conflict(version) do nothing;
