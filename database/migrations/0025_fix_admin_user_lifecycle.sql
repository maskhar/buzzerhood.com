-- 0025: Fix ambiguous password-reset function output and keep migration 0024 immutable.

create or replace function buzzerhood.admin_create_password_reset(input_user_id uuid,input_token_hash text,input_expires_at timestamptz)
returns table(user_id uuid,email text,display_name text)
language plpgsql
security definer
set search_path=''
as $$
declare
  actor_id uuid:=buzzerhood.current_user_id();
  target_email text;
  target_display_name text;
begin
  if not buzzerhood.has_permission('users.manage') then raise exception 'permission denied'; end if;

  select u.email,p.display_name into target_email,target_display_name
  from buzzerhood.users u
  left join buzzerhood.profiles p on p.id=u.id
  where u.id=input_user_id and u.status='active'
  limit 1;

  if not found then return; end if;

  update buzzerhood.account_action_tokens
  set used_at=now()
  where account_action_tokens.user_id=input_user_id
    and kind='password_reset'
    and used_at is null;

  insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by)
  values(input_user_id,'password_reset',input_token_hash,input_expires_at,actor_id);

  return query select input_user_id,target_email,target_display_name;
end $$;

revoke all on function buzzerhood.admin_create_password_reset(uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function buzzerhood.admin_create_password_reset(uuid,text,timestamptz) to buzzerhood_app;

insert into buzzerhood.schema_migrations(version,filename)
values('0025','0025_fix_admin_user_lifecycle.sql')
on conflict(version) do nothing;
