# Database Migrations

`database/migrations/` is the authoritative deployment sequence from Phase 2A onward. `database/schema.sql` remains architecture baseline only and must not be applied as a production lifecycle script.

## Ordered Migrations

1. `0001_create_buzzerhood_schema.sql` — extension, `buzzerhood` schema, enums.
2. `0002_identity_rbac_organizations.sql` — profiles, RBAC references, organizations, active membership lifecycle.
3. `0003_partner_foundation.sql` — partner ownership foundation, accounts, metrics, private rate records; no legacy data import.
4. `0004_security_functions_rls.sql` — profile trigger, scoped security helpers, grants, RLS, timestamps.
5. `0005_seed_rbac_reference.sql` — deterministic role/permission reference seed; no user assignment.

Do not run migrations against production until Phase 2B approval. See `docs/DATABASE_DEPLOYMENT_RUNBOOK.md`.

## Tracking Recommendation

Use Supabase migration metadata when current self-hosted deployment supports existing compatible tooling. If unavailable, add a Buzzerhood-owned tracking table in an approved migration. Do not repurpose Docker initialization mounts for live migration tracking.
# Migration State

The production self-hosted instance has no `supabase_migrations.schema_migrations` table. `0006_migration_tracking.sql` creates `buzzerhood.schema_migrations` as internal migration metadata.

This table receives no `anon` or `authenticated` grants. RLS is enabled and forced. Apply migrations in lexical order; before any future migration, inspect this table and add its exact version/filename in a reviewed tracking migration or deployment transaction.
