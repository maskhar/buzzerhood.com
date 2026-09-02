-- 0005: deterministic reference RBAC data only. No real user role assignment.
insert into buzzerhood.permissions (key, description) values
  ('roles.read', 'Read role and permission reference data.'),
  ('roles.manage', 'Manage system roles, permissions, and assignments.'),
  ('organizations.read', 'Read organization records across tenant boundaries.'),
  ('organizations.manage', 'Manage organization records and memberships.'),
  ('partners.read', 'Read partner operational data.'),
  ('partners.manage', 'Manage partner operational data and private rates.'),
  ('campaigns.read', 'Read campaign operational data.'),
  ('campaigns.manage', 'Manage campaign operational workflow.'),
  ('reports.read', 'Read campaign reports.'),
  ('billing.manage', 'Manage quotations, invoices, payments, and payouts.'),
  ('users.read', 'Read user profile administration data.'),
  ('users.manage', 'Manage user access through approved administrative flow.')
on conflict (key) do update set description = excluded.description;

insert into buzzerhood.roles (key, label, scope) values
  ('super_admin', 'Super Admin', 'system'),
  ('admin', 'Admin', 'system'),
  ('internal_team', 'Internal Team', 'system'),
  ('organization_owner', 'Organization Owner', 'organization'),
  ('organization_manager', 'Organization Manager', 'organization'),
  ('organization_member', 'Organization Member', 'organization')
on conflict (key) do update set label = excluded.label, scope = excluded.scope;

insert into buzzerhood.role_permissions (role_id, permission_id)
select r.id, p.id
from buzzerhood.roles r
cross join buzzerhood.permissions p
where r.key = 'super_admin'
on conflict do nothing;

insert into buzzerhood.role_permissions (role_id, permission_id)
select r.id, p.id
from buzzerhood.roles r
join buzzerhood.permissions p on p.key in ('roles.read','organizations.read','organizations.manage','partners.read','partners.manage','campaigns.read','campaigns.manage','reports.read','billing.manage','users.read')
where r.key = 'admin'
on conflict do nothing;

insert into buzzerhood.role_permissions (role_id, permission_id)
select r.id, p.id
from buzzerhood.roles r
join buzzerhood.permissions p on p.key in ('partners.read','partners.manage','campaigns.read','campaigns.manage','reports.read')
where r.key = 'internal_team'
on conflict do nothing;
