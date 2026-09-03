# Buzzerhood Platform

## Backend Phase B1

The production-capable API foundation lives in `backend/`: NestJS 11 on Fastify,
Kysely/pg, strict Zod configuration, Ed25519 access JWTs, Argon2id credentials,
rotating hashed refresh sessions, existing-table RBAC, and transaction-local
PostgreSQL identity context. API routes use `/api/v1`; `/health` and `/ready` are
outside the prefix. Production registration and Swagger are closed.

The API is dark-deployed independently at `/home/maskhar/docker/buzzerhood-api`
and listens only on server localhost port 3100. The React application remains on
its transitional Supabase path until B4.

Buzzerhood is a **Media, Influence & Distribution Network** evolving into a Campaign & Distribution Operating System.

## Architecture status

Target:

```text
Vite React -> Buzzerhood Backend API -> PostgreSQL schema buzzerhood
```

The Backend (NestJS + TypeScript + Fastify + Kysely/pg) is planned for Phase B1 and is not implemented yet. The current React application still uses the self-hosted Supabase client for Auth, PostgREST, and RPC during the controlled B1-B4 transition. B0 removes nothing.

Read `docs/BACKEND_ARCHITECTURE.md`, `docs/BACKEND_MIGRATION_PLAN.md`, and `docs/SUPABASE_DEPENDENCY_AUDIT.md` before backend work.

## Current frontend stack

- Vite + React + TypeScript
- React Router + TanStack Query
- React Hook Form + Zod
- Transitional self-hosted Supabase client

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

During transition, browser `.env` uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The target browser setting is `VITE_API_BASE_URL`. Never expose a service role, database password/URL, JWT signing key, refresh secret, or SSH credential in `VITE_*` or frontend code.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Database and identity

- Business data source: PostgreSQL schema `buzzerhood`.
- Authoritative ordered migrations: `database/migrations/0001` through `0017`; future migrations continue at `0018+`.
- Historical baseline only: `database/schema.sql`; never deploy it as a lifecycle script.
- Transitional identity: shared `auth.users` with `buzzerhood.profiles` bootstrap.
- Target identity: `buzzerhood.users` behind the Buzzerhood API, with UUID-preserving profile migration if linked users exist at cutover.
- Production includes the 124-row legacy network import, Campaign Engine schema, custom Backend identity, and B2 Organization/Partner API grants and policies.

## Current application capabilities

- Public site visual/content parity and searchable/filterable public partner network.
- Client organization creation and organization workspace foundations.
- Partner application, claim, profile, platform, metric, and private-rate workflows.
- Admin partner application/claim review.
- Campaign schema/RPC/projection foundations for campaigns, assignments, deliverables, content versions/reviews, publications, metrics, and workflow history.

Current partner/admin browser screens call RLS-protected Buzzerhood tables and guarded RPCs without a service-role key. These calls are transitional and will be replaced by resource-oriented API endpoints.

Backend B2 is dark-deployed as `buzzerhood-api:b2` on `127.0.0.1:3100`. Its business endpoints cover workspace resolution, organizations, the restricted public Network, Partner applications/claims, private Partner profiles/platforms/metrics/rates, and permission-checked admin review. Campaign HTTP APIs remain B3 scope; the React frontend remains on its transitional Supabase path until B4.

## Type generation

`src/lib/supabase/database.types.ts` remains a transitional frontend database interface. Backend-only Kysely types are generated from the migrated schema; frontend contracts must use API DTO/Zod/OpenAPI types rather than raw database rows after B4 cutover.

## Self-hosted safety

The Supabase stack is shared. Read `docs/SUPABASE_PREFLIGHT.md`, `docs/DATABASE_DEPLOYMENT_RUNBOOK.md`, and `docs/SELF_HOSTED_SUPABASE.md` before any server or database action. Never reset the stack, delete volumes/data, overwrite Compose/`.env`, or stop shared services as part of Buzzerhood decoupling.

## Documentation

- Product/current system: `docs/PRD.md`, `docs/MVP_SCOPE.md`, `docs/SDD.md`, `docs/DATABASE_SCHEMA.md`, `docs/ERD.md`.
- B0 target: `docs/BACKEND_ARCHITECTURE.md`, `docs/AUTH_ARCHITECTURE.md`, `docs/API_V1_CONTRACT.md`, `docs/DATABASE_AUTH_CONTEXT.md`.
- Migration/retirement: `docs/BACKEND_MIGRATION_PLAN.md`, `docs/SUPABASE_DEPENDENCY_AUDIT.md`, `docs/SUPABASE_DEPRECATION_MATRIX.md`.
- Operations/security/tests: `docs/BACKEND_DEPLOYMENT_PLAN.md`, `docs/BACKEND_SECURITY_MODEL.md`, `docs/BACKEND_TEST_STRATEGY.md`.

## Legacy reference

`buzzerhood.html` remains the public visual/data reference. Source migration preserves original network values and data-quality issues; it does not invent handles, metrics, rates, verification, or demographics.
