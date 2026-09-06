-- 0029: Controlled system-role replacement for internal users.
create or replace function buzzerhood.admin_set_user_role(input_user_id uuid,input_role text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id(); target_role_id uuid; actor_is_super boolean; target_is_partner boolean; target_is_super boolean;
begin
  if not buzzerhood.has_permission('users.manage') then raise exception 'permission denied'; end if;
  if input_user_id=actor_id then raise exception 'cannot change own role'; end if;
  if input_role not in ('internal_team','admin','super_admin') then raise exception 'invalid system role'; end if;
  select r.id into target_role_id from buzzerhood.roles r where r.key=input_role and r.scope='system';
  if target_role_id is null then raise exception 'system role not found'; end if;
  select exists(select 1 from buzzerhood.user_roles ur join buzzerhood.roles r on r.id=ur.role_id where ur.profile_id=input_user_id and ur.revoked_at is null and r.key='super_admin') into target_is_super;
  select exists(select 1 from buzzerhood.user_roles ur join buzzerhood.roles r on r.id=ur.role_id where ur.profile_id=actor_id and ur.revoked_at is null and r.key='super_admin') into actor_is_super;
  select exists(select 1 from buzzerhood.partner_members where profile_id=input_user_id and status in ('active','pending','suspended')) into target_is_partner;
  if target_is_partner then raise exception 'partner identity uses partner membership'; end if;
  if (input_role='super_admin' or target_is_super) and not actor_is_super then raise exception 'super admin role requires super admin actor'; end if;
  if not exists(select 1 from buzzerhood.users where id=input_user_id) then raise exception 'user not found'; end if;
  update buzzerhood.user_roles ur set revoked_at=coalesce(ur.revoked_at,now()) from buzzerhood.roles r where ur.role_id=r.id and ur.profile_id=input_user_id and ur.revoked_at is null and r.scope='system';
  insert into buzzerhood.user_roles(profile_id,role_id,granted_by) values(input_user_id,target_role_id,actor_id);
  insert into buzzerhood.auth_security_events(user_id,event_type,metadata) values(input_user_id,'system_role_changed',jsonb_build_object('role',input_role,'actor_id',actor_id));
  return input_user_id;
end $$;
revoke all on function buzzerhood.admin_set_user_role(uuid,text) from public,anon,authenticated;
grant execute on function buzzerhood.admin_set_user_role(uuid,text) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0029','0029_admin_user_role_management.sql') on conflict(version) do nothing;
