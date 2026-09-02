# Database Deployment Runbook

Do not execute this runbook without explicit Phase 2B approval.

## 1. Pre-Check

- SSH to `maskhar@20.20.20.173` and enter `/home/maskhar/docker/supabase/supabase-1.26.05/docker`.
- Verify `docker compose ps` health for `db`, `auth`, `rest`, `storage`, `functions`, `kong`.
- Confirm exact `PGRST_DB_SCHEMAS` value and current exposed schemas.
- Confirm migration files in `database/migrations/` match reviewed commit/artifact.

## 2. Backup / Recovery Check

- Confirm PostgreSQL backup method and restore path before SQL execution.
- Confirm rollback plan for PostgREST configuration.
- Do not proceed if backup/recovery is unknown.

## 3. PostgREST Schema Config If Required

- Preserve existing value: `public,graphql_public,carubra,carubra_db,sehatta,utero_academy,honda,soundpub,utero-artikel,whatsapp`.
- Append `buzzerhood`; do not replace existing schemas.
- Target: `public,graphql_public,carubra,carubra_db,sehatta,utero_academy,honda,soundpub,utero-artikel,whatsapp,buzzerhood`.
- Reload/recreate only affected `rest` service after approval.

## 4. Apply Migrations

- Apply ordered files from `database/migrations/` exactly once, in lexical order.
- Recommended migration tracking: use Supabase-compatible `supabase_migrations.schema_migrations` if Supabase CLI-compatible metadata is already present; otherwise create a small Buzzerhood-owned tracking table in `buzzerhood` during approved deployment.
- Do not use Docker init scripts for live incremental migrations.

## 5. Verify Tables

- Verify `buzzerhood` schema exists.
- Verify identity, RBAC, organization, partner foundation tables exist.
- Verify no Buzzerhood business table exists in `public`.

## 6. Verify Grants

- Verify `authenticated` has schema usage and scoped table/function privileges.
- Verify `anon` only has public-preview-safe partner read grants.
- Verify privileged mutation still relies on RLS and future controlled admin flows.

## 7. Verify RLS

- Verify RLS and FORCE RLS on private/foundation tables.
- Run `database/tests/rls_foundation_tests.sql` only against disposable or prepared test database/users.
- Confirm anonymous/private organization denial and active membership access.

## 8. Verify Auth Profile Bootstrap

- Create disposable test Auth user in non-production.
- Confirm trigger creates exactly one `buzzerhood.profiles` row.
- Confirm profile update cannot alter role/membership records.

## 9. Verify Organization Isolation

- Test User A and User B in separate organizations.
- Confirm cross-organization reads fail.
- Confirm suspended/removed memberships deny access.

## 10. Generate Database Types

- Use non-Vite local tool secret such as `SUPABASE_DB_URL` outside source control.
- Generate TypeScript schema types into `src/lib/supabase/database.types.ts` after deployment verification.
- Do not commit database passwords or connection strings.

## 11. Application Smoke Test

- Set browser-safe `.env` values only.
- Run `npm run typecheck`, `npm run lint`, `npm run build`.
- Verify login, `/workspace`, `/client`, `/partner`, `/admin` denial/allow behavior.

## 12. Rollback / Incident Procedure

- Prefer forward fix for additive migrations.
- Roll back PostgREST schema exposure by restoring prior `PGRST_DB_SCHEMAS` only if needed.
- Do not drop schema/tables or delete volumes without explicit incident approval and recovery path.
