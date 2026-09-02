-- 0001: schema, extensions, enums. Safe pre-deployment migration; do not run on production without approval.
create extension if not exists pgcrypto;
create schema if not exists buzzerhood;

do $$ begin create type buzzerhood.organization_kind as enum ('client', 'partner', 'internal'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.membership_role as enum ('member', 'manager', 'owner'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.membership_status as enum ('invited', 'active', 'suspended', 'removed'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.system_role_key as enum ('super_admin', 'admin', 'internal_team'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.campaign_status as enum ('draft', 'submitted', 'in_review', 'approved', 'active', 'reporting', 'completed', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.assignment_status as enum ('proposed', 'accepted', 'declined', 'active', 'completed', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.deliverable_status as enum ('pending', 'submitted', 'revision_requested', 'approved', 'published', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.submission_status as enum ('draft', 'submitted', 'revision_requested', 'approved', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type buzzerhood.metric_type as enum ('followers', 'subscribers', 'members', 'monthly_visitors', 'views', 'reach', 'impressions', 'engagement', 'engagement_rate'); exception when duplicate_object then null; end $$;
