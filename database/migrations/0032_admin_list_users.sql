-- 0032: Allow authorized Admin user listing without weakening direct users-table RLS.
create or replace function buzzerhood.admin_list_users()
returns table(id uuid,email text,display_name text,status text,roles text[],partner_memberships bigint,created_at timestamptz)
language plpgsql
security definer
set search_path=''
as $$
begin
  if buzzerhood.current_user_id() is null or not buzzerhood.has_permission('users.manage') then
    raise exception 'permission denied';
  end if;
  return query
  select users.id,users.email,profiles.display_name,users.status::text,
    array_remove(array_agg(distinct roles.key),null),count(distinct members.id),users.created_at
  from buzzerhood.users users
  left join buzzerhood.profiles profiles on profiles.id=users.id
  left join buzzerhood.user_roles user_roles on user_roles.profile_id=users.id and user_roles.revoked_at is null
  left join buzzerhood.roles roles on roles.id=user_roles.role_id
  left join buzzerhood.partner_members members on members.profile_id=users.id and members.status in ('invited','active','suspended')
  group by users.id,profiles.display_name
  order by users.created_at desc;
end;
$$;
revoke all on function buzzerhood.admin_list_users() from public,anon,authenticated;
grant execute on function buzzerhood.admin_list_users() to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0032','0032_admin_list_users.sql') on conflict(version) do nothing;
