-- 0031: Expose Partner invitation state to authorized Admin review APIs without bypassing RLS in application queries.
create or replace function buzzerhood.admin_partner_application_access_status(input_partner_id uuid)
returns table(member_status text,user_status text)
language plpgsql
security definer
set search_path=''
as $$
begin
  if buzzerhood.current_user_id() is null or not buzzerhood.has_permission('partners.manage') then
    raise exception 'permission denied';
  end if;
  return query
  select members.status::text, users.status::text
  from buzzerhood.partner_members members
  join buzzerhood.profiles profiles on profiles.id=members.profile_id
  join buzzerhood.users users on users.id=profiles.user_id
  where members.partner_id=input_partner_id and members.role='owner'
  order by members.created_at
  limit 1;
end;
$$;
revoke all on function buzzerhood.admin_partner_application_access_status(uuid) from public,anon,authenticated;
grant execute on function buzzerhood.admin_partner_application_access_status(uuid) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0031','0031_admin_partner_application_access_status.sql') on conflict(version) do nothing;
