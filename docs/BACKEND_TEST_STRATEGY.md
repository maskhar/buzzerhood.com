# Backend Test Strategy

## B1 executed acceptance

The harness creates disposable PostgreSQL 17 databases for fresh 0001→0016 and
upgrade 0001→0013→0016 paths, then runs real Nest/Fastify/Kysely Auth against the
upgrade database. Coverage includes registration, normalized duplicates, mass
assignment, injection input, login/me, JWT, rotation/replay family revocation,
logout/logout-all, suspension, hashed storage, cookies, Supabase fallback,
runtime-role flags and one-connection pool isolation.

## Test environments

Backend integration, API, migration, and security tests use disposable PostgreSQL and a real NestJS/Fastify application. Apply migrations `0001`-`0013` plus future `0014+` in order. The harness supplies the minimum compatible `auth.users`/`auth.uid()` objects needed by historical migrations until B5, without running production or requiring GoTrue.

Production is never the first test environment. Production checks are bounded acceptance/smoke tests using explicitly approved Buzzerhood identities and rollback transactions only when separately authorized.

## Test layers

| Layer | Focus | Real dependencies |
|---|---|---|
| Unit | Zod schemas, password/token helpers, error mapping, policy and state helper edge cases | No DB; crypto library real where practical. |
| Database migration | Ordered apply, registry, constraints, function definitions, grants/RLS, idempotent seeds/import, reconciliation | Disposable real PostgreSQL. |
| Repository/integration | Kysely queries, user transaction context, functions, locking/concurrency, mappings | Disposable real PostgreSQL; runtime role. |
| API | HTTP serialization, cookies, headers, auth guards, DTO privacy, errors/OpenAPI | Real Nest/Fastify app + disposable DB. |
| Security | Cross-tenant/partner denial, role escalation, CSRF/CORS, replay, mass assignment, SQL/error leakage, pool context | Real app/DB and browser-like client. |
| Frontend contract | Central API client refresh behavior and domain query functions | Test server matching OpenAPI. |
| Cutover acceptance | End-to-end MVP workflow and legacy/new parity | Staging; production smoke only after approval. |

Avoid tests that mock the database for authorization or transaction behavior. Mocks are appropriate only for external mail/storage ports and isolated failure handling.

## B1 auth matrix

- Register allowed/disabled policy, normalized duplicate email, invalid email/password, unknown fields.
- Argon2id hash differs from plaintext, verifies correctly, rejects wrong password, and rehashes when parameters age.
- Login success and generic failure; inactive/suspended user; rate limiting/backoff; no enumeration.
- Access JWT valid signature/algorithm/issuer/audience/expiry; malformed, wrong-key, wrong-audience, expired, and token-valid-before boundary.
- Refresh success, single-use rotation, old-token replay family revocation, expiry, explicit revocation, concurrent refresh behavior, and only hash at rest.
- Cookie flags/path/host/SameSite/Secure and no token in response/log except access token in intended JSON field.
- Logout idempotency, logout-all, password change/reset and user suspension revocation.
- `/auth/me` safe fields only.
- Email verification/reset tokens single-use, hashed, expiring, generic recovery response; provider is mocked at port boundary.

## Database context and pool tests

Run with `buzzerhood_app`, RLS forced, and no owner/superuser privileges:

1. Private query without context fails closed.
2. User A transaction sees only A scope.
3. Commit/rollback; reuse a pool of one; User B cannot see A scope.
4. Alternate users for many iterations and forced exceptions.
5. Nested/service operations cannot escape the transaction object.
6. Retry opens a new transaction and reapplies context.
7. Browser/legacy API roles have no exposed SQL/RPC path that can set backend context; simulated injection cannot change actor identity.
8. Suspended membership/revoked role immediately denies a new request despite a still-valid access JWT.

## Tenant/RBAC matrix

- Client A cannot list/read/update Client B organization, members, campaign, content, publication, metric, report, or billing record.
- Organization IDs in body/path never grant access without active membership.
- Invited/suspended/removed membership grants no access.
- Partner A cannot access Partner B profile administration, platform accounts, metrics, rates, claim, assignment, deliverable, submissions, or publications.
- Partner does not see campaign estimated budget, rate snapshots beyond its authorized commercial terms, internal notes, unrelated partners, or client-private data.
- Internal role gets only seeded permissions; revoked role stops working.
- Ordinary user cannot assign system roles, approve claims/applications, self-approve content, self-verify publication, set actor IDs, or change protected statuses.
- Admin/super-admin behavior matches explicit permissions and is audited.

## Workflow and concurrency

- Every allowed and disallowed campaign transition in `0012`; cancelled/archived semantics reviewed explicitly.
- Partner assignment accepts/declines only once and only by target partner.
- Concurrent partner claims cannot produce two active owners.
- Concurrent content submissions receive distinct sequential versions; previous versions remain unchanged.
- Internal versus client review context and valid deliverable state.
- Publication only from an approved matching submission/deliverable/platform account.
- Verification restricted to authorized internal actor.
- Metric type/value/period/source constraints and immutable snapshot history.
- Status history/activity actor, reason, and timestamp correctness.

## DTO, validation, and API tests

- OpenAPI contract snapshots/diff and example validation.
- Unknown fields rejected; protected fields cannot be mass-assigned.
- Invalid UUID, cursor, enum, currency, amount, date range, URL, and bounds return stable safe errors.
- Sort/filter identifiers are allowlisted; malicious strings never become SQL identifiers/fragments.
- `404`/`403` concealment policy is consistent and does not enumerate cross-tenant resources.
- Raw database errors, constraint names, stack traces, tokens, cookies, credentials, and sensitive bodies are absent from response/log snapshots.
- Request IDs propagate through success and error responses.

## Migration and data preservation

- Fresh ordered migration apply and upgrade from a fixture representing production `0013`.
- `schema_migrations` has one exact row per migration; deployed files are checksum-reviewed operationally even if registry schema remains unchanged.
- Identity Scenario A (no profiles) creates no users from unrelated Auth rows.
- Scenario B preserves every linked UUID/profile/role/membership/actor reference and produces a deterministic mapping.
- Reconciliation counts/FK orphans are zero before cutover.
- 124 legacy imports, payload/source rows, primary accounts, and metric types/values remain unchanged.
- Forward-fix and artifact rollback procedure rehearsed in staging.

## Frontend/cutover acceptance

- Reload restores session via refresh without persistent access token.
- One failed `401` triggers at most one serialized refresh/retry; no infinite loop.
- Logout clears auth state and all user-scoped TanStack Query cache.
- Public network, workspace resolution, partner onboarding/admin, and campaign workflows match legacy behavior.
- Browser network trace contains no direct Supabase call for each migrated slice and none at all at B4 exit.
- Previous frontend artifact can return a slice to its compatible legacy path before B5.

## Quality gates

For every backend release: TypeScript typecheck, ESLint, unit tests, migration/integration/API/security tests appropriate to the delta, build, OpenAPI diff, dependency/secret scan, and container smoke. Report commands and failures truthfully; do not waive tenant-negative or context-leakage tests for release convenience.

## B2 executed coverage

The B2 runner applies `0001` through `0017` to a fresh disposable PostgreSQL database and separately applies `0001`-`0016` followed by `0017`. HTTP integration tests create only synthetic B1 custom-auth identities and cover workspaces, Organization A/B IDOR, pending/approved/rejected Partner applications, claims and conflicts, profile/platform/rate isolation, primary-platform uniqueness, public Network privacy/pagination, admin permission checks, runtime-role flags, no Campaign grant, and the B1 login/refresh/replay/logout regression suite. Alternating identities use the bounded reusable pool to exercise transaction-local context isolation.

Release result: 9 unit tests and 10 integration tests passed, followed by backend typecheck, lint, and build. The transitional frontend also passed typecheck, lint, 8 tests, and production build.
