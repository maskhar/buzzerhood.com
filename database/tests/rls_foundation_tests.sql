-- RLS foundation tests for disposable/non-production database only.
-- Replace placeholders through test harness setup; never run against production.

begin;

-- Test harness should create two auth users and set request.jwt.claim.sub for each transaction.
-- Required checks:
-- 1. select from buzzerhood.organizations as User A returns only organizations with active membership.
-- 2. update buzzerhood.organization_members set role = 'owner' by ordinary member is denied.
-- 3. insert into buzzerhood.user_roles by ordinary member is denied.
-- 4. select from buzzerhood.partner_rates by anon/authenticated without partners.manage is denied.
-- 5. membership status in ('suspended','removed','invited') does not satisfy buzzerhood.is_active_organization_member(...).
-- 6. buzzerhood.has_permission(...) only returns true through non-revoked system role grants.

rollback;
