# Database Migrations

## Backend B1

Production registry now runs through `0016`. Apply migrations with the
controlled PostgreSQL operator, never `buzzerhood_app`. Create or rotate the
runtime login separately with `operations/create_buzzerhood_app_role.sql` and a
psql `app_password` variable; no credential belongs in Git. Migrations
0014–0016 pass both fresh and 0013-upgrade disposable tests.

`database/migrations/` is the authoritative ordered production history. `database/schema.sql` is a historical architecture baseline and must not be deployed as a lifecycle script. Deployed migrations are immutable; future custom-backend migrations continue at `0014+`.

## Ordered migrations

1. `0001_create_buzzerhood_schema.sql` — schema, extension, and initial enums.
2. `0002_identity_rbac_organizations.sql` — Supabase-era profile FK, RBAC, organizations, memberships.
3. `0003_partner_foundation.sql` — partner, platform account, metric, and private-rate foundation.
4. `0004_security_functions_rls.sql` — profile trigger, security helpers, grants, RLS, timestamps.
5. `0005_seed_rbac_reference.sql` — deterministic roles/permissions; no user assignment.
6. `0006_migration_tracking.sql` — `buzzerhood.schema_migrations` registry.
7. `0007_partner_identity_and_client_organizations.sql` — partner memberships/claims and organization/partner transactional RPCs.
8. `0008_public_network_projection.sql` — public safe network projection and raw-table restriction.
9. `0009_legacy_network_import.sql` — deterministic 124-row source-preserving partner import.
10. `0010_operational_partner_review.sql` — partner review history and constrained profile updates.
11. `0011_review_api_compatibility.sql` — effective partner review/rejection function definitions.
12. `0012_campaign_engine_core.sql` — campaign/assignment/deliverable/content/publication/metric state and guarded transactions.
13. `0013_campaign_safe_projections.sql` — client, partner, and internal privacy projections.

## Registry and deployment

The self-hosted instance had no compatible `supabase_migrations.schema_migrations`, so `0006` created `buzzerhood.schema_migrations`. It has no `anon`/`authenticated` grants and has forced RLS. Apply migrations in lexical order through the reviewed deployment runbook, record the exact version/filename, test first on disposable PostgreSQL, and verify backup/recovery for production changes.

Production was read-only verified during B0 as having 13 registry rows through `0013`, 124 partners, and 124 legacy import rows. No B0 database mutation occurred.

## Backend transition

Existing `0001`-`0013` SQL remains unchanged. Planned `0014+` migrations add custom Buzzerhood identity, transaction-local backend auth context, and compatible RLS/function definitions. They must preserve all data and UUID references. See `docs/DATABASE_AUTH_CONTEXT.md`, `docs/AUTH_ARCHITECTURE.md`, and `docs/BACKEND_MIGRATION_PLAN.md`.
