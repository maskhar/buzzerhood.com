# Backend Deployment Plan

## B2 deployed topology (2026-09-02)

The dark deployment is `/home/maskhar/docker/buzzerhood-api`, its own Compose
project/image `buzzerhood-api:b2`. It joins external `supabase_default`, reaches
`supabase-db:5432` as `buzzerhood_app`, and publishes only
`127.0.0.1:3100`. No DNS, proxy, Kong or Supabase Compose configuration changed.
Secrets/PEMs are server-only mode 0600. The container is non-root, capability-
dropped, no-new-privileges, and read-only-rootfs. Registration/Swagger are off.

## Boundary

The future backend deploys as an independent Buzzerhood unit, conceptually `buzzerhood-api`. It is not added to `~/docker/supabase/supabase-1.26.05/docker` and does not replace/restart the shared Supabase stack. B0 creates no server directory, container, proxy route, DNS record, certificate, environment file, or database role.

## Container

- Multi-stage Docker build using a pinned supported Node LTS image.
- Build strict TypeScript; runtime image contains production dependencies and compiled output only.
- Non-root process, read-only filesystem where feasible, writable temp directory only if required.
- Explicit init/signal handling, graceful shutdown, resource limits, and container health check.
- No secrets or `.env` copied into the image.

## Environment inventory

Conceptual variables (no values in repository):

- `NODE_ENV`, `PORT`, `LOG_LEVEL`.
- `DATABASE_URL` or separate host/port/database/user/password/SSL settings.
- `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX`, connection/query timeouts.
- `JWT_ISSUER`, `JWT_AUDIENCE`, access-token TTL, signing/private key and verification/public key or approved HMAC secret.
- refresh-token TTL, cookie name/domain/path/SameSite/Secure settings, token-verifier secret if used.
- `CORS_ORIGINS`, trusted proxy count/ranges, request/body limits.
- future mail/storage provider settings behind interfaces.

Backend configuration is validated at startup without printing values. Database/signing/refresh credentials never use `VITE_` and never enter the frontend bundle.

## Database networking and roles

The API connects over trusted private networking to the existing PostgreSQL instance using `buzzerhood_app`, TLS where supported/required by the topology, bounded pooling, and no superuser/table-owner/BYPASSRLS privileges. A separate migration job/principal runs reviewed `0014+` migrations. The API does not auto-migrate production on startup.

Network exposure permits only the API deployment path to reach PostgreSQL; PostgreSQL is not exposed to the browser/public internet. Exact host firewall/network changes require a separate approved infrastructure phase.

## Reverse proxy and TLS

Preferred endpoint: `https://api.dev-buzzerhood.carubra.com`.

Rationale: independent API deployment/versioning and clear separation from the static frontend. TLS terminates at the existing approved reverse proxy or dedicated Buzzerhood proxy route, then uses a trusted internal hop. The proxy forwards a validated request ID and client/proto data only from trusted hops; the API configures Fastify trust-proxy precisely.

CORS allowlists `https://dev-buzzerhood.carubra.com` and explicitly approved non-production origins. Credentialed requests never combine with wildcard origins. Refresh cookie is host-only and scoped to `/api/v1/auth`. Origin/CSRF checks protect cookie-authenticated mutations.

Same-origin `/api` remains fallback if DNS/certificate/cookie operations make it materially safer, but the route must remain independent from Supabase Kong configuration and must not disturb existing gateway paths.

## Health

- `GET /health`: liveness/process response, no dependency detail or secret.
- `GET /ready`: readiness including a bounded DB check; generic unavailable response externally.

Health endpoints do not expose versions, connection strings, schema lists, user counts, or stack traces. Orchestrator/proxy routes traffic only when ready.

## Migration execution

1. Build/test migrations against disposable PostgreSQL with Supabase-compatible `auth` objects for legacy migrations.
2. Review SQL, lock/timeout behavior, grants, RLS, data reconciliation query, and rollback/forward-fix plan.
3. Confirm production backup/recovery path and exact `schema_migrations` state.
4. Run with the migration principal as a discrete approved job.
5. Verify version row, schema objects, grants, reconciliation, and shared service health.
6. Deploy API dark, then readiness smoke and controlled traffic.

Never use production as the first test and never run destructive down migrations automatically.

## Release strategy

- Build immutable image; run typecheck, lint, unit, integration/API/security tests, OpenAPI diff, dependency/secret/container scans.
- Deploy to disposable/staging environment, run migrations and acceptance suite.
- Production: preflight, backup gate where required, migration job, dark API container, health/readiness, smoke, narrow traffic/canary, monitor, then expand.
- Frontend and API are backward compatible during B4 slice cutovers.

Rollback deploys the prior API/frontend artifact or removes traffic from the new slice. Database rollback prefers an additive forward fix; never drops users, mappings, histories, or production data.

## Logging and observability

JSON logs go to existing container log collection initially. Required fields: timestamp, level, service/environment, request ID, route template, method, status, duration, sanitized actor/session ID, and stable error code. Redaction covers Authorization, Cookie/Set-Cookie, password/token/reset fields, DB URL, and provider secrets.

Initial operational measures: availability, request rate/errors/duration, readiness, DB pool saturation, auth failures/throttle/replay, and critical workflow conflicts. No new monitoring platform is required in B0/B1; integrate with available operations first.

## Production verification

- API health/readiness and authenticated smoke with an approved Buzzerhood account.
- Custom login, refresh rotation, logout, and revoked-session behavior.
- DB runtime role privileges and RLS context isolation.
- Organization/partner/campaign tenant-negative checks for migrated slices.
- No new critical logs; no secret-bearing logs.
- Shared `db`, Auth, PostgREST, Storage, Kong, Functions, and Realtime remain healthy.
- Existing unrelated routes/workloads remain reachable.

## B2 dark deployment record

On 2026-09-02, production was backed up to `/home/maskhar/backups/buzzerhood/pre_buzzerhood_backend_b2_20260902T115157Z.dump` (custom format, `PGDMP`, 2,561,175 bytes, `pg_restore -l` PASS), then migration `0017` was applied transactionally. Only `/home/maskhar/docker/buzzerhood-api/deploy/compose.yaml` was used to build/recreate the Buzzerhood API as `buzzerhood-api:b2`; the shared Supabase Compose project was not changed or restarted.

The B2 container is healthy with a read-only root filesystem and `127.0.0.1:3100` binding. `/health`, `/ready`, and anonymous `/api/v1/network` passed; a protected Organization request returned `401`. Registration remains closed and no production user was created. All shared Supabase services remained healthy.
