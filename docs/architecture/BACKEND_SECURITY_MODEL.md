# Backend Security Model

## B1 controls implemented

`buzzerhood_app` is not superuser, owner, CREATEDB, CREATEROLE, replication or
BYPASSRLS. It has only B1 identity/profile/RBAC privileges. New tables have
forced RLS; narrow SECURITY DEFINER functions permit normalized login and
hashed-session lookup only. Inputs are strict/parameterized. Credential, cookie,
token, key and DB URL fields are redacted. Registration never grants a role.
Auth throttling is in-process and therefore per replica until scale justifies a
shared limiter.

## Security boundary

The Buzzerhood API is the browser-facing application security boundary. UI route guards are presentation controls only. Every protected operation requires backend authentication, permission and tenant/resource authorization, service invariant validation, parameterized data access, and database defense-in-depth where practical.

## Threats and controls

| Threat | Required controls |
|---|---|
| Password disclosure/offline cracking | Argon2id, parameter review/rehash, secrets redaction, TLS, no plaintext/token logging. |
| Refresh-token theft/replay | HttpOnly Secure narrow cookie, hashed opaque tokens, one-time rotation, family revocation, session inventory, short retention. |
| Access-token theft | 10-minute TTL, memory-only browser storage, strict CSP/XSS defenses, issuer/audience/algorithm validation. |
| CSRF | SameSite cookie plus Origin/Referer validation and CSRF token/equivalent for refresh/logout/register/reset cookie flows; strict CORS. |
| XSS | React escaping, no unsafe HTML, CSP/security headers, dependency review, access token not persisted. |
| SQL injection | Kysely parameterization; allowlisted identifiers/sort fields; parameterized raw SQL only. |
| IDOR/cross-tenant access | Derive actor from JWT; active org/partner membership check on loaded resource; scoped repository query; RLS context; negative tests. |
| Role escalation | Existing RBAC; explicit administrative commands; no mass assignment; role writes audited and never inferred from email. |
| Mass assignment | Zod allowlist DTOs and explicit column maps. Protect role, membership owner, verification, campaign state, internal notes, fees/payouts, and actor fields. |
| DTO/privacy leakage | Endpoint-specific response DTOs; do not serialize DB rows. Partner never receives campaign total budget/internal notes; public network excludes rates and private identity. |
| Pool context leakage | Transaction-local `set_config(..., true)` and transaction-bound repositories; pool-size-one alternating-user tests. The custom GUC is not a cryptographic boundary against arbitrary SQL under the app role. |
| Brute force/enumeration | Per-IP/account throttling and progressive backoff, generic responses, monitored security events; no brittle permanent lockout. |
| Token/key compromise | Server-only keys, explicit rotation and `kid` strategy, environment/secret manager, no frontend key or repository value. |
| Error information leak | Stable error codes; no raw PostgreSQL messages, stack traces, constraints, or environment details. |

## Authentication

Custom identity/session details are normative in `AUTH_ARCHITECTURE.md`. User status and session boundaries are checked server-side. Authentication does not grant tenant access.

## Authorization policy

```text
authenticated active user
  AND required system permission when applicable
  AND active organization/partner membership or explicit cross-tenant permission
  AND resource belongs to that tenant/assignment
  AND requested workflow transition is valid
```

Controllers use guards for authentication and coarse permission declarations. Application services query the resource and enforce membership/state in the same user-scoped transaction. Database constraints and RLS are the final defense, not a substitute for service checks.

High-value rules include:

- Client A cannot read or mutate Client B campaigns.
- Partner A cannot read Partner B assignments, rates, or profile administration.
- Partner DTOs exclude campaign estimated budget, internal notes, unrelated partners, and client-private data.
- Partner cannot approve its own content or verify its own publication.
- Only internal authorized actors can approve applications/claims and manipulate internal workflow.
- Browser-supplied actor IDs, tenant IDs, role/status fields, and fee approval fields are never accepted as authority.

## RLS and database roles

RLS remains defense-in-depth using `buzzerhood.current_user_id()` backed by transaction-local `app.user_id`. `buzzerhood_app` has no superuser, owner, `BYPASSRLS`, role-creation, or DDL privileges. Migrations use a separate unavailable-at-runtime principal. Service/background context is explicit, least-privilege, and audited.

Existing `SECURITY DEFINER` functions must be inventoried before adaptation. Each has an empty `search_path`, schema-qualified objects, fixed owner, revoked PUBLIC access, minimum execute grants, validation of all identifiers, and tests under the runtime role.

## API and browser controls

- HTTPS only; HSTS after TLS topology is proven.
- Exact production CORS origins; credentialed requests never use `*`.
- Security headers through proxy/API: CSP appropriate to each origin, `X-Content-Type-Options`, frame restrictions, Referrer Policy, and permissions policy.
- Content type and body-size limits; bounded pagination; file metadata/type/size validation when storage arrives.
- Zod rejects unknown fields for command DTOs unless explicitly allowed.
- Stable API version `/api/v1`; deprecated behavior has measured migration windows.

## Secrets and configuration

Backend-only configuration includes database credentials, JWT signing material, refresh verifier pepper if used, and future mail/storage credentials. Values live in deployment secrets/environment, not docs, images, frontend, `VITE_*`, logs, or OpenAPI. Startup validates presence and safe production flags without printing values.

## Logging and audit

Request log fields: request ID, route template, method, status, duration, sanitized user/session ID, and error code. Security/operational events include login outcomes, replay/revocation, password/status/role changes, partner approval/claim, campaign transitions, content decisions, publication verification, and commercial state later.

Redact Authorization/Cookie headers, tokens, password fields, reset/verification values, DB URL, keys, raw partner evidence when not needed, and sensitive payloads. Reuse `campaign_status_history`, `campaign_activity_logs`, partner review history, and future general audit tables instead of duplicating histories. Audit records are append-oriented and do not contain secrets.

## Rate limiting

B1 can start with an in-process limiter only for a single replica, but production multi-replica enforcement requires a shared/gateway-backed mechanism. This does not justify adding Redis in B1. Configure endpoint-specific thresholds outside source, return `429` with safe retry guidance, and distinguish availability protection from account lockout.

## Dependency and supply-chain controls

- Pin backend dependency versions and runtime image digest/tag policy; do not use `latest` in production images.
- Automated lockfile audit, TypeScript/lint/test/build, container vulnerability scan, and secret scan in CI.
- Minimize Nest modules and packages; no unnecessary auth, ORM, queue, or crypto abstraction.

## Security release gate

Before each migrated slice: threat-model delta, explicit DTO review, positive and negative authorization tests, runtime-role DB test, log/error inspection, OpenAPI diff, rollback path, and confirmation that legacy routes remain safe until retired.

## B2 enforcement record

Migration `0017` gives `buzzerhood_app` only the Organization/Partner table columns and helper functions needed by B2. The role remains non-superuser and `NO BYPASSRLS`, and has no Campaign table access. Organization managers/owners and Partner managers/owners are checked by schema-qualified helpers; internal review requires `partners.manage` in both the HTTP guard and atomic database function.

Strict Zod command schemas reject actor, ownership, verification, review, visibility, score, and other protected fields. Pending applications/claims create no active ownership. Partner rate cards are never exposed publicly or cross-Partner. Unknown resources and unauthorized tenant substitutions use safe errors without PostgreSQL details. Structured mutation logs contain actor/resource IDs but omit claim evidence and credentials.
