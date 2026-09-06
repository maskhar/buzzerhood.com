-- 0022: reversible archive metadata for public partner applications.
alter table buzzerhood.public_partner_applications
  add column archived_at timestamptz,
  add column archived_by uuid references buzzerhood.profiles(id);

create index public_partner_applications_active_status_idx
  on buzzerhood.public_partner_applications(status,created_at desc) where archived_at is null;

create or replace function buzzerhood.set_public_partner_application_archived(input_application_id uuid,input_archived boolean)
returns uuid language plpgsql set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  update buzzerhood.public_partner_applications
    set archived_at=case when input_archived then now() else null end,
        archived_by=case when input_archived then actor_id else null end,
        updated_at=now()
    where id=input_application_id returning id into input_application_id;
  if not found then raise exception 'public partner application not found'; end if;
  return input_application_id;
end $$;

revoke all on function buzzerhood.set_public_partner_application_archived(uuid,boolean) from public,anon,authenticated;
grant execute on function buzzerhood.set_public_partner_application_archived(uuid,boolean) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0022','0022_partner_application_archive.sql') on conflict(version) do nothing;
