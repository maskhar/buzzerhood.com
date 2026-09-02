-- 0008: secure public network projection. Raw partner tables retain private operational fields.
create unique index if not exists partners_legacy_html_source_row_idx
  on buzzerhood.partners ((source_data->>'source'), (source_data->>'source_row'))
  where source_data->>'source' = 'legacy_html';

revoke select on buzzerhood.partners, buzzerhood.partner_platform_accounts, buzzerhood.partner_audience_metrics from anon;
drop policy if exists partners_public_read on buzzerhood.partners;
drop policy if exists partner_accounts_public_read on buzzerhood.partner_platform_accounts;
drop policy if exists partner_metrics_public_read on buzzerhood.partner_audience_metrics;

create or replace view buzzerhood.public_network_partners as
select
  p.id,
  p.display_name,
  p.partner_type,
  p.tier,
  p.category,
  p.niche,
  a.platform,
  a.handle,
  m.metric_type,
  m.metric_value,
  m.observed_at
from buzzerhood.partners p
join lateral (
  select account.* from buzzerhood.partner_platform_accounts account
  where account.partner_id = p.id and account.is_primary is true
  order by account.created_at asc limit 1
) a on true
left join lateral (
  select metric.* from buzzerhood.partner_audience_metrics metric
  where metric.platform_account_id = a.id
  order by metric.observed_at desc limit 1
) m on true
where p.is_public is true and p.verification_status in ('approved', 'unclaimed');

grant select on buzzerhood.public_network_partners to anon, authenticated;

insert into buzzerhood.schema_migrations (version, filename) values ('0008', '0008_public_network_projection.sql') on conflict (version) do nothing;

drop policy if exists partners_authorized_read on buzzerhood.partners;
create policy partners_owner_or_admin_read on buzzerhood.partners for select to authenticated using (
  buzzerhood.has_permission('partners.read')
  or exists (select 1 from buzzerhood.partner_members member where member.partner_id = id and member.profile_id = auth.uid())
);
