-- 0003: partner foundation tables needed for future authorization paths. No partner data import here.
create table if not exists buzzerhood.partners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid unique references buzzerhood.organizations(id),
  display_name text not null,
  partner_type text,
  tier text,
  category text,
  niche text,
  verification_status text not null default 'pending',
  is_public boolean not null default false,
  source_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists buzzerhood.partner_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references buzzerhood.partners(id) on delete cascade,
  platform text not null,
  handle text,
  profile_url text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(partner_id, platform, handle)
);

create table if not exists buzzerhood.partner_audience_metrics (
  id uuid primary key default gen_random_uuid(),
  platform_account_id uuid not null references buzzerhood.partner_platform_accounts(id) on delete cascade,
  metric_type buzzerhood.metric_type not null,
  metric_value numeric(18,4) not null check(metric_value >= 0),
  period_start date,
  period_end date,
  observed_at timestamptz not null default now(),
  metric_source text not null,
  raw_value jsonb
);

create table if not exists buzzerhood.partner_rates (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references buzzerhood.partners(id) on delete cascade,
  service_type text not null,
  amount numeric(14,2) not null check(amount >= 0),
  currency char(3) not null default 'IDR',
  effective_from date not null default current_date,
  effective_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists partners_organization_idx on buzzerhood.partners(organization_id);
create index if not exists partners_public_idx on buzzerhood.partners(is_public) where is_public is true;
create index if not exists partner_accounts_partner_idx on buzzerhood.partner_platform_accounts(partner_id);
create index if not exists partner_metrics_account_observed_idx on buzzerhood.partner_audience_metrics(platform_account_id, observed_at desc);
create index if not exists partner_rates_partner_active_idx on buzzerhood.partner_rates(partner_id) where is_active is true;
