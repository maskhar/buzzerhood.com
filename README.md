# Buzzerhood Platform

## Backend

The production-capable API foundation lives in `backend/`: NestJS 11 on Fastify,
Kysely/pg, strict Zod configuration, Ed25519 access JWTs, Argon2id credentials,
rotating hashed refresh sessions, existing-table RBAC, and transaction-local
PostgreSQL identity context. API routes use `/api/v1`; `/health` and `/ready` are
outside the prefix. Production registration and Swagger are closed.

Local Docker runs `buzzerhood-api`, `buzzerhood-web`, and `buzzerhood-postgres`. Browser traffic uses the Buzzerhood Backend API; Buzzerhood does not use Supabase at application runtime.

Buzzerhood is a **Media, Influence & Distribution Network** evolving into a Campaign & Distribution Operating System.

## Architecture status

Target:

```text
Vite React -> Buzzerhood Backend API -> PostgreSQL schema buzzerhood
```

The Backend (NestJS + TypeScript + Fastify + Kysely/pg) is implemented. The React application uses the centralized Backend API client for authentication and business data; it does not call Supabase Auth, PostgREST, or RPC.

Read `docs/BACKEND_ARCHITECTURE.md`, `docs/BACKEND_MIGRATION_PLAN.md`, and `docs/SUPABASE_DEPENDENCY_AUDIT.md` before backend work.

## Current frontend stack

- Vite + React + TypeScript
- React Router + TanStack Query
- React Hook Form + Zod
- Centralized Buzzerhood Backend API client

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Browser uses only `VITE_API_BASE_URL`; Supabase browser credentials are no longer part of frontend configuration. Never expose a service role, database password/URL, JWT signing key, refresh secret, or SSH credential in `VITE_*` or frontend code.

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
- Authoritative ordered migrations: `database/migrations/0001` through `0032`; future migrations continue from the next available version.
- Historical baseline only: `database/schema.sql`; never deploy it as a lifecycle script.
- Identity: `buzzerhood.users` behind the Buzzerhood API, with `buzzerhood.profiles` for business/profile data.
- Production includes the 124-row legacy network import, Campaign Engine schema, custom Backend identity, and B2 Organization/Partner API grants and policies.

## Current application capabilities

- Public site visual/content parity and searchable/filterable public partner network.
- Client organization creation and organization workspace foundations.
- Partner application, claim, profile, platform, metric, and private-rate workflows.
- Admin partner application/claim review.
- Campaign schema/RPC/projection foundations for campaigns, assignments, deliverables, content versions/reviews, publications, metrics, and workflow history.

Browser screens use resource-oriented Backend API DTOs. The API covers authentication, workspaces, organizations, public Network, Partner onboarding, Partner/Admin review, user administration, and campaign workflow.

## Type generation

Frontend contracts use Backend API DTO/Zod/OpenAPI types. Database types remain backend-only and are not shipped to browsers.

## Self-hosted safety

The Supabase stack is shared. Read `docs/SUPABASE_PREFLIGHT.md`, `docs/DATABASE_DEPLOYMENT_RUNBOOK.md`, and `docs/SELF_HOSTED_SUPABASE.md` before any server or database action. Never reset the stack, delete volumes/data, overwrite Compose/`.env`, or stop shared services as part of Buzzerhood decoupling.

## Documentation

- Product/current system: `docs/PRD.md`, `docs/MVP_SCOPE.md`, `docs/SDD.md`, `docs/DATABASE_SCHEMA.md`, `docs/ERD.md`.
- B0 target: `docs/BACKEND_ARCHITECTURE.md`, `docs/AUTH_ARCHITECTURE.md`, `docs/API_V1_CONTRACT.md`, `docs/DATABASE_AUTH_CONTEXT.md`.
- Migration/retirement: `docs/BACKEND_MIGRATION_PLAN.md`, `docs/SUPABASE_DEPENDENCY_AUDIT.md`, `docs/SUPABASE_DEPRECATION_MATRIX.md`.
- Operations/security/tests: `docs/BACKEND_DEPLOYMENT_PLAN.md`, `docs/BACKEND_SECURITY_MODEL.md`, `docs/BACKEND_TEST_STRATEGY.md`.

## Legacy reference

`buzzerhood.html` remains the public visual/data reference. Source migration preserves original network values and data-quality issues; it does not invent handles, metrics, rates, verification, or demographics.
