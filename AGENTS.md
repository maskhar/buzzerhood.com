# Buzzerhood — Persistent Project Context

`AGENTS.md` is canonical. Keep `AGENT.md` logically identical.

## Project Identity

Buzzerhood is a Media, Influence & Distribution Network connecting Clients, Brands, Media, KOLs, Influencers, Creators, Communities, and internal teams.

Primary product workflow:

Client brief → Internal review → Partner assignment → Partner acceptance → Content submission → Review/revision → Approval → Publication → Metrics → Report → Campaign completion.

Before significant architecture work, read relevant sources of truth:

- `docs/PRD.md`
- `docs/SDD.md`
- `docs/ERD.md`
- `docs/RLS_POLICY.md`
- `docs/API_V1_CONTRACT.md`
- `docs/DATABASE_AUTH_CONTEXT.md`
- `docs/SECURITY_MODEL.md`
- `TODO.md`

## Technology Stack

Frontend:

- Vite
- React
- TypeScript
- React Router
- TanStack Query

Backend:

- NestJS
- TypeScript
- Fastify
- Zod runtime validation

Database:

- PostgreSQL
- Schema `buzzerhood`
- Kysely + `pg`
- SQL migrations as schema authority

Authentication:

- Buzzerhood custom authentication
- Argon2id password hashes
- Short-lived EdDSA JWT access tokens
- Rotating and revocable refresh sessions
- HttpOnly Secure refresh cookies

## Target Architecture

Final application path:

`Browser -> Buzzerhood Backend API -> PostgreSQL schema buzzerhood`

Durable rules:

1. Browser code never accesses business tables directly.
2. Backend API is the application security boundary.
3. PostgreSQL schema `buzzerhood` is business-data source of truth.
4. New Backend code uses NestJS, TypeScript, and Fastify.
5. Database access uses Kysely and `pg`; reviewed SQL functions handle concurrency-sensitive workflow invariants.
6. SQL migrations remain authoritative and immutable after deployment.
7. Database, signing, service, and migration secrets never enter frontend code or `VITE_*` values.
8. Normal Backend traffic uses a dedicated least-privilege database role, never a superuser, table owner, or migration role.
9. Browser-supplied IDs, roles, organization IDs, and partner IDs are never authorization.
10. Preserve existing data, UUIDs, history, tenant isolation, and workflow state.
11. Avoid new backend frameworks, databases, queues, caches, or distributed infrastructure without demonstrated need and explicit approval.

## Local Backend Focus

Current owner directive, September 6, 2026:

- Work scope is local Backend, frontend integration, migrations, automated tests, and local builds.
- Do not access, inspect, query, configure, restart, or modify production services or production databases.
- Do not run remote deployment commands or copy artifacts to external machines.
- Do not perform production deployment unless owner gives a new, explicit deployment instruction for that exact release.
- Local disposable PostgreSQL containers and test databases are allowed.
- GitHub push remains allowed after successful validation.


## Local Docker Deployment

Current Buzzerhood runtime is local Docker on this computer.

Primary local Compose file:

- `docker/buzzerhood/docker-compose.yml`

Local containers:

- `buzzerhood-postgres` uses image `postgres:17-alpine`, database `buzzerhood`, internal port `5432`, data volume `.docker-data/postgres`.
- `buzzerhood-api` uses image `buzzerhood-api:b4`, exposes `127.0.0.1:3100->3100`, and depends on local Postgres health.
- `buzzerhood-web` uses image `buzzerhood-web:b4`, exposes `127.0.0.1:8080->80`.

Local networks:

- `buzzerhood-network`
- `carubra-network`

Operational rules:

- Treat this local Docker stack as the active API/WEB/Postgres deployment target for development and verification.
- Do not use `backend/deploy/compose.yaml` as the default deployment path unless owner explicitly re-approves it.
- Local Docker inspection, rebuild, restart, migration testing, and health checks are allowed when needed.
- Preserve local database data unless owner explicitly approves destructive reset or volume removal.
## Database Schema

All Buzzerhood business objects use PostgreSQL schema `buzzerhood`.

Use schema-qualified SQL:

- `buzzerhood.users`
- `buzzerhood.profiles`
- `buzzerhood.organizations`
- `buzzerhood.partners`
- `buzzerhood.campaigns`

Do not create Buzzerhood business tables in `public`.

Avoid unsafe reliance on implicit `search_path`. SQL functions should use `set search_path = ''` and explicit qualification.

Existing production migrations are immutable. Continue with the next available migration number. Migrations must be incremental, additive where practical, data-preserving, reviewable, and tested through fresh and upgrade paths.

Before destructive database work, stop and request explicit approval. Never drop schemas, databases, production data, or migration history as part of normal development.

## Identity and Authentication

- Buzzerhood identity belongs in `buzzerhood.users`.
- Business/profile identity remains in `buzzerhood.profiles`.
- Password hashes exist only in `buzzerhood.users` and use Argon2id.
- Never expose or log password hashes, refresh tokens, action tokens, signing keys, or database credentials.
- Refresh tokens rotate, are hashed at rest, and are server-revocable.
- Backend user context must be transaction-local through `withUserContext`; never leak pooled session context between requests.
- Production registration remains closed until explicitly approved.
- Never auto-create or auto-promote an Admin.

## Authorization and Multi-Tenancy

Authorization is enforced server-side at service/database boundaries.

- Organization access requires active membership or narrow effective permission.
- Partner workspace access requires active `partner_members` membership.
- Internal review commands require explicit effective permission such as `partners.manage` or `campaigns.manage`.
- Route prefixes and hidden UI controls are not authorization.
- UUIDs are identifiers, not authorization.
- Protect against IDOR, cross-client access, cross-partner access, predictable ID misuse, and unauthorized files.
- RLS remains defense-in-depth where practical.

Database functions using elevated execution context must:

1. Validate `buzzerhood.current_user_id()`.
2. Check required effective permission.
3. Use schema-qualified objects.
4. Expose only required grants.
5. Preserve transaction atomicity and auditability.

## Partner Rules

- Public Partner DTOs never expose rates, contacts, memberships, claims, evidence, reviews, provenance, user IDs, or authentication data.
- Partner rates are private to authorized Partner members and internal users with required permission.
- Pending application or claim never grants Partner access.
- Partner application and claim review requires effective `partners.manage`.
- Email and WhatsApp identity validation must be normalized and enforced by database constraints where race conditions are possible.
- Rejected or archived public applications may be resubmitted according to reviewed lifecycle rules.
- Restoring archived records must validate conflicts before activation.
- Never create duplicate user or Partner identities when an archived identity can be safely reactivated.

## Campaign Rules

- Campaign access requires active Organization membership, assigned active Partner membership, or effective internal Campaign permission.
- Only effective `campaigns.manage` may perform internal review, assignment, deliverable planning, publication verification, and administrative transitions.
- Client, Partner, and Internal DTOs remain separate.
- Partner responses never expose total Campaign budget, internal notes, rate snapshots, or other Partner assignments.
- Content submissions are immutable versions.
- Only latest submission version is reviewable.
- Internal approval precedes Client approval.
- Partner cannot self-approve content or self-verify publication.
- Publication must reference matching finally approved submission.
- Metric snapshots are append-only and preserve metric type and reporting period.

## Validation and TypeScript

Use strict TypeScript. Avoid `any` unless temporary and documented.

Validate untrusted input at runtime:

- request bodies
- query parameters
- route parameters
- forms
- file metadata
- database command inputs

Use Zod or project-standard validators. TypeScript types alone are not validation.

## Frontend Architecture

Keep frontend domain-oriented:

- auth
- organizations
- partners
- campaigns
- deliverables
- publications
- reports
- billing
- admin

Use centralized Backend HTTP client. Keep TanStack Query. Keep reusable UI primitives separate from domain components.

Preserve existing public website visual identity, typography, dark/orange language, responsive behavior, content hierarchy, and important interactions. Do not perform unsolicited redesigns.

## Secrets

Never store secrets in repository files, documentation, frontend bundles, logs, Git history, `AGENT.md`, or `AGENTS.md`.

Frontend `VITE_*` values are browser-visible and may contain browser-safe configuration only.

## Auditability

Important changes must remain auditable, including campaign state, Partner assignment, content approval, verification, quotations, invoices, payments, payouts, permissions, application review, archive, and reactivation.

Never place authentication secrets or sensitive credentials in audit logs.

## Testing

After implementation changes, run relevant available checks:

- TypeScript typecheck
- ESLint
- unit tests
- integration tests
- build
- migration fresh-path validation
- migration upgrade-path validation
- authorization and RLS tests when affected

Do not claim a check passed unless it ran successfully. Do not fix unrelated failures.

## Git Workflow

Before changes, inspect `git status`. Preserve unrelated user work. Do not rewrite history or force-push unless explicitly requested.

After each completed implementation change:

1. Run relevant validation.
2. Stage only task-related files.
3. Create a focused Git commit with an Indonesian commit message.
4. Push current branch to configured GitHub remote.
5. Report missing remote, authentication failure, push rejection, or failed validation immediately.

Do not commit secrets or failed work.

## Documentation

Update documentation when architecture, contracts, schema, authorization, lifecycle, or deployment assumptions change.

Keep implementation, `TODO.md`, API contract, security model, and database documentation synchronized.

## Agent Workflow

Before significant work:

1. Read this file.
2. Read relevant project documents.
3. Inspect existing implementation.
4. Check `TODO.md`.
5. Identify affected domains, authorization, database, and migration impact.
6. Implement smallest complete solution.
7. Validate locally.
8. Update documentation when required.
9. Commit and push focused changes.
10. Summarize changed files and verification.

## Stop and Ask Before

Do not proceed without explicit approval for:

- destructive database changes
- deleting business data
- breaking schema changes without migration path
- rotating secrets
- changing production infrastructure
- accessing or deploying to production
- mass Partner deletion
- rewriting Git history

## Final Principle

Preserve data.

Preserve tenant isolation.

Preserve security.

Prefer explicit, reversible, documented changes over clever shortcuts.

<!-- CODEGRAPH_START -->
## CodeGraph

When `.codegraph/` exists, use `codegraph_explore` before grep/find or manual file reading for code discovery and impact analysis.
<!-- CODEGRAPH_END -->
