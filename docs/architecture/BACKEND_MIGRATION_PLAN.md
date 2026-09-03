# Backend Migration Plan

## B1 production result (2026-09-02)

The repeated precheck remained Scenario A. A validated custom-format backup
preceded additive `0014_custom_identity.sql`, `0015_backend_auth_context.sql`,
and `0016_backend_identity_security.sql`. Shared Auth stayed 181;
partners/imports stayed 124; campaigns stayed zero. Cluster role creation is the
separate reviewed `database/operations/create_buzzerhood_app_role.sql`, never an
application migration or runtime startup action.

## Principles

- B0 is documentation only. No backend, migration, production identity, service, proxy, DNS, or configuration change is authorized.
- Preserve PostgreSQL schema `buzzerhood`, all data, deployed migration history `0001`-`0017`, RLS, constraints, views, functions, and histories unless a reviewed additive migration replaces a specific dependency.
- Continue migration numbering at `0018+`; never edit a deployed migration.
- Migrate vertical slices through a single frontend API abstraction. Do not switch every feature at once.
- Keep the shared Supabase stack healthy for unrelated workloads. B5 retires Buzzerhood dependency, not shared services.

## B0 — Architecture and audit

**Scope:** inventory repository and production aggregates; settle identity, tokens, authorization, RLS context, API, deployment, security, tests, and deprecation order.

**Database changes:** none.

**Application changes:** none; documentation, `TODO.md`, and durable agent instructions only.

**Deployment:** none.

**Verification:** required docs exist; dependency/RPC/`auth.uid()` inventories trace to code; `AGENTS.md` and `AGENT.md` match; diff contains no functional code or migrations; zero production mutation.

**Rollback:** revert documentation changes only.

**Exit criteria:** every B0 checklist item is decided; only provider/product details that do not block B1 remain deferred.

## B1 — Backend foundation and auth

**Scope:** create `backend/`; NestJS/Fastify configuration, health/readiness, Pino request logging, Kysely/pg, OpenAPI, custom users, Argon2id, JWT verification/signing, rotating refresh sessions, login/logout/logout-all/me, auth throttling, transaction-local DB context, RBAC loading, mail port.

**Database changes:** additive `0014+` custom identity/session/reset/verification structures, `profiles.user_id` transition, app/migration roles, `current_user_id()` and compatibility context. Repeat linked-identity aggregate preflight first. Do not copy unrelated `auth.users`; preserve UUID for any linked profile.

**Application changes:** backend only. Frontend stays on Supabase except an optional internal/non-production auth test client.

**Deployment:** independent non-production API container and database role. No production cutover until disposable integration tests pass. Production deployment, when separately approved, is dark/no browser traffic first.

**Verification:** configuration failure modes, `/health`, `/ready`, migration replay on disposable PostgreSQL, registration policy, login/invalid login, Argon2id verification/rehash, refresh rotation/replay/family revoke, logout/all, status revocation, RBAC load, context leakage pool test, OpenAPI and redaction checks.

**Rollback:** stop/remove only Buzzerhood API deployment; leave additive tables/context unused. Retain mapping and data. Frontend remains unchanged.

**Exit criteria:** independently deployed API is healthy; auth/security/API tests pass; runtime DB role is least privilege; identity migration reconciliation is exact; no production user is lost; no browser dependency changed.

## B2 — Organizations and Partner APIs

**Scope:** `/me/workspaces`, organization list/detail/member reads and allowed mutations, public network, partner application/claim/profile/platform/metric/rate endpoints, admin partner review.

**Database changes:** only additive/adaptive `0014+` changes needed to make `0007`-`0011` helpers/functions consume backend context. Preserve partner data and the 124-row import. No table rebuild.

**Application changes:** backend services and DTOs; frontend legacy calls remain. Build contract/parity tests and optionally a non-production feature flag at the data-function boundary.

**Deployment:** release API modules independently; do not proxy browser traffic to them by default until authorized.

**Verification:** compare public network shape/counts, organization workspace resolution, partner ownership, claim conflict locking, review histories, rate privacy, explicit-field updates, cross-org/cross-partner denial, legacy PostgREST health.

**Rollback:** route/flag the slice back to legacy frontend functions; keep additive data compatible and do not undo accepted business changes.

**Exit criteria:** endpoint parity and negative security tests pass; no raw database DTO leakage; all partner RPC dispositions are implemented through business endpoints; legacy path remains a tested fallback.

## B3 — Campaign API

**Scope:** campaigns/briefs, assignments, deliverables, insert-only submissions, reviews, publications, metric snapshots, internal/admin workflow.

**Database changes:** adapt `0012` functions/helpers to backend actor context and retain `0013` privacy intent. Add constraints/indexes only from measured/tested need; no state-model rewrite.

**Application changes:** backend campaign modules and API contract. Keep frontend campaign data functions on legacy path until B4.

**Deployment:** deploy dark or internal-only first; no big-bang UI switch.

**Verification:** every legal/illegal campaign transition, concurrent content version submission, assignment ownership, client/internal review separation, publication-ready gate, metric validation, partner budget/internal-note privacy, activity/history correctness, all cross-tenant negative tests.

**Rollback:** return frontend traffic to PostgREST/RPC; backend-created records remain valid because both paths use the same schema/invariants.

**Exit criteria:** complete brief-to-metric API flow passes against disposable/staging PostgreSQL with runtime role and RLS; legacy compatibility is documented.

## B4 — Frontend API migration

**Scope:** add `src/lib/api/client.ts`, `errors.ts`, `auth.ts`; migrate auth provider, me/workspaces, public network, organizations, partners, campaigns, and admin one slice at a time. TanStack Query remains.

**Database changes:** none by default; only reviewed compatibility fixes.

**Application changes:** `VITE_API_BASE_URL`, in-memory access token, serialized refresh/retry-once behavior, credentialed cookie requests, stable API errors/request IDs. Move query keys out of the Supabase namespace. Components do not call transport directly.

**Deployment:** canary/staged frontend artifact per slice; monitor API and legacy traffic. Keep prior static artifact for immediate rollback.

**Verification:** route/workspace behavior, cache clear at logout, refresh after reload/expiry, duplicate refresh race, all UI workflows, accessibility/build/typecheck/tests, browser network proof of zero direct PostgREST for migrated slices, CORS/CSRF/error behavior.

**Rollback:** deploy previous frontend artifact or disable slice flag. Do not roll database state back.

**Exit criteria:** all browser business/auth traffic goes through `/api/v1`; no Supabase client call is needed for any Buzzerhood route; operational acceptance tests pass.

## B5 — Buzzerhood Supabase dependency retirement

**Scope:** remove frontend Supabase package/imports/types/env, Buzzerhood GoTrue profile trigger/FK compatibility, obsolete `auth.uid()` policy/function dependence, and direct PostgREST grants/routes only where safe for Buzzerhood.

**Database changes:** additive/finalizing migration after backup and rollback window; preserve IDs/history/mappings. Remove obsolete Buzzerhood dependencies only after proving no callers. Do not delete `auth.users`, system schemas, or shared services.

**Application changes:** delete legacy Buzzerhood client/data paths; API is sole browser backend.

**Deployment:** staged API/frontend first, then narrowly scoped database grant/function cleanup. No global Supabase shutdown.

**Verification:** repository search has no runtime Supabase import/config; browser trace has no GoTrue/PostgREST calls; DB function/policy inventory has no Buzzerhood `auth.uid()` dependency; Auth/Storage/PostgREST remain healthy for other workloads.

**Rollback:** restore prior frontend/API artifact and compatibility definitions from a reviewed forward migration; mappings and old Auth rows remain during the rollback retention window.

**Exit criteria:** Buzzerhood is fully independent of Supabase application APIs; shared Supabase workloads are unchanged and healthy.

## B6 — Post-MVP domains

**Scope:** reporting, billing, notifications, transactional email provider, object storage, observability improvements, and approved integrations.

**Database changes:** incremental domain migrations only.

**Application changes:** new modules behind the same security/DTO/transaction conventions; no premature queues or microservices.

**Deployment:** capability-specific, independently reversible releases.

**Verification:** domain, security, audit, financial/privacy, and recovery tests appropriate to each capability.

**Rollback:** forward-compatible schema and artifact rollback; financial/audit records are never destructively removed.

**Exit criteria:** defined per approved product scope; B6 is not required for B1 readiness.

## Conceptual migration sequence

Names are planning labels, not files to create in B0:

1. `0014_custom_identity.sql` — users, refresh sessions, verification/reset artifacts, profile link, mapping support.
2. `0015_backend_auth_context.sql` — current user helper and least-privilege context plumbing.
3. `0016_backend_rls_transition.sql` — compatibility helper/policy/function adaptations.

Implemented filenames are `0014_custom_identity.sql`, `0015_backend_auth_context.sql`, `0016_backend_identity_security.sql`, and `0017_backend_organization_partner_api.sql`. Migration `0017` is the B2 additive grant/policy/function/index migration; it was validated from fresh and from `0016`, backed up, and applied to production on 2026-09-02. B3 must continue at `0018+` and must not edit `0001`-`0017`.

Exact contents and whether later work needs more migrations are decided through B1 review. One ordered registry remains authoritative.

## Cutover controls

- Backup/recovery confirmation before identity or RLS production changes.
- Reconcile counts and every linked UUID before/after identity migration.
- Dark deployment, health/readiness, then narrow traffic.
- Per-slice dashboards/log review and browser endpoint tracing.
- Defined rollback artifact and compatibility window before each cutover.
- No destructive rollback or production-first test.
