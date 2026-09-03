# Database Schema

> **Phase B1 (2026-09-02):** migrations 0014–0016 add
> `buzzerhood.users`, `refresh_sessions`, and `auth_security_events`.
> `profiles.user_id` uniquely references custom users and equals `profiles.id`
> when present; it is nullable only for transition compatibility. Password
> hashes live only in `users`, refresh plaintext is never stored, and all three
> new tables use forced RLS.

> **Phase B1 transition notice (2026-09-02):** migrations `0001`–`0016` are authoritative. Custom `buzzerhood.users` owns new Backend identities; `auth.uid()` remains only as a transitional compatibility fallback.

## Rules

All business objects live in `buzzerhood`. System users stay in `auth.users`; files stay in `storage.objects`. Every SQL reference is schema-qualified. Tables with user-facing private data enable RLS.

## Core Tables

| Domain | Tables |
|---|---|
| Identity | `profiles`, `organizations`, `organization_members`, `roles`, `permissions`, `role_permissions`, `user_roles` |
| Partner | `partners`, `partner_platform_accounts`, `partner_audience_metrics`, `partner_rates` |
| Campaign | `campaigns`, `campaign_partner_assignments`, `deliverables`, `content_submissions`, `content_reviews`, `publications`, `publication_metrics` |
| Commercial | `quotations`, `invoices`, `payments`, `partner_payouts` |
| Operations | `campaign_reports`, `files`, `audit_events` |

## Important Modeling Decisions

- `organizations.kind`: `client`, `partner`, `internal`; user authorization comes from active membership, not client-supplied IDs.
- `partners` may link to a partner organization. Private rates never belong in public previews.
- Platform identity and metrics are separate. `metric_type` records `followers`, `subscribers`, `members`, `monthly_visitors`, `views`, `reach`, `impressions`, `engagement`, or `engagement_rate`; period and source retained.
- Assignment snapshots `agreed_rate_amount` and `currency` to preserve commercial history.
- `content_submissions.version_number` is unique per deliverable. No update path rewrites prior version body/file references.
- Generic `files` stores storage object key only. Clients receive signed URLs after RLS authorization.
- Audit events record actor/action/entity metadata; never secrets or credential material.

Full initial baseline: `database/schema.sql`. Before real deployment split it into timestamped, incremental migrations and test against a non-production clone.

## Phase 2A Decision Record

**OLD DECISION:** architecture baseline named `organization_memberships` and modelled client/partner/internal permission mostly as a single enum role.

**NEW DECISION:** ordered migration `0002_identity_rbac_organizations.sql` uses `buzzerhood.organization_members` with independent `role` (`member`, `manager`, `owner`) and `status` (`invited`, `active`, `suspended`, `removed`), while system RBAC uses `roles`, `permissions`, `role_permissions`, and `user_roles`.

**REASON:** tenant membership must not grant global system privileges; invitation lifecycle must not be treated as active access. `database/migrations/` is authoritative for deployment; `database/schema.sql` remains architecture baseline only.


## Phase 2B Update

Deployment uses `buzzerhood.schema_migrations` because no compatible existing `supabase_migrations.schema_migrations` table existed. Future migrations must inspect and update this tracking state through reviewed deployment procedure.
