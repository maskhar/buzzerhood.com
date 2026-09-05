-- 0019: Public website partner applications. Applied only through reviewed migration tooling.

create table if not exists buzzerhood.public_partner_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  email text not null check (char_length(trim(email)) between 3 and 254),
  whatsapp text not null check (char_length(trim(whatsapp)) between 7 and 40),
  city text not null check (char_length(trim(city)) between 2 and 160),
  category text not null check (category in ('media','influencer','komunitas','buzzer')),
  message text null check (message is null or char_length(message) <= 2000),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text null check (review_note is null or char_length(review_note) <= 2000),
  reviewed_by uuid null references buzzerhood.profiles(id),
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_partner_applications_status_created_idx on buzzerhood.public_partner_applications(status, created_at desc);
create index if not exists public_partner_applications_email_created_idx on buzzerhood.public_partner_applications(email, created_at desc);

alter table buzzerhood.public_partner_applications enable row level security;
alter table buzzerhood.public_partner_applications force row level security;

create policy public_partner_applications_app_read on buzzerhood.public_partner_applications
  for select to buzzerhood_app using (buzzerhood.current_user_id() is null or buzzerhood.has_permission('partners.manage'));
create policy public_partner_applications_app_insert on buzzerhood.public_partner_applications
  for insert to buzzerhood_app with check (true);
create policy public_partner_applications_app_update on buzzerhood.public_partner_applications
  for update to buzzerhood_app using (buzzerhood.has_permission('partners.manage')) with check (buzzerhood.has_permission('partners.manage'));

create or replace function buzzerhood.review_public_partner_application(input_application_id uuid,input_decision text,input_review_note text default null)
returns uuid language plpgsql set search_path = '' as $$
declare actor_id uuid := buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  if input_decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
  perform 1 from buzzerhood.public_partner_applications where id=input_application_id and status='pending' for update;
  if not found then raise exception 'pending public partner application not found'; end if;
  update buzzerhood.public_partner_applications
  set status=input_decision,reviewed_by=actor_id,reviewed_at=now(),review_note=nullif(trim(input_review_note),''),updated_at=now()
  where id=input_application_id;
  return input_application_id;
end $$;

revoke all on table buzzerhood.public_partner_applications from public, anon, authenticated;
revoke all on function buzzerhood.review_public_partner_application(uuid,text,text) from public, anon, authenticated;
grant select, insert, update(status, review_note, reviewed_by, reviewed_at, updated_at) on table buzzerhood.public_partner_applications to buzzerhood_app;
grant execute on function buzzerhood.review_public_partner_application(uuid,text,text) to buzzerhood_app;

insert into buzzerhood.schema_migrations(version,filename)
values('0019','0019_public_partner_applications.sql') on conflict(version) do nothing;
