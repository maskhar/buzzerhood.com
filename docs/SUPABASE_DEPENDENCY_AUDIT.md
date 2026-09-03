# Supabase Dependency Audit

## Scope and evidence

This Phase B0 audit covers repository state on 2026-09-02: migrations `0001`-`0013`, database tests, `src/`, package metadata, environment validation, and the documented self-hosted deployment. `database/migrations/` is authoritative; `database/schema.sql` is a historical baseline and is not a deployable migration.

A read-only production aggregate check found 181 shared `auth.users` records and **zero** rows in `buzzerhood.profiles`, `buzzerhood.user_roles`, `buzzerhood.organization_members`, and `buzzerhood.partner_members`. No emails or user rows were read. This confirms that Buzzerhood currently has no linked production identity to migrate, while the shared Supabase Auth service contains unrelated workloads.

## Runtime dependency inventory

| Location | Current dependency | Domain | Classification | Backend replacement |
|---|---|---|---|---|
| `package.json`, `package-lock.json` | `@supabase/supabase-js` and transitive Auth/Realtime packages | Cross-cutting | INFRASTRUCTURE | Remove only in B5 after all browser call sites are gone. |
| `.env.example`, `src/app/config/environment.ts` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Configuration | INFRASTRUCTURE | `VITE_API_BASE_URL`; keep legacy variables during B1-B4 transition. |
| `src/lib/supabase/client.ts` | `createClient`, persisted/auto-refreshed session, `.schema('buzzerhood')` | Cross-cutting | AUTH, DATABASE | Central `src/lib/api/client.ts`; backend owns DB credentials. |
| `src/features/auth/auth-context.ts` | Supabase `Session` and `User` types | Auth | AUTH, TYPE GENERATION | API-owned `AuthUser`, in-memory access-token state, `/auth/me`. |
| `src/features/auth/auth-provider.tsx` | `auth.getSession`, `auth.onAuthStateChange`, `auth.signOut` | Auth | AUTH | Backend login/refresh/logout and app-local auth state. |
| `src/pages/public/login-page.tsx` | `auth.signInWithPassword` | Auth | AUTH | `POST /api/v1/auth/login`. |
| `src/features/profile/profile-api.ts` | `profiles` select | Identity | DATABASE READ | `GET /api/v1/auth/me`; profile endpoint only if separate editing is needed. |
| `src/features/organizations/organization-api.ts` | `organization_members` embedded select | Organizations | DATABASE READ | `GET /api/v1/organizations`. |
| `src/features/workspaces/use-workspace-access.ts` | membership/org select and browser workspace derivation | Me/workspace | DATABASE READ, AUTHORIZATION PRESENTATION | `GET /api/v1/me/workspaces`; backend returns authorized workspaces. UI guard remains UX only. |
| `src/pages/client/client-pages.tsx` | organization membership/team selects | Organizations | DATABASE READ | Organization and member endpoints. |
| `src/features/network/public-network-api.ts` | `public_network_partners` view | Public network | DATABASE READ | `GET /api/v1/network`. |
| `src/features/onboarding/onboarding-api.ts` | six RPCs; public view; partner/member/account/metric/rate reads; direct partner/account/rate writes | Partners | DATABASE READ, DATABASE WRITE, RPC | Partner, application, claim, platform, metric, and rate services. |
| `src/pages/admin/admin-pages.tsx` | raw partner and claim embedded selects | Admin/partners | DATABASE READ | `/api/v1/admin/partners` and `/api/v1/admin/partner-claims`. |
| `src/features/campaigns/campaign-api.ts` | four RPCs and client/partner projection reads | Campaign | DATABASE READ, RPC | Campaign, assignment, deliverable, content, publication, and metric endpoints. |
| `src/lib/supabase/query-keys.ts` | Supabase-named query-key module | Frontend cache | INFRASTRUCTURE | Move unchanged semantics to `src/lib/api/query-keys.ts` or domain modules in B4. |
| `src/lib/supabase/database.types.ts` | generated database row types | Cross-cutting | TYPE GENERATION | Backend-only Kysely DB interface; frontend uses API DTO/Zod contracts. |

## Authentication

Direct browser Auth behavior is limited to email/password login, session restoration, Auth state subscription, automatic refresh, logout, and Supabase `User`/`Session` types. Registration, invite acceptance, email verification, password reset, and approved-account smoke tests are not implemented. The database profile bootstrap trigger in `0004` is coupled to inserts into `auth.users`.

Replacement is the custom identity and rotating refresh-session design in `AUTH_ARCHITECTURE.md`. No Buzzerhood browser flow will call GoTrue after B4; GoTrue remains running for other workloads.

## PostgREST reads and writes

Observed browser reads:

- `profiles`, `organization_members`, `partners`, `partner_claim_requests`, `partner_members`, `partner_platform_accounts`, `partner_audience_metrics`, and `partner_rates`.
- `public_network_partners`.
- `client_campaigns`, `client_campaign_briefs`, `client_campaign_assignments`, `client_campaign_deliverables`, `partner_assignments`, and `partner_deliverables`.

Observed browser writes:

- Allowed-field update to `partners`.
- Insert/delete of `partner_platform_accounts`.
- Insert/update of `partner_rates`.
- No direct campaign table write; campaign mutations use RPCs.

PostgREST-specific behavior includes embedded resource selection, `.maybeSingle()`, `.or()` filter syntax, range/limit/order builders, column-level grants, exposed-schema configuration, and reliance on JWT-derived `auth.uid()` in RLS.

## RPC inventory and disposition

| Function | Browser caller / migration | Current purpose | Target disposition |
|---|---|---|---|
| `create_client_organization` | onboarding / `0007` | Atomic org + owner membership | HYBRID: backend validates request; retain an adapted transaction primitive or perform equivalent Kysely transaction. |
| `create_partner_application` | onboarding / `0007` | Atomic partner + invited owner | HYBRID. |
| `request_partner_claim` | onboarding / `0007` | Claim availability and uniqueness | HYBRID; database unique constraint remains authoritative. |
| `approve_partner_claim` | admin / `0007` | Lock, ownership conflict check, approve/reject competing claims | KEEP IN DB, adapted to backend actor context; backend orchestrates and maps errors. |
| `review_partner_application` | admin / `0010`, replaced by `0011` | Review, publish, activate/remove invited members, history | KEEP IN DB/HYBRID; atomic state transition remains database-side. |
| `reject_partner_claim` | admin / `0010`, replaced by `0011` | Atomic pending-to-rejected transition | KEEP IN DB/HYBRID. |
| `create_campaign` | campaign / `0012` | Campaign, brief, initial history | KEEP transaction invariant in DB or one Kysely transaction; backend owns DTO/policy. |
| `transition_campaign` | campaign / `0012` | Locked state-machine transition and history | KEEP IN DB, adapted actor helper. |
| `respond_campaign_assignment` | campaign / `0012` | Locked partner response transition | KEEP IN DB, adapted membership helper. |
| `submit_content_version` | campaign / `0012` | Concurrent-safe insert-only version and deliverable state | KEEP IN DB. Advisory-lock/version invariant is valuable. |
| `invite_campaign_partner` | not yet called by frontend / `0012` | Assignment and activity log | HYBRID. |
| `create_campaign_deliverable` | not yet called / `0012` | Guarded deliverable creation | MOVE orchestration to backend; constraints remain in DB. |
| `review_content_submission` | not yet called / `0012` | Review history and coupled status transition | KEEP IN DB/HYBRID. |
| `submit_publication` | not yet called / `0012` | Approval gate, publication, deliverable transition | KEEP IN DB/HYBRID. |
| `verify_publication` | not yet called / `0012` | Verification and deliverable state | KEEP IN DB/HYBRID. |
| `record_publication_metric` | not yet called / `0012` | Authorized snapshot insertion | HYBRID; backend validation plus immutable DB insert. |

The backend must not expose generic RPC passthrough. Each function is reached through a business endpoint and stable API error code. `SECURITY DEFINER` functions require a B1/B2 security review, explicit owner, empty `search_path`, minimum execute grants, and backend-compatible current-user context.

## `auth.uid()` migration impact

`auth.uid()` occurs in authoritative migrations as follows:

| Migration | Domain / affected object | Impact |
|---|---|---|
| `0004` | `is_active_organization_member`, `has_system_role`, `has_permission`; profile/user-role/organization-member policies | Replace helper internals and direct self predicates with `buzzerhood.current_user_id()`. |
| `0007` | partner membership helper; org/application/claim RPC actors; partner member/claim policies | Replace actor source and self predicates. Preserve locking and uniqueness behavior. |
| `0008` | partner owner/admin read policy | Replace direct member comparison. |
| `0010`, `0011` | partner review/rejection actor fields | Replace actor source; `0011` is the effective function definition. |
| `0012` | campaign actor/history/submission/review/publication/metric writes | Replace every actor source while retaining state-machine logic. Membership and permission helpers transitively depend on the new context. |

The historical `database/schema.sql` contains four additional `auth.uid()` references but is non-deployable. It must be labeled historical rather than used as a source for `0014+` changes.

## Storage, Realtime, and Edge Functions

- **Storage:** no operational Supabase Storage API call, bucket call, upload, signed URL, or `storage.objects` migration exists in current Buzzerhood implementation. Storage is planned only in baseline documents. Keep it out of B1-B4; design an object-storage port when files become operational. Existing shared Storage remains untouched.
- **Realtime:** `@supabase/realtime-js` is only a transitive package dependency. No channel/subscription usage exists. Do not rebuild Realtime or WebSockets; start with TanStack Query invalidation/polling when needed.
- **Edge Functions:** no Buzzerhood function source or `functions.invoke` call exists. Future server logic belongs in the backend. The shared Edge Function service and unrelated functions remain untouched.

## Generated types

`src/lib/supabase/database.types.ts` is generated for the Buzzerhood schema but is already incomplete relative to migrations `0012`-`0013`: it declares `Views` and `Functions` as empty and lacks campaign engine types. This is further reason not to make it an API contract.

Target:

- Generate a backend-only Kysely `Database` interface from a migration-applied disposable PostgreSQL schema (preferred: pinned `kysely-codegen`, reviewed diff).
- Keep enums/advanced SQL and all DDL in SQL migrations.
- Define API request/response Zod schemas independently; infer frontend-facing types from those schemas or generated OpenAPI, never raw row types.
- Retire the Supabase type generator in B5.

## Infrastructure dependencies retained during transition

The production `db`, `auth`, `rest`, `storage`, `kong`, `functions`, and `realtime` services are shared infrastructure. Buzzerhood will stop using Auth/PostgREST from the browser gradually, but B0 authorizes no service removal or configuration mutation. PostgreSQL and schema `buzzerhood` are permanent.
