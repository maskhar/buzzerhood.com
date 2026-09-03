# Custom Authentication Architecture

## B1 implemented state (2026-09-02)

The implemented identity is `buzzerhood.users`; no shared `auth.users` row was
copied or changed. Custom users share one UUID across user/profile rows. During
transition `profiles.user_id` is nullable so shared GoTrue activity remains
compatible; custom registration always writes both records atomically.

Passwords are 12–128 characters and Argon2id encoded (19 MiB, two passes,
parallelism one). Access tokens use Ed25519/EdDSA, 600 seconds by default, and
contain `sub`, `jti`, `iss`, `aud`, `iat`, and `exp`. Validation allowlists EdDSA
and checks all claims, active status, and the password-change boundary.

Refresh values contain 256 random bits and only SHA-256 lookup digests are
stored. An HttpOnly host-only cookie, readable random CSRF cookie, matching
`X-CSRF-Token`, SameSite=Lax and strict Origin allowlisting protect browser
flows. Rotation is locked/atomic; replay commits family revocation before the
401 response. Logout revokes a family; logout-all revokes all user sessions.
Production registration is closed.

## Decision summary

Buzzerhood will own application identity in `buzzerhood.users`. Passwords use Argon2id. The API issues 10-minute access JWTs and opaque, rotating refresh tokens. Refresh tokens are held only in an HttpOnly Secure cookie and only verifier hashes are stored. Existing Buzzerhood profile/role/membership UUIDs are preserved if any appear before migration.

## Data model

Conceptual `buzzerhood.users`:

| Column | Purpose |
|---|---|
| `id uuid primary key` | Stable Buzzerhood user identity. |
| `email text` | Original/canonical display email after validation. |
| `normalized_email text unique` | Trimmed, case-normalized login key; exact normalization finalized in migration tests. |
| `password_hash text` | Encoded Argon2id hash only. |
| `email_verified_at timestamptz null` | Verification state. |
| `status text` | `pending_verification`, `active`, `suspended`, `disabled`; constrained. |
| `last_login_at timestamptz null` | Successful login audit aid. |
| `password_changed_at timestamptz null` | Revocation/security boundary. |
| `created_at`, `updated_at` | Lifecycle timestamps. |

No name, avatar, tenant, role, or permission is stored in the credential row.

`buzzerhood.profiles` becomes a business/profile record with `user_id uuid unique not null references buzzerhood.users(id)`. Because current `profiles.id` is also the profile UUID referenced throughout the schema, the least disruptive migration is:

- preserve `profiles.id` as the stable profile identifier;
- add `profiles.user_id` and initially set it equal to the matching user UUID;
- for migrated identities, create `users.id = legacy auth.users.id` whenever that UUID already anchors a profile;
- gradually repoint the profile's auth FK from `auth.users` to `buzzerhood.users` without changing `profiles.id` or downstream `profile_id`/actor values.

This preserves all `user_roles`, organization/partner memberships, and actor/history references. New users may also use the same UUID for `users.id` and `profiles.id`, while keeping two conceptual tables.

Conceptual `buzzerhood.refresh_sessions`:

| Column | Purpose |
|---|---|
| `id uuid primary key` | Session identifier (`sid`). |
| `user_id uuid` | Owner. |
| `family_id uuid` | Rotation family for replay response. |
| `token_hash bytea/text` | HMAC/SHA-256 verifier of high-entropy opaque token; never plaintext. |
| `parent_session_id uuid null` | Rotation lineage. |
| `expires_at`, `last_used_at` | Lifetime/activity. |
| `rotated_at`, `revoked_at`, `revoke_reason` | Revocation/rotation. |
| `created_at` | Issuance. |
| `user_agent_hash`, `ip_prefix` optional | Coarse security metadata with retention limits. |

Indexes support token lookup, active sessions by user, and family revocation. Expired/revoked sessions are retained only for a defined security/audit period and purged by an operational job later.

## Current production identity finding

Read-only aggregate inspection on 2026-09-02 found:

- 181 rows in shared `auth.users`;
- 0 rows in `buzzerhood.profiles`;
- 0 matched Auth/profile rows;
- 0 Buzzerhood user roles, organization memberships, and partner memberships.

Therefore Scenario A applies now: B1 can establish clean custom Buzzerhood identity without copying unrelated Supabase users. The pre-migration check must be repeated immediately before applying identity migrations.

If Scenario B becomes true, create a reviewed mapping/audit table (`legacy_auth_user_id`, `user_id`, migration state/timestamps), preserve the legacy UUID as `users.id`, copy no password credential, and send an activation/password-set flow. Never discard or silently duplicate a linked identity.

## Passwords

- Argon2id using a maintained Node binding.
- Memory/time/parallelism parameters are typed configuration with secure reviewed defaults and a maximum verification resource budget; the encoded hash records parameters for future rehash.
- Password policy favors length and breached/common-password screening over brittle composition rules; exact product policy is a B1 acceptance decision.
- Use constant-behavior credential responses to limit account enumeration.
- Never log, return, audit, or store plaintext passwords.
- Supabase password hashes are not reused. Existing linked users activate the new account and set a new password through a one-time, expiring token.

## Access JWT

- Lifetime: 10 minutes by default, configurable within a reviewed 10-15 minute range.
- Algorithm: EdDSA/Ed25519 is preferred because verification can be separated from signing and key rotation is clearer. If current operations cannot securely manage asymmetric keys, HS256 with a high-entropy server-only secret is an acceptable B1 fallback documented before implementation.
- Required claims: `sub`, `sid`, `iss`, `aud`, `iat`, `exp`, `jti`.
- Exclude email, profile details, memberships, roles, complete permission sets, and secrets.
- Backend validates algorithm allowlist, signature, issuer, audience, expiry, user status, and session revocation boundary.
- Signing key material is backend-only and never `VITE_*`, repository content, log output, or OpenAPI examples.

The access token is returned in JSON and held in memory by the frontend. It is not persisted to `localStorage`, `sessionStorage`, IndexedDB, URLs, or logs. On reload, the frontend obtains a new token through the refresh cookie.

## Refresh token and cookie

- Opaque token with at least 256 bits of cryptographic randomness; no authorization claims.
- Cookie: HttpOnly, Secure, host-only, narrow `Path=/api/v1/auth`, and explicit SameSite policy.
- Preferred production topology uses `api.dev-buzzerhood.carubra.com`; the frontend uses `credentials: 'include'` and strict CORS allowlisting.
- `SameSite=Lax` is the baseline when browser behavior/topology supports it. Because refresh/logout mutate session state and cookies are credentials, require an Origin/Referer allowlist and CSRF token or equivalent double-submit protection on cookie-authenticated mutation endpoints. Do not depend on SameSite alone.

Rotation is single-use:

1. Lock the active session row by token hash.
2. Reject expired/revoked/rotated tokens.
3. Mark current token rotated and create its replacement in one transaction.
4. Set the replacement cookie and return a new access token.
5. If an already-rotated token is replayed, revoke the whole family and require login.

Concurrent refresh is handled explicitly. A short, bounded grace strategy may be considered for legitimate browser races only if it does not make replay reusable; otherwise serialize refresh in the frontend and return a stable session-expired error.

## Auth flows and API scope

### B1 MVP

- `POST /api/v1/auth/register`: create pending user/profile and initiate verification when public registration is enabled; deployment may initially restrict this endpoint by product policy.
- `POST /api/v1/auth/login`: verify credentials, apply throttling/backoff, create refresh session, set cookie, return access token and safe user DTO.
- `POST /api/v1/auth/refresh`: rotate cookie session and return access token.
- `POST /api/v1/auth/logout`: revoke current family/session and clear cookie; succeeds idempotently.
- `POST /api/v1/auth/logout-all`: revoke every active refresh session for the authenticated user and clear cookie.
- `GET /api/v1/auth/me`: return identity/profile and high-level authorized workspace links, not raw permission tables.

### Required before broad account rollout, provider-neutral in B1

- Email verification.
- Forgot/reset password using single-use hashed tokens, short expiry, password/session revocation, and generic responses.
- Admin/invitation activation path.

Social login, SSO, MFA, and account recovery escalation are later unless product requirements promote them.

## Logout and revocation

- Current logout revokes the current refresh session/family, clears cookie, clears in-memory token, and clears TanStack Query cache.
- Logout-all revokes all refresh sessions. Existing access tokens can live for at most their short TTL; high-risk endpoints may additionally check session/user revocation timestamp.
- Password reset/change and user suspension revoke all refresh sessions and establish a token-valid-after boundary.
- Refresh replay generates a security audit event without recording the token.

## RBAC and tenancy

Existing RBAC tables stay authoritative. Authentication produces only user/session identity. Authorization loads active roles/permissions and then checks the resource's active organization or partner membership. A global permission does not implicitly prove tenant membership unless that permission is explicitly designed for cross-tenant internal work.

The backend must not trust `organizationId`, `partnerId`, role, verification status, or actor fields supplied by the browser. Actor IDs always come from verified request context.

## Bootstrap

No hardcoded admin email and no public self-promotion. The first privileged role assignment remains an explicit, reviewed operator transaction using placeholders and audit evidence. B1 documents a safe command/runbook; it does not auto-promote the first registrant.

## Abuse controls and audit

- Layered per-IP and per-account throttling/backoff on login, register, refresh, verification, and reset; no irreversible lockout after a few failures.
- Generic invalid-credential and account-recovery responses.
- Audit login success/failure category, refresh rotation/replay/revocation, password changes, status changes, and role changes.
- Never log password, token, cookie, Authorization header, reset/verification secret, DB URL, or signing key.

## Migration order

1. Preflight aggregate linked identities and backup/recovery plan.
2. Add custom identity/session/token tables additively (`0014+`).
3. For any linked profile, create user with preserved UUID and pending activation; store mapping/audit evidence.
4. Add/backfill `profiles.user_id`; retain legacy FK/trigger during compatibility window.
5. Deploy backend auth and prove activation/login/refresh/revocation.
6. Cut frontend auth in B4.
7. Remove only Buzzerhood's `auth.users` FK/trigger and GoTrue coupling in B5 after rollback window.

No step deletes shared `auth.users` or disables GoTrue.
