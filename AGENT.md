# Buzzerhood — Persistent Project Context

This file contains persistent operating instructions for coding agents working on the Buzzerhood repository.

`AGENTS.md` is the canonical agent instruction file.

If `AGENT.md` also exists, keep both files logically synchronized.

---

# Project Identity

Project:

Buzzerhood

Product positioning:

Media, Influence & Distribution Network.

Product direction:

Campaign & Distribution Operating System connecting:

- Clients / Brands
- Media
- KOLs
- Influencers
- Creators
- Communities
- Internal Buzzerhood teams.

Before making significant architectural changes, read:

- `docs/PRD.md`
- `docs/SDD.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/RLS_POLICY.md`
- `docs/SELF_HOSTED_SUPABASE.md`
- `TODO.md`

Treat those documents as the project system of record.

---

# Core Technology Stack

Frontend:

- Vite
- React
- TypeScript
- React Router
- TanStack Query

Backend:

- Supabase Self-Hosted

Database:

- PostgreSQL

Authentication:

- Supabase Auth

Storage:

- Supabase Storage

Do not migrate this project to Supabase Cloud unless explicitly instructed by the project owner.

Do not introduce a second backend stack unless the existing architecture genuinely cannot support the requirement.

---

# Supabase Hosting

This project uses SELF-HOSTED Supabase.

It does NOT use Supabase Cloud.

SSH endpoint:

`maskhar@20.20.20.173`

Preferred SSH host alias:

`maskhar@supabase-server`

Supabase Docker directory on server:

`~/docker/supabase/supabase-1.26.05/docker`

Before inspecting or changing Supabase services:

1. SSH into the server.
2. Change to the Supabase Docker directory.
3. Inspect current Docker Compose configuration.
4. Inspect current service status.
5. Understand existing volume mappings and environment configuration.
6. Make the smallest necessary change.

Never assume the server configuration matches a default Supabase installation.

---

# Production Safety

The self-hosted Supabase instance may contain other production workloads.

Do not:

- reset Supabase
- delete Docker volumes
- run destructive Docker cleanup
- delete database schemas
- recreate the complete Supabase stack
- overwrite `.env`
- overwrite existing Compose files
- run `docker system prune`
- drop production databases
- drop `public`
- modify unrelated projects.

Any destructive operation requires explicit human approval.

Prefer targeted changes.

---

# Database Application Schema

All Buzzerhood application/business database objects must use PostgreSQL schema:

`buzzerhood`

Examples:

`buzzerhood.profiles`

`buzzerhood.organizations`

`buzzerhood.partners`

`buzzerhood.campaigns`

`buzzerhood.campaign_partner_assignments`

Do not create Buzzerhood business tables in `public`.

When creating the initial database structure, use:

`CREATE SCHEMA IF NOT EXISTS buzzerhood;`

Do not drop or recreate the schema as part of normal migrations.

---

# Supabase System Schemas

Supabase Auth remains in:

`auth`

Supabase Storage remains in:

`storage`

Do not move Supabase system tables into `buzzerhood`.

Application user/profile data belongs in:

`buzzerhood.profiles`

and should reference:

`auth.users.id`.

Do not duplicate authentication credentials inside application tables.

---

# Schema Qualification

Prefer explicit schema-qualified SQL:

`buzzerhood.campaigns`

instead of:

`campaigns`.

Database migrations, SQL functions, triggers, policies, and server-side queries should avoid unsafe reliance on implicit `search_path`.

Application code querying Supabase should explicitly use the `buzzerhood` schema where appropriate.

Conceptual JavaScript convention:

`supabase.schema('buzzerhood')`

Do not accidentally query similarly named tables in `public`.

---

# PostgREST / API Schema

Because application tables use the non-public schema:

`buzzerhood`

PostgREST must be configured to expose that schema before browser/API access can work.

Before changing PostgREST configuration:

1. Inspect the current Supabase Docker configuration.
2. Inspect current `PGRST_DB_SCHEMAS` or equivalent configuration.
3. Preserve existing exposed schemas.
4. Add `buzzerhood` without removing schemas required by existing services.
5. Verify PostgreSQL grants.
6. Verify RLS.
7. Reload only required services.
8. Verify existing APIs remain healthy.

Never replace the existing schema list blindly.

---

# Database Permissions

Do not use unrestricted grants as a replacement for RLS.

Review privileges for:

- `anon`
- `authenticated`
- `service_role`

when introducing Buzzerhood tables.

At minimum consider:

- schema USAGE
- table privileges
- sequence privileges where applicable
- function EXECUTE privileges.

All data access must still respect application authorization requirements.

---

# Row Level Security

RLS is mandatory for user-facing Buzzerhood application tables containing tenant or private information.

Never disable RLS simply to make a query work.

Access principles:

PUBLIC

only receives explicitly public information.

CLIENT

only accesses data belonging to organizations the user is authorized to access.

PARTNER

only accesses partner resources and campaign assignments the user is authorized to access.

INTERNAL TEAM

access depends on internal permissions.

ADMIN

has elevated application access.

SUPER ADMIN

has exceptional administrative access.

Never rely on hidden UI controls as authorization.

---

# Multi-Tenancy

Client resources are tenant-scoped through organizations.

A request containing an `organization_id` is not proof of authorization.

Always validate membership.

Protect against:

- IDOR
- cross-client access
- cross-partner access
- predictable ID misuse
- unauthorized file access.

Use UUIDs but remember that UUIDs are not authorization.

---

# Secrets

Never store secrets in:

- repository files
- source code
- Git history
- `AGENTS.md`
- `AGENT.md`
- documentation
- frontend code
- frontend `VITE_*` variables.

Never store:

- SSH passwords
- SSH private keys
- database passwords
- Supabase JWT secrets
- service role keys
- OAuth secrets
- SMTP credentials
- payment credentials
- social platform secrets.

Frontend `VITE_*` environment variables are browser-visible.

Only browser-safe values may be exposed there.

---

# Supabase Service Role

The Supabase service role credential is privileged.

Never expose it to:

- browser code
- Vite client bundle
- public configuration
- client-side logs.

Use privileged credentials only in trusted server-side contexts when genuinely required.

---

# Database Migrations

All production database changes must be represented as version-controlled migrations or reviewed SQL.

Migrations should:

- be incremental
- preserve existing data
- use schema-qualified object names
- avoid destructive operations
- be reviewable
- have rollback considerations
- be tested before production.

Before a destructive production migration:

ensure an appropriate backup/recovery path exists and obtain explicit approval.

Never use production as the first test environment for complex SQL.

---

# Existing Data Migration

The original `buzzerhood.html` contains embedded network data and business configuration.

When migrating that data:

preserve source values.

Do not silently invent:

- missing follower counts
- missing handles
- platform data
- rates
- verification status
- demographics.

Record ambiguous values as migration/data-quality issues.

---

# Edge Function Deployment

For every new or modified Supabase Edge Function, assume deployment is through the existing self-hosted infrastructure.

Do NOT assume:

`supabase functions deploy`

is valid for this project.

Current deployment convention:

1. Inspect the server before deployment.
2. SSH using:

`maskhar@supabase-server`

or the configured endpoint.

3. Work from:

`~/docker/supabase/supabase-1.26.05/docker`

4. Inspect Docker Compose volume mappings.

5. Confirm the function source directory.

Confirmed known directory:

`~/docker/supabase/supabase-1.26.05/docker/volumes/functions`

6. Upload only the intended function directory and required shared files using `scp`.

7. Do not overwrite unrelated functions.

8. Preserve remote configuration and secrets.

9. Reload/recreate only the required service.

10. Verify container health.

11. Verify the function endpoint.

12. Inspect logs after deployment.

---

# Edge Function Docker Service

Known Docker Compose Edge Function service:

`functions`

Before recreating it:

inspect the current Compose definition.

Do not assume environment variables from another project belong to Buzzerhood.

When environment values need to be added:

place server-side secrets only in the appropriate server environment/configuration.

Never commit them.

After a necessary configuration change, recreate only the affected service rather than the whole Supabase stack whenever possible.

---

# SSH Safety

SSH access does not imply permission to make unrestricted server changes.

Before remote changes:

- inspect
- understand
- verify target
- make a minimal change
- verify after change.

Do not modify:

- firewall
- SSH daemon
- operating system packages
- unrelated Docker services
- unrelated databases

unless explicitly requested.

---

# File Storage

Use Supabase Storage for application assets where appropriate.

Private campaign or partner documents must not use permanently public URLs.

Prefer:

- private buckets
- RLS/storage policies
- signed URLs

for sensitive content.

Do not store binary files directly in PostgreSQL application rows unless there is a specific documented reason.

---

# Frontend Architecture

Keep the frontend domain-oriented.

Preferred conceptual domains:

- auth
- organizations
- partners
- campaigns
- deliverables
- publications
- reports
- billing
- admin.

Avoid placing the whole application into a single generic `components` directory.

Keep reusable UI primitives separate from domain components.

---

# Existing Public Website

The original Buzzerhood HTML is the visual baseline for the public website.

When migrating to React:

- preserve visual identity
- preserve typography
- preserve dark/orange design language
- preserve responsive behavior
- preserve content hierarchy
- preserve important interactions.

Do not perform an unsolicited redesign during migration.

First achieve visual and functional parity.

---

# TypeScript

Use strict TypeScript.

Avoid:

`any`

unless there is a documented and temporary reason.

Prefer types derived from:

- database definitions
- schemas
- shared domain contracts.

Validate untrusted input at runtime.

TypeScript types alone are not validation.

---

# Validation

Validate:

- forms
- route parameters
- API inputs
- file metadata
- database command inputs.

Use Zod or the project-standard runtime validator where appropriate.

Never trust browser-supplied IDs or roles.

---

# Authorization

Authorization must be enforced at the data/service layer.

UI guards improve UX but are not security controls.

Sensitive operations must be protected through:

- PostgreSQL RLS
- secure database functions
- trusted server-side logic

as appropriate.

---

# Content Versioning

Campaign content submissions are versioned.

Never overwrite previous drafts when a revision is submitted.

Maintain:

- submission version
- revision request
- reviewer
- timestamp
- approval state.

---

# Metrics

Do not treat all network metrics as follower counts.

Supported concepts may include:

- followers
- subscribers
- members
- monthly visitors
- views
- reach
- impressions
- engagement
- engagement rate.

Preserve metric type and time period.

---

# Auditability

Important operational changes should be auditable.

Examples:

- campaign status
- partner assignment
- content approval
- partner verification
- quotation approval
- invoice state
- payment
- payout
- permissions.

Never place secrets or sensitive authentication material in audit logs.

---

# Git Safety

Before changing code:

inspect:

`git status`

Understand existing modifications.

Do not overwrite unrelated user changes.

Do not rewrite Git history unless explicitly asked.

Do not force push unless explicitly instructed.

Keep commits focused when commits are requested.

---

# Documentation

When an architectural decision changes:

update the relevant documentation.

Primary sources:

`docs/PRD.md`

`docs/SDD.md`

`docs/DATABASE_SCHEMA.md`

`docs/RLS_POLICY.md`

`docs/SELF_HOSTED_SUPABASE.md`

`docs/DEPLOYMENT_STRATEGY.md`

`TODO.md`.

Do not allow documentation and implementation to silently diverge.

---

# Testing

After implementation changes, run the relevant available checks.

Depending on project stage, this may include:

- TypeScript typecheck
- ESLint
- unit tests
- integration tests
- build
- database migration validation
- RLS policy tests.

Do not claim a test passed if it was not run.

Report test failures clearly.

---

# Production Verification

For production/server changes verify:

- targeted service is healthy
- unrelated Supabase services remain healthy
- database connection works
- Auth remains functional
- Storage remains functional where applicable
- PostgREST remains functional
- new Buzzerhood schema access works
- RLS behaves as expected
- logs contain no new critical errors.

---

# Implementation Priority

Prioritize the end-to-end MVP workflow:

Client brief

→ Internal review

→ Partner assignment

→ Partner acceptance

→ Content submission

→ Review / revision

→ Approval

→ Publication

→ Metrics

→ Report

→ Campaign completion.

Avoid building advanced features before the operational workflow works reliably.

---

# Avoid Overengineering

Do not introduce without demonstrated need:

- microservices
- Kubernetes
- Kafka
- Redis
- background queues
- event sourcing
- complex CQRS
- additional backend framework
- unnecessary abstraction layers.

The preferred architecture is:

Vite React Application

+

Self-Hosted Supabase

+

PostgreSQL `buzzerhood` schema.

---

# Agent Workflow

Before implementing a significant task:

1. Read this file.
2. Read relevant project docs.
3. Inspect existing implementation.
4. Check `TODO.md`.
5. Identify affected domains.
6. Identify authorization impact.
7. Identify database impact.
8. Identify migration impact.
9. Implement the smallest complete solution.
10. Run relevant validation.
11. Update docs/TODO if necessary.
12. Summarize changed files and verification performed.

---

# Stop and Ask Before

Do not proceed without explicit approval for:

- destructive production database changes
- deleting production data
- replacing the Supabase deployment
- changing production SSH configuration
- changing firewall configuration
- rotating production secrets
- deleting Docker volumes
- mass partner data deletion
- breaking database schema changes without migration path.

---

# Final Principle

Preserve data.

Preserve tenant isolation.

Preserve security.

Preserve existing production infrastructure.

Prefer explicit, reversible, documented changes over clever shortcuts.