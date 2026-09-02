# Admin Bootstrap

This procedure assigns the first administrative system role after database deployment. Do not run during Phase 2A.

## Preconditions

- Migrations applied and verified.
- `buzzerhood.profiles` row exists for authorized operator.
- Operator identity approved outside the database change process.
- Backup/recovery path confirmed.

## Placeholder SQL

Replace placeholders only during approved Phase 2B/operations:

```sql
insert into buzzerhood.user_roles (profile_id, role_id, granted_by)
select '<AUTH_USER_UUID>'::uuid, r.id, '<GRANTOR_AUTH_USER_UUID>'::uuid
from buzzerhood.roles r
where r.key = 'super_admin'
on conflict (profile_id, role_id) do nothing;
```

Do not assign admin by email in migrations. Do not commit real UUIDs. Do not grant `super_admin` automatically to any account.

## Safer Operational Notes

- Prefer a time-boxed reviewed SQL change.
- Record ticket/change approval ID outside sensitive audit metadata.
- Revoke or adjust role through a controlled admin flow when available.

## Phase 3 Verification
After inserting role record, verify auth user and profile exist, role permission resolves, and rerun produces no duplicate (profile_id, role_id). Never use email matching or automatic bootstrap.

