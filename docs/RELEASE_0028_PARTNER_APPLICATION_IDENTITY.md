# Release 0028 — Partner Application Identity Lifecycle

Date: 2026-09-06

Scope: Buzzerhood Backend API and PostgreSQL schema `buzzerhood`.

This release fixes duplicate public Partner applications and the admin archive/restore lifecycle for approved Partner identities. It is a manual release guide for the environment owner/operator. Agents must not use this document as permission to access production or run remote deployment commands.

## Target Commits

Minimum application commit:

- `79f6058 Tambahkan validasi duplikasi pendaftaran partner`

Latest instruction-sync commit at time of this runbook:

- `89d50c3 Perbarui instruksi fokus backend lokal`

Use the latest reviewed branch tip that includes both commits.

## Included Change

Database migration:

- `database/migrations/0028_partner_application_identity_lifecycle.sql`

Backend files affected by the release:

- `backend/src/modules/public-partner-applications/public-partner-applications.service.ts`
- `backend/src/modules/admin-public-partner-applications/admin-public-partner-applications.service.ts`
- `backend/test/integration/public-partner-applications.integration.test.ts`
- `docs/API_V1_CONTRACT.md`
- `TODO.md`

## Problem Fixed

Before `0028`, `buzzerhood.set_public_partner_application_archived` could fail with database `permission denied` for the Backend runtime role. The API surfaced it as:

```text
403 PERMISSION_DENIED
Izin tidak mencukupi.
```

The failure was caused by the older function running without the privileges needed to update archive metadata columns. It was not proof that the Admin user lost `partners.manage`.

## Business Rules

- Non-archived `pending` and `approved` public Partner applications block duplicate registration by normalized email.
- Non-archived `pending` and `approved` public Partner applications block duplicate registration by normalized WhatsApp.
- Rejected applications may register again with the same email or WhatsApp.
- Archived applications may register again with the same email or WhatsApp.
- Restoring an archived application validates that another active application has not taken the same email or WhatsApp.
- Archiving an approved linked Partner archives the Partner record and suspends active Partner membership without deleting identity/history.
- Approving a new application that matches one archived approved identity reuses and reactivates that Partner identity instead of creating duplicate `users` or `partners` rows.

## Pre-Release Checks

Run locally from repository root before preparing artifacts:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
Set-Location backend
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run build
```

Expected validation from original implementation:

- Frontend tests: `10/10` passed.
- Backend unit tests: `9/9` passed.
- Backend integration tests: `22/22` passed.
- Migration `0028` passed fresh and upgrade disposable database paths.

## Required Backup

Before applying the migration in any persistent environment:

1. Create a schema-only and data backup for schema `buzzerhood`.
2. Confirm backup restore command and target location.
3. Confirm migration registry table content before changes.
4. Confirm no unreviewed local edits are included in the release artifact.

Do not proceed if backup/recovery path is unknown.

## Data Conflict Preflight

Run this against the target PostgreSQL database before applying `0028`. It detects data that would block the new partial unique indexes.

```sql
with applications as (
  select
    id,
    status,
    archived_at,
    lower(btrim(email)) as normalized_email,
    case
      when regexp_replace(btrim(whatsapp),'[^0-9]','','g') like '62%' then '+' || regexp_replace(btrim(whatsapp),'[^0-9]','','g')
      when regexp_replace(btrim(whatsapp),'[^0-9]','','g') like '0%' then '+62' || substr(regexp_replace(btrim(whatsapp),'[^0-9]','','g'),2)
      when regexp_replace(btrim(whatsapp),'[^0-9]','','g') like '8%' then '+62' || regexp_replace(btrim(whatsapp),'[^0-9]','','g')
      else '+' || regexp_replace(btrim(whatsapp),'[^0-9]','','g')
    end as normalized_whatsapp
  from buzzerhood.public_partner_applications
  where archived_at is null and status in ('pending','approved')
)
select 'email' as conflict_type, normalized_email as identity_key, count(*) as duplicate_count, array_agg(id order by id) as application_ids
from applications
group by normalized_email
having count(*) > 1
union all
select 'whatsapp' as conflict_type, normalized_whatsapp as identity_key, count(*) as duplicate_count, array_agg(id order by id) as application_ids
from applications
group by normalized_whatsapp
having count(*) > 1;
```

Expected result before migration:

```text
0 rows
```

If rows are returned, stop. Review and resolve duplicates without deleting business history.

## Apply Migration

Apply exactly one migration after confirming all prior migrations are already registered:

```text
database/migrations/0028_partner_application_identity_lifecycle.sql
```

The migration is additive except for replacing reviewed functions. It adds:

- `buzzerhood.normalize_partner_whatsapp(text)`.
- Generated columns `normalized_email` and `normalized_whatsapp` on `buzzerhood.public_partner_applications`.
- `partner_id` link on `buzzerhood.public_partner_applications`.
- `archived_at` and `archived_by` on `buzzerhood.partners`.
- Partial unique indexes for active application email/WhatsApp identity.
- SECURITY DEFINER archive and invitation lifecycle functions with explicit permission checks.

## Post-Migration Verification SQL

Verify registry:

```sql
select version, filename
from buzzerhood.schema_migrations
where version='0028';
```

Verify generated columns and indexes:

```sql
select column_name, generation_expression
from information_schema.columns
where table_schema='buzzerhood'
  and table_name='public_partner_applications'
  and column_name in ('normalized_email','normalized_whatsapp','partner_id')
order by column_name;

select indexname, indexdef
from pg_indexes
where schemaname='buzzerhood'
  and indexname in (
    'public_partner_applications_active_email_idx',
    'public_partner_applications_active_whatsapp_idx',
    'public_partner_applications_partner_idx'
  )
order by indexname;
```

Verify function security and owner:

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner_name,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='buzzerhood'
  and p.proname in (
    'normalize_partner_whatsapp',
    'set_public_partner_application_archived',
    'create_partner_invitation'
  )
order by p.proname;
```

Expected:

- `set_public_partner_application_archived` has `security_definer = true`.
- `create_partner_invitation` has `security_definer = true`.
- Function owner is an approved database owner/migration role, not the runtime role.

Verify runtime grants:

```sql
select
  routine_schema,
  routine_name,
  privilege_type,
  grantee
from information_schema.routine_privileges
where routine_schema='buzzerhood'
  and routine_name in (
    'normalize_partner_whatsapp',
    'set_public_partner_application_archived',
    'create_partner_invitation'
  )
  and grantee='buzzerhood_app'
order by routine_name, privilege_type;
```

Expected:

- `EXECUTE` exists for all three functions.

## Backend Deploy

Deploy Backend artifact built from the reviewed commit that includes `0028` service error handling.

Required runtime behavior:

- Duplicate active email returns `409 PARTNER_APPLICATION_EMAIL_EXISTS`.
- Duplicate active WhatsApp returns `409 PARTNER_APPLICATION_WHATSAPP_EXISTS`.
- Restore conflict returns `409 PARTNER_APPLICATION_RESTORE_CONFLICT`.
- Missing effective `partners.manage` still returns `403 PERMISSION_DENIED`.

## Smoke Test

Use a real Admin user with effective `partners.manage` in the target environment.

1. Submit one public Partner application with new email and WhatsApp.
2. Submit again with same email using different capitalization/spaces. Expect `409` email conflict.
3. Submit again with same phone using `08...` vs `+628...`. Expect `409` WhatsApp conflict.
4. Reject a test application. Submit again with same identity. Expect success.
5. Approve a test application. Archive it from Admin UI. Expect success.
6. Submit another application with the same archived approved identity. Expect success.
7. Approve the second application. Expect existing Partner identity reused/reactivated.
8. Attempt restore of the first archived application. Expect conflict if the second active application owns the same identity.
9. Confirm Admin list/detail still require authentication and `partners.manage`.

## Rollback Notes

Prefer forward fix. Do not drop data.

If an incident occurs after Backend deploy but before migration, Backend may return safe conflict/permission errors while old database functions remain active. Apply migration or roll back Backend artifact to the previous reviewed build.

If migration applied successfully but Backend artifact is old, core database duplicate protection remains active. The UI may show generic errors for new conflict cases until Backend artifact is updated.

Do not remove generated identity columns or partial indexes without a reviewed data-preserving migration.

## Operator Boundary

This repository now records a backend-only agent boundary. Agents should prepare code, tests, docs, commits, and release notes only. Environment owners/operators perform any external deployment using their own approved operational process.
