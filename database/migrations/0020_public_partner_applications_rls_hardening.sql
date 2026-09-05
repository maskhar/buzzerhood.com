-- 0020: Do not expose private partner applications when app.user_id is absent.

drop policy if exists public_partner_applications_app_read on buzzerhood.public_partner_applications;

create policy public_partner_applications_app_read on buzzerhood.public_partner_applications
  for select to buzzerhood_app using (buzzerhood.has_permission('partners.manage'));

insert into buzzerhood.schema_migrations(version,filename)
values('0020','0020_public_partner_applications_rls_hardening.sql') on conflict(version) do nothing;
