# Buzzerhood Delivery Plan

## Architecture status

The target application architecture is now React -> Buzzerhood Backend API -> PostgreSQL schema `buzzerhood`.

**Supabase architecture is DEPRECATED FOR BUZZERHOOD APPLICATION ACCESS, but remains active during transition and must not be removed or disabled.** The self-hosted stack is shared with unrelated workloads. PostgreSQL and all existing Buzzerhood data/migrations remain.

Phase B3 is deployed dark and healthy. No frontend/API cutover is part of B3.

## Completed foundation retained

- [x] Vite React TypeScript app, routing, TanStack Query, validation, lint/build/test foundations, domain folders, guards, loading/error states.
- [x] Public website visual/content parity and 124-record legacy network import with preserved source data and metric types.
- [x] Ordered production migrations `0001`-`0013`, Buzzerhood-owned migration registry, schema exposure, generated Supabase-era types, and targeted deployment history.
- [x] Identity/profile foundation, system RBAC, organizations/memberships, partner applications/claims/memberships/platforms/metrics/rates, public network projection.
- [x] Campaigns, briefs, assignments, deliverables, insert-only content versions, reviews, publications, metric snapshots, workflow/history, and safe client/partner/internal projections.
- [x] Phase 3C partner/client/admin UI and Vitest foundations.
- [x] Record the Phase 3D disposable GoTrue/PostgREST incompatibility; custom Auth supersedes that acceptance-test dependency.

## Phase B0 — Architecture audit and migration blueprint

- [x] Audit direct/indirect Supabase Auth, PostgREST read/write, RPC, type, environment, Storage, Realtime, Edge Function, and infrastructure dependencies.
- [x] Map authoritative `auth.uid()` occurrences and database transition impact.
- [x] Decide NestJS + Fastify + Kysely/pg + Zod backend architecture and initial `/backend` layout without moving the frontend.
- [x] Design `buzzerhood.users`, profile separation, UUID-preserving migration fallback, Argon2id, access JWT, rotating/revocable refresh sessions, activation/reset, and admin bootstrap boundary.
- [x] Design server-side RBAC, organization/partner authorization, transaction-local DB context, application/migration roles, and RLS defense-in-depth.
- [x] Define API v1, frontend strangler migration, Supabase deprecation order, deployment/security/test strategies, rollback and exit criteria.
- [x] Update `AGENTS.md`, synchronized `AGENT.md`, and this roadmap.
- [x] Confirm zero production mutation for B0.

## Backend B1 — Foundation and Auth

- [x] Create `/backend` with NestJS, Fastify, strict TypeScript, configuration validation, request IDs/redaction, OpenAPI, Dockerfile, and unit/integration/API test harness.
- [x] Add Kysely/pg with bounded pool, backend-only DB types, health/readiness, graceful shutdown, and separate migration execution.
- [x] Re-run production aggregate identity preflight immediately before migration; Scenario A remained valid.
- [x] Deploy reviewed additive `0014`–`0016` migrations for custom users, refresh sessions, profiles and backend identity security.
- [x] Create least-privilege `buzzerhood_app`; existing controlled PostgreSQL operator remains the separate migration principal. Runtime has no owner/superuser/BYPASSRLS access.
- [x] Add `buzzerhood.current_user_id()` and transaction-local `app.user_id`; pass alternating-user one-connection pool isolation.
- [x] Implement Argon2id registration policy, login, 10-minute EdDSA JWT, rotation/replay revocation, logout/logout-all, `/auth/me`, status/password token boundary, throttling and audit events.
- [x] Keep provider-neutral verification/reset and safe operator-only first-admin design documented; no hardcoded admin or premature public endpoint.
- [x] Pass disposable validation and dark-deploy independently; frontend remains on legacy Supabase path.

## Backend B2 — Organizations and Partners

- [x] Implement `/me/workspaces`, organizations, member reads, public network, partner applications/claims/profile/platforms/metrics/rates, and admin review APIs.
- [x] Adapt `0007`-`0011` invariants to Backend actor context in `0017`; retain claim locking, histories, and 124 imported partners.
- [x] Enforce explicit DTOs, protected-field allowlists, `partners.manage`, active organization/partner membership, and rate/claim/privacy boundaries.
- [x] Pass fresh/0016-upgrade, cross-tenant, cross-partner, conflict, pool-context, runtime-role RLS, B1 Auth regression, production migration, dark-deploy, and smoke gates.

## Backend B3 — Campaign API

- [x] Expose campaigns/briefs, transitions, assignments/responses, deliverables, submissions/reviews, publications/verification, and metric snapshots through `/api/v1`.
- [x] Preserve and harden `0012` state machines, locks, immutable content versions/snapshots, activity/history, and privacy through additive migration `0018`.
- [x] Prove Client A/Client B and Partner A/Partner B isolation, Partner budget/internal-note privacy, no self-approval/verification, and the full brief-to-metric workflow in disposable integration tests.
- [x] Dark-deploy `buzzerhood-api:b3` and migration `0018` after a validated production backup, with all shared Supabase services and baseline counts preserved.
- [x] Keep Campaign UI on legacy data functions until B4 cutover criteria pass.

## Frontend API Migration B4

- [x] Tambah public Campaign request inbox Phase 1: migration 0033, strict submission, email/WhatsApp wajib, honeypot/throttle, opaque status token, email konfirmasi generik, Admin inbox API, dan frontend submission.

- [x] Implement and locally validate first public-registration slice: reviewed additive migration 0019, public submission with strict validation/honeypot/throttle/optional SMTP, private partner-management review queue and terminal approval/rejection audit, React registration-form transport, Super Admin review UI, status dashboard, and approval/rejection email templates. Approval does not auto-create identity, Partner, or membership. Backend migration/API deployed September 5, 2026; public frontend artifact remains on prior transport until its own release.
- [x] Add local Partner identity deduplication and reversible approved-Partner archive lifecycle.
- [x] Apply and locally validate migration `0020_public_partner_applications_rls_hardening.sql`; it removes fail-open app-role reads when `app.user_id` is absent.
- [x] Add centralized `src/lib/api/client.ts`, `errors.ts`, `auth.ts`, safe `VITE_API_BASE_URL`, normalized errors, credentialed refresh, and one-time serialized retry. Access token remains memory-only; CSRF continuity is tab-scoped.
- [x] Replace Supabase Auth provider/types for Login and protected routing with Backend Auth, memory-only access token, rotating refresh cookie, session restore, and full query-cache clearing on logout.
- [x] Migrate `me/workspaces`, workspace guards, workspace selection, and initial Client/Partner/Admin dashboards to Backend API DTOs. Keep non-migrated operation routes as explicit placeholders.
- [x] Migrate authentication, me/workspaces, profile, Client organization membership, Partner onboarding, Partner/Admin operations, and campaign workflow slices to Backend API DTOs.
- [x] Move active query keys into `src/lib/api/query-keys.ts` while retaining TanStack Query behavior.
- [ ] [Release gate] Validate UI parity, build/typecheck/lint/tests, CORS/CSRF, refresh races, negative authorization, migration fresh/upgrade paths, and browser network traces.
- [x] [Release gate] Confirm browser runtime has zero direct PostgREST/GoTrue business calls; retain previous frontend artifact/compatibility for rollback.
- [x] Reconcile local migration registry entries 0029-0031 with recovered source migrations; all versioned functions and grants are present.

## Supabase Retirement B5

- [x] Confirm repository and browser traces have no Buzzerhood runtime imports/calls for Supabase Auth, PostgREST, RPC, Storage, Realtime, or Edge Functions.
- [x] Remove Buzzerhood frontend `@supabase/supabase-js`, `VITE_SUPABASE_*`, client, generated Supabase types, and legacy data-layer paths.
- [ ] Through reviewed additive migrations, retire only Buzzerhood's `auth.uid()` coupling, profile trigger/FK compatibility, and obsolete grants after the rollback window.
- [ ] Preserve shared `auth.users`, GoTrue, PostgREST, Storage, Realtime, Kong, Functions, all unrelated workloads, and PostgreSQL.
- [ ] Verify shared Supabase service health and unrelated APIs after every narrowly scoped retirement change.

## Post-MVP B6

- [ ] Reporting/export and client summaries using existing campaign/publication metrics.
- [ ] Quotations, invoices, payment state, partner payouts, and financial audit controls.
- [ ] Transactional email provider, private object storage/signed access, and notifications when product scope is approved.
- [ ] Advanced observability, analytics, recommendations, automations, social/payment integrations only with demonstrated need.
- [ ] Continue avoiding premature microservices, Kubernetes, Kafka, Redis/queues, CQRS, and a second database.

## Product decisions still required

- [ ] [MVP] Decide whether every multi-user partner must have a partner organization.
- [ ] [MVP] Decide final content approval ownership by campaign (client, internal, or both).
- [ ] [MVP] Define legal invoice/payout numbering, tax, and initial currency behavior before commercial implementation.
- [ ] [B1 rollout] Decide whether registration is public, invitation-only, or policy-gated at launch and approve the password/account-activation policy.
