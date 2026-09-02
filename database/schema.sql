-- DEPRECATED ARCHITECTURE BASELINE: do not deploy this file. Use ordered database/migrations/ files from Phase 2A.
-- Kept only as historical architecture reference pending a future regenerated baseline.

-- Architecture baseline. Convert into incremental migrations before deployment.
create extension if not exists pgcrypto;
create schema if not exists buzzerhood;

create type buzzerhood.organization_kind as enum ('client', 'partner', 'internal');
create type buzzerhood.membership_role as enum ('client_member', 'client_admin', 'partner_member', 'partner_admin', 'internal_member', 'internal_manager', 'admin', 'super_admin');
create type buzzerhood.campaign_status as enum ('draft', 'submitted', 'in_review', 'approved', 'active', 'reporting', 'completed', 'cancelled');
create type buzzerhood.assignment_status as enum ('proposed', 'accepted', 'declined', 'active', 'completed', 'cancelled');
create type buzzerhood.deliverable_status as enum ('pending', 'submitted', 'revision_requested', 'approved', 'published', 'cancelled');
create type buzzerhood.submission_status as enum ('draft', 'submitted', 'revision_requested', 'approved', 'rejected');
create type buzzerhood.metric_type as enum ('followers', 'subscribers', 'members', 'monthly_visitors', 'views', 'reach', 'impressions', 'engagement', 'engagement_rate');

create table buzzerhood.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, avatar_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table buzzerhood.organizations (id uuid primary key default gen_random_uuid(), kind buzzerhood.organization_kind not null, name text not null, slug text not null unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table buzzerhood.organization_memberships (organization_id uuid not null references buzzerhood.organizations(id) on delete cascade, profile_id uuid not null references buzzerhood.profiles(id) on delete cascade, role buzzerhood.membership_role not null, created_at timestamptz not null default now(), primary key (organization_id, profile_id));
create table buzzerhood.partners (id uuid primary key default gen_random_uuid(), organization_id uuid unique references buzzerhood.organizations(id), display_name text not null, partner_type text, tier text, category text, niche text, verification_status text not null default 'pending', is_public boolean not null default false, source_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table buzzerhood.partner_platform_accounts (id uuid primary key default gen_random_uuid(), partner_id uuid not null references buzzerhood.partners(id) on delete cascade, platform text not null, handle text, profile_url text, is_primary boolean not null default false, unique(partner_id, platform, handle));
create table buzzerhood.partner_audience_metrics (id uuid primary key default gen_random_uuid(), platform_account_id uuid not null references buzzerhood.partner_platform_accounts(id) on delete cascade, metric_type buzzerhood.metric_type not null, metric_value numeric(18,4) not null check(metric_value >= 0), period_start date, period_end date, observed_at timestamptz not null default now(), metric_source text not null, raw_value jsonb);
create table buzzerhood.partner_rates (id uuid primary key default gen_random_uuid(), partner_id uuid not null references buzzerhood.partners(id) on delete cascade, service_type text not null, amount numeric(14,2) not null check(amount >= 0), currency char(3) not null default 'IDR', effective_from date not null default current_date, effective_to date, is_active boolean not null default true, created_at timestamptz not null default now());
create table buzzerhood.campaigns (id uuid primary key default gen_random_uuid(), organization_id uuid not null references buzzerhood.organizations(id), name text not null, brief jsonb not null default '{}'::jsonb, status buzzerhood.campaign_status not null default 'draft', start_date date, end_date date, budget_amount numeric(14,2), currency char(3) not null default 'IDR', created_by uuid not null references buzzerhood.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table buzzerhood.campaign_partner_assignments (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references buzzerhood.campaigns(id) on delete cascade, partner_id uuid not null references buzzerhood.partners(id), status buzzerhood.assignment_status not null default 'proposed', agreed_rate_amount numeric(14,2), currency char(3) not null default 'IDR', assigned_by uuid not null references buzzerhood.profiles(id), assigned_at timestamptz not null default now(), responded_at timestamptz, unique(campaign_id, partner_id));
create table buzzerhood.deliverables (id uuid primary key default gen_random_uuid(), assignment_id uuid not null references buzzerhood.campaign_partner_assignments(id) on delete cascade, title text not null, requirements jsonb not null default '{}'::jsonb, due_at timestamptz, status buzzerhood.deliverable_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table buzzerhood.content_submissions (id uuid primary key default gen_random_uuid(), deliverable_id uuid not null references buzzerhood.deliverables(id) on delete cascade, version_number integer not null check(version_number > 0), status buzzerhood.submission_status not null default 'draft', caption text, content_data jsonb not null default '{}'::jsonb, submitted_by uuid not null references buzzerhood.profiles(id), submitted_at timestamptz, created_at timestamptz not null default now(), unique(deliverable_id, version_number));
create table buzzerhood.content_reviews (id uuid primary key default gen_random_uuid(), submission_id uuid not null references buzzerhood.content_submissions(id) on delete cascade, decision buzzerhood.submission_status not null check(decision in ('revision_requested', 'approved', 'rejected')), feedback text, reviewed_by uuid not null references buzzerhood.profiles(id), reviewed_at timestamptz not null default now());
create table buzzerhood.publications (id uuid primary key default gen_random_uuid(), deliverable_id uuid not null references buzzerhood.deliverables(id) on delete cascade, platform_account_id uuid references buzzerhood.partner_platform_accounts(id), published_url text, published_at timestamptz, evidence jsonb not null default '{}'::jsonb, created_by uuid not null references buzzerhood.profiles(id), created_at timestamptz not null default now());
create table buzzerhood.publication_metrics (id uuid primary key default gen_random_uuid(), publication_id uuid not null references buzzerhood.publications(id) on delete cascade, metric_type buzzerhood.metric_type not null, metric_value numeric(18,4) not null check(metric_value >= 0), period_start date, period_end date, observed_at timestamptz not null default now(), metric_source text not null, raw_value jsonb);
create table buzzerhood.files (id uuid primary key default gen_random_uuid(), bucket_id text not null, object_key text not null unique, owner_profile_id uuid not null references buzzerhood.profiles(id), linked_entity_type text not null, linked_entity_id uuid not null, is_private boolean not null default true, created_at timestamptz not null default now());
create table buzzerhood.campaign_reports (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references buzzerhood.campaigns(id) on delete cascade, status text not null default 'draft', report_data jsonb not null default '{}'::jsonb, generated_by uuid not null references buzzerhood.profiles(id), created_at timestamptz not null default now());
create table buzzerhood.quotations (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references buzzerhood.campaigns(id) on delete cascade, status text not null default 'draft', amount numeric(14,2) not null check(amount >= 0), currency char(3) not null default 'IDR', created_at timestamptz not null default now());
create table buzzerhood.invoices (id uuid primary key default gen_random_uuid(), quotation_id uuid not null references buzzerhood.quotations(id), invoice_number text unique, status text not null default 'draft', amount numeric(14,2) not null check(amount >= 0), due_date date, created_at timestamptz not null default now());
create table buzzerhood.payments (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references buzzerhood.invoices(id), status text not null default 'pending', amount numeric(14,2) not null check(amount >= 0), paid_at timestamptz, reference text, created_at timestamptz not null default now());
create table buzzerhood.partner_payouts (id uuid primary key default gen_random_uuid(), assignment_id uuid not null references buzzerhood.campaign_partner_assignments(id), status text not null default 'pending', amount numeric(14,2) not null check(amount >= 0), currency char(3) not null default 'IDR', paid_at timestamptz, created_at timestamptz not null default now());
create table buzzerhood.audit_events (id uuid primary key default gen_random_uuid(), organization_id uuid references buzzerhood.organizations(id), campaign_id uuid references buzzerhood.campaigns(id), actor_profile_id uuid references buzzerhood.profiles(id), action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

create or replace function buzzerhood.is_organization_member(target_organization_id uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists (select 1 from buzzerhood.organization_memberships m where m.organization_id = target_organization_id and m.profile_id = auth.uid()) $$;
create or replace function buzzerhood.is_internal_member() returns boolean language sql stable security definer set search_path = '' as $$ select exists (select 1 from buzzerhood.organization_memberships m join buzzerhood.organizations o on o.id = m.organization_id where m.profile_id = auth.uid() and o.kind = 'internal') $$;
revoke all on function buzzerhood.is_organization_member(uuid) from public;
revoke all on function buzzerhood.is_internal_member() from public;
grant usage on schema buzzerhood to authenticated;
grant select, insert, update, delete on all tables in schema buzzerhood to authenticated;
grant execute on function buzzerhood.is_organization_member(uuid), buzzerhood.is_internal_member() to authenticated;

alter table buzzerhood.profiles enable row level security;
alter table buzzerhood.organizations enable row level security;
alter table buzzerhood.organization_memberships enable row level security;
alter table buzzerhood.partners enable row level security;
alter table buzzerhood.partner_platform_accounts enable row level security;
alter table buzzerhood.partner_audience_metrics enable row level security;
alter table buzzerhood.partner_rates enable row level security;
alter table buzzerhood.campaigns enable row level security;
alter table buzzerhood.campaign_partner_assignments enable row level security;
alter table buzzerhood.deliverables enable row level security;
alter table buzzerhood.content_submissions enable row level security;
alter table buzzerhood.content_reviews enable row level security;
alter table buzzerhood.publications enable row level security;
alter table buzzerhood.publication_metrics enable row level security;
alter table buzzerhood.files enable row level security;
alter table buzzerhood.campaign_reports enable row level security;
alter table buzzerhood.quotations enable row level security;
alter table buzzerhood.invoices enable row level security;
alter table buzzerhood.payments enable row level security;
alter table buzzerhood.partner_payouts enable row level security;
alter table buzzerhood.audit_events enable row level security;

create policy profiles_self_select on buzzerhood.profiles for select to authenticated using (id = auth.uid() or buzzerhood.is_internal_member());
create policy campaigns_scoped_select on buzzerhood.campaigns for select to authenticated using (buzzerhood.is_organization_member(organization_id) or buzzerhood.is_internal_member());
create policy campaigns_scoped_insert on buzzerhood.campaigns for insert to authenticated with check (buzzerhood.is_organization_member(organization_id) and created_by = auth.uid());
create policy campaigns_internal_update on buzzerhood.campaigns for update to authenticated using (buzzerhood.is_internal_member()) with check (buzzerhood.is_internal_member());

-- Remaining table policies must be added with parent-scope EXISTS clauses before deployment.
-- No broad permissive policy is intentionally included in this baseline.

