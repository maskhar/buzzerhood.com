-- 0006: Buzzerhood-owned migration state because current self-hosted instance has no compatible migration metadata table.
create table if not exists buzzerhood.schema_migrations (
  version text primary key,
  filename text not null unique,
  applied_at timestamptz not null default now()
);

alter table buzzerhood.schema_migrations enable row level security;
alter table buzzerhood.schema_migrations force row level security;

insert into buzzerhood.schema_migrations (version, filename) values
  ('0001', '0001_create_buzzerhood_schema.sql'),
  ('0002', '0002_identity_rbac_organizations.sql'),
  ('0003', '0003_partner_foundation.sql'),
  ('0004', '0004_security_functions_rls.sql'),
  ('0005', '0005_seed_rbac_reference.sql'),
  ('0006', '0006_migration_tracking.sql')
on conflict (version) do nothing;
