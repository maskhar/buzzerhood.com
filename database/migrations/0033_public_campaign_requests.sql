-- 0033: Public campaign request inbox.
create table if not exists buzzerhood.public_campaign_requests (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 3 and 254),
  whatsapp text not null check (char_length(trim(whatsapp)) between 7 and 40),
  organization_name text not null check (char_length(trim(organization_name)) between 2 and 160),
  need_type text not null check (need_type in ('brand_awareness','creator_activation','community_amplification','buzzer_network','other')),
  platform_target text not null check (char_length(trim(platform_target)) between 2 and 500),
  brief text not null check (char_length(trim(brief)) between 10 and 5000),
  source_path text not null check (source_path in ('/campaign-request','/partner/register-info')),
  status text not null default 'new' check (status in ('new','in_review','rejected','archived','converted')),
  status_token_hash text not null unique,
  review_note text null check (review_note is null or char_length(review_note) <= 2000),
  reviewed_by uuid null references buzzerhood.profiles(id),
  reviewed_at timestamptz null,
  converted_campaign_id uuid null references buzzerhood.campaigns(id),
  ip_hash text null,
  user_agent_hash text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  archived_by uuid null
);
create index if not exists public_campaign_requests_status_created_idx on buzzerhood.public_campaign_requests(status, created_at desc);
create index if not exists public_campaign_requests_email_idx on buzzerhood.public_campaign_requests(email);
alter table buzzerhood.public_campaign_requests enable row level security;
alter table buzzerhood.public_campaign_requests force row level security;
create policy public_campaign_requests_app_read on buzzerhood.public_campaign_requests for select to buzzerhood_app using (buzzerhood.has_permission('campaigns.manage'));
create policy public_campaign_requests_app_insert on buzzerhood.public_campaign_requests for insert to buzzerhood_app with check (true);
create policy public_campaign_requests_app_update on buzzerhood.public_campaign_requests for update to buzzerhood_app using (buzzerhood.has_permission('campaigns.manage')) with check (buzzerhood.has_permission('campaigns.manage'));
revoke all on table buzzerhood.public_campaign_requests from public, anon, authenticated;
grant select, insert, update on buzzerhood.public_campaign_requests to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0033','0033_public_campaign_requests.sql') on conflict(version) do nothing;
