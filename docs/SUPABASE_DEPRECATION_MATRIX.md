# Supabase Deprecation Matrix

## Rule

Supabase is deprecated as the **Buzzerhood browser application backend**, not as shared infrastructure. Retirement is capability-by-capability and requires measured exit criteria. No phase stops the shared Supabase stack.

| Component | Audited current state | Target | Migration phase | Removal gate |
|---|---|---|---|---|
| PostgreSQL | Source of truth, schema `buzzerhood` | Keep | Never | Not removable. |
| Migration registry | `buzzerhood.schema_migrations`, `0001`-`0013` | Keep; continue `0014+` | B1 onward | Historical migrations immutable. |
| Supabase Auth / GoTrue | Browser login/session; profile trigger coupled to `auth.users` | Custom `buzzerhood.users` + backend auth | B1 build, B4 cutover, B5 retire | Auth acceptance, activation/reset path, session revocation, and rollback proven. Service remains for other apps. |
| Supabase JS Auth | Directly used by provider/login | Backend `/auth/*` | B4/B5 | No imports or runtime calls. |
| PostgREST business reads | Direct tables/views from browser | Resource-oriented REST API | B2-B4 | All query functions migrated and authorization tests pass. |
| PostgREST business writes | Partner/account/rate direct mutations | Explicit backend commands | B2/B4 | No browser `.insert/.update/.delete`. |
| PostgREST RPC | Partner and campaign workflow RPC calls | Domain endpoints invoking/adapting safe DB invariants | B2-B4 | No browser `.rpc`; endpoint parity and state-machine tests pass. |
| `auth.uid()` RLS | Helpers, policies, and actor writes in `0004`, `0007`, `0008`, `0010`/`0011`, `0012` | Transaction-local `buzzerhood.current_user_id()` | B1-B5 | Backend context tests and legacy compatibility/cutover complete. |
| `anon`/`authenticated` grants | PostgREST roles | Dedicated least-privilege `buzzerhood_app` | B1-B5 | Browser PostgREST traffic eliminated; shared grants changed only through reviewed migration. |
| Generated Supabase DB types | Frontend file; stale for `0012`-`0013` | Backend Kysely DB types + API DTOs | B1/B4/B5 | Frontend has no raw DB types. |
| `VITE_SUPABASE_*` | Required by current browser client | `VITE_API_BASE_URL` | B4/B5 | No legacy runtime path. |
| Supabase Storage | Planned only; no operational call | Defer; object-storage port, S3-compatible option later | Later | File domain requirements and migration plan approved. Shared service untouched. |
| Supabase Realtime | No application usage; transitive package only | Do not rebuild by default | B5 | Package removal follows Supabase JS removal. |
| Edge Functions | No Buzzerhood usage | Backend handles future server logic | B5 | Confirm no new Buzzerhood functions were introduced. Shared functions untouched. |
| Kong/Nginx | Existing Supabase routing | Separate API reverse-proxy route | Deployment phase | New API health/TLS/proxy verified; existing routes unaffected. |

## Retirement sequence

1. **B1:** add backend and custom auth alongside Supabase; add dedicated DB roles and backend user context using `0014+` migrations. Do not change the frontend.
2. **B2:** expose organizations and partner network through the backend; validate parity while legacy browser calls remain available for rollback.
3. **B3:** expose campaign workflow using existing tables, constraints, histories, and adapted DB functions.
4. **B4:** migrate domain query functions and auth provider to the centralized API client one vertical slice at a time. No component may choose its own transport.
5. **B5:** prove zero browser Supabase traffic, remove Buzzerhood Supabase JS/config/type dependencies, and retire only Buzzerhood-specific GoTrue/PostgREST coupling. Do not stop shared services.

## Rollback principle

Until a B4 slice meets its exit criteria, retain the last known-good frontend artifact and legacy endpoint compatibility. Rollback changes routing/artifacts, not production data. Identity migrations are additive and mappings are retained through the rollback window. Never roll back by dropping `buzzerhood` objects or deleting users.
