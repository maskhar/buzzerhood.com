# Buzzerhood Delivery Plan

## Current State

- [x] Architecture documentation and initial reviewed SQL design.
- [ ] [MVP] Confirm blocking product decisions in `docs/PRD.md`.
- [x] [MVP] Inspect self-hosted Supabase Compose and schema exposure before deployment.

## Phase 1 — Foundation

- [x] [MVP] Initialize Vite React TypeScript app, strict TypeScript, routing, TanStack Query, linting, and test baseline.
- [x] [MVP] Add environment validation with browser-safe Supabase URL and anon key only.
- [x] [MVP] Establish domain folders, shared UI primitives, error boundaries, loading states, and route guards.

## Phase 2 — Schema Foundation

- [x] [MVP] Review `database/schema.sql`, split into ordered incremental migrations, and apply first in non-production.
- [x] [MVP] Configure PostgREST to include `buzzerhood` while preserving existing exposed schemas.
- [x] [MVP] Verify grants, RLS, profile trigger, and role-based RLS foundation tests. Storage policies and audit engine remain future work.

## Phase 3 — Public Website Migration

- [x] [MVP] Migrate public visual parity: hero, team, network composition, services, packages, CTA, contact, footer.
- [x] [MVP] Import `NETWORK_DATA` as reviewed seed/import input; preserve values and mark anomalies.
- [x] [MVP] Build network preview search, tier/platform filters, 60-row cap, reduced-motion, and responsive parity.

## Phase 4 — Authentication and RBAC

- [ ] [MVP] Integrate Supabase Auth sign-in, invite acceptance, session refresh, and profile bootstrap. (Phase 1 only adds session listener and email/password login foundation; invite/profile work remains pending.)
- [ ] [MVP] Build organization selection, membership administration, and scoped CLIENT/PARTNER/INTERNAL/ADMIN access. (Phase 1 route shells require session only; RBAC remains pending.)

## Phase 5 — Partner Network

- [ ] [MVP] Build internal partner CRUD, platform accounts, audience metrics, verification, availability, and private rates.
- [ ] [MVP] Build restricted partner profile and account management workspace.

## Phase 6 — Campaign Workflow

- [ ] [MVP] Build client brief intake and internal review workflow.
- [ ] [MVP] Build partner selection, assignment, acceptance/decline, deliverables, content versions, revision, approval, publication, and completion.
- [ ] [MVP] Add private storage upload/signing flow and event audit trail.

## Phase 7 — Metrics and Reporting

- [ ] [MVP] Capture verified/self-reported publication metrics with period and source.
- [ ] [MVP] Generate campaign reports, exports, and client-facing summaries.

## Phase 8 — Commercial

- [ ] [MVP] Add quotations, approval, invoices, payment state, partner payouts, and audit events.
- [ ] [POST-MVP] Add payment gateway integration and automated reconciliation.

## Phase 9 — Reliability and Production

- [ ] [MVP] Add unit, integration, RLS, accessibility, and critical workflow tests.
- [ ] [MVP] Deploy using targeted self-hosted service steps; verify Auth, Storage, PostgREST, RLS, endpoint health, and logs.
- [ ] [POST-MVP] Notifications, advanced analytics, recommendation scoring, automations, and social integrations.


## Phase 2A — Pre-Deployment Identity and Security

- [x] [MVP] Create ordered local Buzzerhood migration structure for schema, identity, RBAC, organizations, partner foundation, RLS, deterministic reference seeds, and migration state tracking.
- [x] [MVP] Prepare `auth.users` → `buzzerhood.profiles` idempotent bootstrap trigger and safe `updated_at` trigger.
- [x] [MVP] Prepare system RBAC, organization membership lifecycle, scoped RLS helpers, grants, and RLS security test plan.
- [x] [MVP] Add frontend profile, organization membership, workspace authorization, access-denied, neutral post-login, and cache-clearing logout foundations.
- [x] [MVP] Complete read-only self-hosted Supabase/PostgREST preflight and deployment runbook.
- [x] [MVP] Production/self-hosted migration approval and controlled Phase 2B foundation deployment.
- [x] [MVP] Apply migrations in disposable test and production, run RLS foundation tests, and generate TypeScript database types.



## Phase 2B — Controlled Database Activation

- [x] [MVP] Create and validate timestamped pre-deployment PostgreSQL backup outside repository.
- [x] [MVP] Deploy Buzzerhood migrations `0001`–`0006` with `buzzerhood.schema_migrations` tracking.
- [x] [MVP] Expose `buzzerhood` through PostgREST by append-only `PGRST_DB_SCHEMAS` change and targeted `rest` reload.
- [x] [MVP] Verify production schema, grants, RLS, RBAC seeds, profile trigger, tenant isolation transaction, and service health.
- [x] [MVP] Generate and integrate live `buzzerhood` TypeScript database types.
- [ ] [MVP] Perform authenticated end-to-end login/workspace smoke test using approved existing test account.

## Phase 3 update — 2026-09-02
- Completed: secure client organization RPC, partner member/claim tables, relational platform/metric/RLS foundation, public network projection, legacy 124-record import.
- Pending: client organization UI, partner onboarding UI, admin claim-review UI, regenerated complete database TypeScript types, approved real-auth smoke test.

