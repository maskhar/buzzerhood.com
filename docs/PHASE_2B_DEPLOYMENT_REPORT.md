# Phase 2B Deployment Report

## Deployment

- Date: 2026-09-02 UTC.
- Scope: Buzzerhood database foundation only. No legacy network import, campaign workflow, billing, or dashboard CRUD.
- Migrations: `0001` through `0006` applied to existing self-hosted PostgreSQL.

## Migration Test

PASS. Disposable local PostgreSQL 15 container used with minimal Supabase-compatible `auth.users`, `auth.uid()`, `anon`, `authenticated`, and `service_role` test harness. Ordered migrations executed. Seed migrations rerun without duplicate rows.

Verified: 12 Buzzerhood tables, 6 tracking rows, 6 roles, 12 permissions, 27 role-permission links, profile trigger, RLS creation.

## Production Precheck

- PostgreSQL accepted connections.
- `db`, `auth`, `rest`, `storage`, `kong`, `functions`, and `realtime` reported healthy.
- Disk before backup: 50G available, 47% used.

## Backup

- Timestamp: `2026-09-02T04:38:19Z`.
- Method: `pg_dump -Fc` from `supabase-db`, then container copy to server backup directory.
- Location: `/home/maskhar/backups/buzzerhood/pre_buzzerhood_phase2b_20260902T043819Z.dump`.
- Validation: non-zero 2.3M artifact; `pg_restore -l` completed successfully using ephemeral PostgreSQL client container.

## PostgREST

- Previous `PGRST_DB_SCHEMAS`: `public,graphql_public,carubra,carubra_db,sehatta,utero_academy,honda,soundpub,utero-artikel,whatsapp`.
- New value appends only `buzzerhood`.
- Only `rest` was recreated/reloaded. Health is `healthy`; logs confirm schema cache reload with 133 relations.
- Kong `/rest/v1/` and `/auth/v1/health` returned expected unauthenticated `401`, confirming gateway paths remain reachable without exposing an API key.

## Production Verification

- `buzzerhood` schema exists.
- 12 Buzzerhood tables; 0 Buzzerhood-named `public` tables.
- 12 tables have RLS and FORCE RLS; 13 policies exist.
- RBAC: 6 roles, 12 permissions, 27 role-permission links, 0 assigned `user_roles`.
- Profile bootstrap trigger exists.
- `buzzerhood.schema_migrations` tracks six deployed migrations.

## RLS / Tenant Isolation

Rollback-only production transaction used synthetic UUIDs and `.invalid` email addresses. No test records persisted.

- Auth profile bootstrap created current-user profile within transaction.
- Active User A saw one organization.
- User A could not see Organization B.
- User A saw zero private partner rates.
- Anonymous organization query was denied at schema privilege boundary.

A preexisting `soundpub.handle_new_user` Auth trigger also runs on `auth.users`. Initial synthetic rows without required email emitted warnings from that trigger; transaction rolled back. Retest with normal email field passed. No migration conflict or persistent user resulted.

## Generated Types

`src/lib/supabase/database.types.ts` generated from live `buzzerhood` PostgreSQL columns/enums by `scripts/generate-types.cjs`. No database URL, password, or service key stored in repository.

## Application Validation

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Development root HTTP smoke test passed.
- Auth credential login not performed: no existing authorized test account was used or created.

## Rollback

No rollback performed. Temporary local test containers stopped and removed automatically.

## Remaining Risks

- First privileged user role assignment remains manual, approved operator action using `docs/ADMIN_BOOTSTRAP.md` placeholders.
- No real-user login smoke test performed.
