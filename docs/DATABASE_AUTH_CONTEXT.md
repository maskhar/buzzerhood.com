# Database Authentication Context

## B1 implementation

`buzzerhood.current_user_id()` safely parses transaction-local `app.user_id`,
then falls back to `auth.uid()` for the transitional Supabase path. Backend
access always uses `BEGIN` → `set_config(..., true)` → callback → transaction
end. A one-connection-pool test proves User A, User B and subsequent anonymous
access do not leak context. Legacy actor-writing functions deferred to B2/B3
still use `auth.uid()` until their API migration.

## Decision

Backend-authenticated user identity is propagated into PostgreSQL through a **transaction-local** setting and resolved by a stable Buzzerhood helper:

```text
Access JWT -> verified user UUID -> database transaction
           -> SET LOCAL app.user_id = '<uuid>'
           -> buzzerhood.current_user_id()
           -> membership/permission helpers and RLS
```

This replaces Buzzerhood's dependency on `auth.uid()` without removing RLS. It is a B1 design; B0 applies no SQL.

## Proposed helper

Conceptual future migration (`0015_backend_auth_context.sql`, exact numbering subject only to the ordered registry) introduces:

```sql
create or replace function buzzerhood.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;
```

The function accepts no caller-provided UUID. Invalid or missing context returns `NULL` (or is normalized before the cast by the final reviewed implementation). Execute privilege is granted only where required. The setting name is fixed as `app.user_id`; it must not be dynamically constructed.

## Kysely transaction contract

Every user-scoped operation must use one database transaction:

1. Acquire a pooled connection by starting a Kysely transaction.
2. Execute a parameterized `set_config('app.user_id', userId, true)` within that transaction. The third argument `true` makes it transaction-local and is preferred over interpolating a `SET LOCAL` statement.
3. Execute all authorization-sensitive queries/functions on that same transaction object.
4. Commit or roll back.
5. Never issue user-scoped queries through the root Kysely instance outside the transaction.

The backend data-access interface should make an authenticated transaction mandatory, for example `withUserTransaction(userId, callback)`. Repositories receive the transaction object rather than global database access.

## Pool safety requirements

- Never use `SET app.user_id = ...` at session scope.
- Never set context on one pooled connection and run queries after releasing it.
- Never rely on a cleanup query as the primary isolation control.
- Context setup and business queries are atomic in the same transaction.
- Missing context must fail closed for private data.
- Tests must alternate User A/User B operations with a pool size of one to detect leakage.
- Transaction retry logic must re-establish context on every new transaction.

## RLS transition

| Stage | Behavior |
|---|---|
| 1 | Existing Supabase RLS and `auth.uid()` remain unchanged. |
| 2 | Add `current_user_id()` and backend transaction wrapper. No browser cutover. |
| 3 | Adapt Buzzerhood helpers (`is_active_organization_member`, `is_active_partner_member`, `has_system_role`, `has_permission`) to a compatibility actor helper that can support the controlled backend context while legacy PostgREST is still required. |
| 4 | Adapt direct policy predicates and workflow actor writes; verify backend and legacy paths separately. |
| 5 | After B4 removes browser PostgREST usage, remove obsolete Buzzerhood `auth.uid()` coupling in an additive reviewed migration. Shared Supabase Auth objects remain. |

During transition, the compatibility helper may resolve backend context first and legacy `auth.uid()` second. A custom PostgreSQL setting is context propagation, not a cryptographic identity primitive: a principal with arbitrary SQL execution under the application role could set it. Its safety therefore depends on the browser having no SQL path, no generic RPC, tightly restricted function execution, parameterized application queries, and a dedicated trusted application connection. Those boundaries and the legacy PostgREST role behavior must be proven in integration tests before deployment.

## Application role

`buzzerhood_app` is the normal runtime login role. It is `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, and must not own tables or have `BYPASSRLS`. It receives only:

- database `CONNECT`;
- schema `USAGE`;
- required table `SELECT/INSERT/UPDATE/DELETE`, with column restrictions where useful;
- sequence usage if sequences are introduced;
- execute on reviewed Buzzerhood functions.

RLS remains forced on private business tables. Only the trusted backend obtains the application-role credential and establishes the setting through the transaction wrapper. Deployment tests must verify that browser/PostgREST roles have no exposed function or SQL interface that can inject backend context. Normal application traffic never uses `postgres`, `supabase_admin`, `service_role`, or a table owner.

## Migration role

A separate `buzzerhood_migrator` (or existing controlled deployment principal) owns/changes Buzzerhood objects and records `schema_migrations`. It is unavailable to the running API container. Credentials and grants are stored only in server secret/configuration management. Migration execution is an explicit deployment job, never API startup behavior in production.

## Service/system context

Background work does not impersonate a user. It uses a separate least-privilege service role or explicit `app.service_name`/audited function path. Each job type receives only the operations it needs. Human-attributable changes require an actor UUID; service-attributable changes record the service identity in the existing activity/audit model. `BYPASSRLS` is not the default service design.

## Migration impact inventory

- `0004`: four direct policies and three central helpers.
- `0007`: partner helper, RPC actor acquisition/writes, and member/claim policies.
- `0008`: partner owner read predicate.
- `0010` and effective replacement `0011`: partner review actor writes.
- `0012`: campaign transition/history, creation/invitation, content submission/review, publication verification, and metric actor writes.

Historical migrations remain immutable. `0014+` replaces function definitions and policies with `CREATE OR REPLACE`/drop-create policy operations after disposable-database validation.

## Verification gates

- Missing/invalid context cannot read or mutate private rows.
- User A cannot observe User B data after connection reuse.
- Membership suspension takes effect without waiting for JWT expiry.
- Revoked roles stop authorizing new requests.
- Service context cannot obtain interactive-user-only access.
- Legacy PostgREST remains correct until its B4 slice is retired.
- Browser/legacy API roles have no SQL/RPC route that can inject backend context.
- A simulated SQL-injection attempt cannot alter identity; RLS is defense against query defects, not arbitrary code execution under a compromised application role.
- SQL errors never echo context or connection data to clients.
