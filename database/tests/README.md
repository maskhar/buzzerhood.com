# RLS Foundation Test Plan

`rls_foundation_tests.sql` is prepared for a disposable/non-production database only. It must not be run against production.

Required scenarios:

- Profile bootstrap creates one profile per `auth.users` row.
- User A cannot read Organization B.
- User A cannot grant themselves Owner.
- Ordinary user cannot assign system role.
- Client user cannot become Admin.
- Anonymous user cannot read private organization records.
- Authorized active member can read own organization.
- Suspended/removed membership does not grant access.
- Public partner preview excludes private rates.
