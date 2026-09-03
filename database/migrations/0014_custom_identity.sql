-- 0014: Buzzerhood-owned identity and refresh-session foundation.
-- Existing shared auth.users rows are neither copied nor modified.

do $$
begin
  create type buzzerhood.user_status as enum ('active', 'pending_activation', 'suspended', 'disabled');
exception
  when duplicate_object then null;
end
$$;

create table if not exists buzzerhood.users (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  normalized_email text not null unique check (
    normalized_email = lower(btrim(normalized_email))
    and char_length(normalized_email) between 3 and 254
  ),
  password_hash text not null check (password_hash like '$argon2id$%'),
  status buzzerhood.user_status not null default 'pending_activation',
  email_verified_at timestamptz,
  password_changed_at timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table buzzerhood.profiles
  drop constraint if exists profiles_id_fkey;

alter table buzzerhood.profiles
  add column if not exists user_id uuid;

do $$
begin
  alter table buzzerhood.profiles
    add constraint profiles_user_id_fkey
    foreign key (user_id) references buzzerhood.users(id) on delete cascade;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table buzzerhood.profiles
    add constraint profiles_custom_identity_same_uuid_check
    check (user_id is null or user_id = id);
exception
  when duplicate_object then null;
end
$$;

create unique index if not exists profiles_user_id_unique_idx
  on buzzerhood.profiles(user_id)
  where user_id is not null;

create table if not exists buzzerhood.refresh_sessions (
  id uuid primary key,
  user_id uuid not null references buzzerhood.users(id) on delete cascade,
  family_id uuid not null,
  token_hash char(64) not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  parent_session_id uuid references buzzerhood.refresh_sessions(id) on delete set null,
  replaced_by_session_id uuid references buzzerhood.refresh_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  rotated_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  replay_detected_at timestamptz,
  check (expires_at > created_at),
  check (replaced_by_session_id is null or replaced_by_session_id <> id)
);

create index if not exists refresh_sessions_user_active_idx
  on buzzerhood.refresh_sessions(user_id, expires_at)
  where revoked_at is null;
create index if not exists refresh_sessions_family_idx
  on buzzerhood.refresh_sessions(family_id);

create table if not exists buzzerhood.auth_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references buzzerhood.users(id) on delete set null,
  session_id uuid references buzzerhood.refresh_sessions(id) on delete set null,
  event_type text not null check (event_type in (
    'login_succeeded', 'login_failed', 'refresh_rotated', 'refresh_replayed',
    'session_revoked', 'sessions_revoked', 'account_registered',
    'password_changed', 'account_status_changed'
  )),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists auth_security_events_user_created_idx
  on buzzerhood.auth_security_events(user_id, created_at desc);

drop trigger if exists set_users_updated_at on buzzerhood.users;
create trigger set_users_updated_at
before update on buzzerhood.users
for each row execute function buzzerhood.set_updated_at();

alter table buzzerhood.users enable row level security;
alter table buzzerhood.users force row level security;
alter table buzzerhood.refresh_sessions enable row level security;
alter table buzzerhood.refresh_sessions force row level security;
alter table buzzerhood.auth_security_events enable row level security;
alter table buzzerhood.auth_security_events force row level security;

revoke all on buzzerhood.users, buzzerhood.refresh_sessions, buzzerhood.auth_security_events from public;

insert into buzzerhood.schema_migrations(version, filename)
values ('0014', '0014_custom_identity.sql')
on conflict (version) do nothing;
