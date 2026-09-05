# B4 Public Registration Backend Deployment Report

Deployment date: September 5, 2026.

## Scope

- Applied additive migration 0019_public_partner_applications.sql to PostgreSQL schema buzzerhood.
- Built and deployed image buzzerhood-api:b4 only.
- Did not recreate, reconfigure, or stop any Supabase service.
- Did not deploy public frontend artifact. Existing frontend transport remains active until separate frontend release.

## Safety

- Created pre-deployment buzzerhood schema dump and API source archive under server Buzzerhood backup directory.
- Verified migration checksum before execution.
- Verified migration registry, forced RLS, three application-table policies, and buzzerhood_app privileges after execution.

## Verification

- buzzerhood-api:b4 reports healthy.
- Local health and readiness endpoints return HTTP 200.
- Public Network endpoint returns 124 records and pagination metadata.
- Unauthenticated admin review queue returns HTTP 401.
- Invalid public registration payload returns HTTP 422 without creating data.
- External HTTPS health and Network endpoints return HTTP 200 through Cloudflare.
- Existing Supabase Auth, database, Storage, PostgREST, Edge Functions, Studio, Pooler, Realtime, Meta, and Imgproxy containers remain healthy.

## Follow-up

- Apply reviewed migration `0020_public_partner_applications_rls_hardening.sql` after explicit owner approval lifts the local-only boundary. It removes app-role reads when transaction-local `app.user_id` is absent.
- Release public frontend artifact separately before website submissions use Backend endpoint.
- Continue B4 auth/client migration before Login and Dashboard cutover.
