-- 0002: auth profile, RBAC reference tables, organizations, and memberships.
create table if not exists buzzerhood.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists buzzerhood.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  scope text not null check (scope in ('system', 'organization')),
  created_at timestamptz not null default now()
);

create table if not exists buzzerhood.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists buzzerhood.role_permissions (
  role_id uuid not null references buzzerhood.roles(id) on delete cascade,
  permission_id uuid not null references buzzerhood.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists buzzerhood.user_roles (
  profile_id uuid not null references buzzerhood.profiles(id) on delete cascade,
  role_id uuid not null references buzzerhood.roles(id) on delete cascade,
  granted_by uuid references buzzerhood.profiles(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (profile_id, role_id)
);

create table if not exists buzzerhood.organizations (
  id uuid primary key default gen_random_uuid(),
  kind buzzerhood.organization_kind not null,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists buzzerhood.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references buzzerhood.organizations(id) on delete cascade,
  profile_id uuid not null references buzzerhood.profiles(id) on delete cascade,
  role buzzerhood.membership_role not null default 'member',
  status buzzerhood.membership_status not null default 'invited',
  invited_by uuid references buzzerhood.profiles(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index if not exists profiles_created_at_idx on buzzerhood.profiles(created_at);
create index if not exists user_roles_profile_active_idx on buzzerhood.user_roles(profile_id) where revoked_at is null;
create index if not exists role_permissions_permission_idx on buzzerhood.role_permissions(permission_id);
create index if not exists organizations_kind_idx on buzzerhood.organizations(kind);
create index if not exists organization_members_profile_status_idx on buzzerhood.organization_members(profile_id, status);
create index if not exists organization_members_organization_status_idx on buzzerhood.organization_members(organization_id, status);
