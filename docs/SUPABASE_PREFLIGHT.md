# Supabase Preflight

## Server

- SSH alias expected: `maskhar@supabase-server`.
- Alias result: not configured locally (`Could not resolve hostname supabase-server`).
- Direct endpoint used read-only: `maskhar@20.20.20.173`.
- Docker directory verified: `/home/maskhar/docker/supabase/supabase-1.26.05/docker`.
- Compose files present: `docker-compose.yml`, `docker-compose.caddy.yml`, `docker-compose.envoy.yml`, `docker-compose.nginx.yml`, `docker-compose.pg17.yml`, `docker-compose.rustfs.yml`, `docker-compose.s3.yml`.

## Current Services

Read-only `docker compose ps` reported healthy running services: `db`, `auth`, `studio`, `kong`, `functions`, `imgproxy`, `rest`, `meta`, `realtime`, `storage`, `supavisor`.

Relevant images observed: `supabase/postgres:15.8.1.085`, `supabase/gotrue:v2.189.0`, `postgrest/postgrest:v14.12`, `supabase/edge-runtime:v1.74.0`, `supabase/storage-api:v1.60.4`, `supabase/studio:2026.07.07-sha-a6a04f2`.

## PostgREST

Current schema configuration from `supabase-rest` environment:

```text
PGRST_DB_SCHEMAS=public,graphql_public,carubra,carubra_db,sehatta,utero_academy,honda,soundpub,utero-artikel,whatsapp
```

`buzzerhood` exposed: NO.

Future target value, preserving existing schemas:

```text
PGRST_DB_SCHEMAS=public,graphql_public,carubra,carubra_db,sehatta,utero_academy,honda,soundpub,utero-artikel,whatsapp,buzzerhood
```

Service affected: `rest`. Configuration source references `${PGRST_DB_SCHEMAS}` in `docker-compose.yml`; actual `.env` value must be updated only during approved deployment.

## Database

Database service: `db`; container: `supabase-db`; image: `supabase/postgres:15.8.1.085`. Data volume mount includes `volumes/db/data -> /var/lib/postgresql/data`. Existing init scripts mount into `/docker-entrypoint-initdb.d/*`; those are initialization references, not a safe place for live incremental production mutation without deployment procedure review.

Safe future migration approach: run reviewed files from `database/migrations/` in order against a verified non-production database first, then production only after approval and backup/recovery confirmation.

## Edge Functions

Service: `functions`; container: `supabase-edge-functions`. Source volume verified: `/home/maskhar/docker/supabase/supabase-1.26.05/docker/volumes/functions -> /home/deno/functions`.

## Required Changes

- Add `buzzerhood` to existing `PGRST_DB_SCHEMAS` value before browser/PostgREST access to application schema.
- Apply local Buzzerhood migrations after approval and backup/recovery verification.
- Generate database types after migrations exist in target database.

## No-Change Items

- Core Supabase services are running and reported healthy.
- Edge Functions service and source volume match documented service/path.
- Database service and data volume are present.

## Deployment Risks

- Supabase instance hosts many existing exposed schemas; replacing `PGRST_DB_SCHEMAS` would break other workloads.
- Production data lives in persistent volume; destructive Docker cleanup, reset, or init-script misuse could cause outage/data loss.
- PostgREST schema change likely requires targeted service reload/recreate later; not performed in Phase 2A.

## Approval Gate

Requires explicit Phase 2B approval: server `.env` edit, Docker Compose change, service reload/recreate, production SQL execution, production role assignment, storage policy change, and type generation against production credentials.

## Phase 2B Status

`buzzerhood` exposed: **YES**. On 2026-09-02, `buzzerhood` was appended to the existing `PGRST_DB_SCHEMAS` value and only the `rest` service was reloaded. PostgREST became healthy and its schema cache loaded 133 relations. See `docs/PHASE_2B_DEPLOYMENT_REPORT.md` for verified deployment state.
