-- 0024: Admin password-reset delivery and constrained permanent user deletion.

create or replace function buzzerhood.admin_create_password_reset(input_user_id uuid,input_token_hash text,input_expires_at timestamptz)
returns table(user_id uuid,email text,display_name text) language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('users.manage') then raise exception 'permission denied'; end if;
  return query with target as (select u.id,u.email,p.display_name from buzzerhood.users u left join buzzerhood.profiles p on p.id=u.id where u.id=input_user_id and u.status='active' limit 1), revoked as (update buzzerhood.account_action_tokens t set used_at=now() from target where t.user_id=target.id and t.kind='password_reset' and t.used_at is null returning t.id), inserted as (insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) select target.id,'password_reset',input_token_hash,input_expires_at,actor_id from target returning user_id) select target.id,target.email,target.display_name from target;
end $$;

create or replace function buzzerhood.admin_delete_empty_user(input_user_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('users.manage') then raise exception 'permission denied'; end if;
  if input_user_id=actor_id then raise exception 'cannot delete own account'; end if;
  if not exists(select 1 from buzzerhood.users where id=input_user_id) then raise exception 'user not found'; end if;
  if exists(select 1 from buzzerhood.organization_members where profile_id=input_user_id or invited_by=input_user_id)
    or exists(select 1 from buzzerhood.partner_members where profile_id=input_user_id or invited_by=input_user_id)
    or exists(select 1 from buzzerhood.partner_claim_requests where claimant_profile_id=input_user_id or reviewed_by=input_user_id)
    or exists(select 1 from buzzerhood.partner_application_reviews where reviewed_by=input_user_id)
    or exists(select 1 from buzzerhood.campaigns where created_by=input_user_id)
    or exists(select 1 from buzzerhood.campaign_status_history where actor_id=input_user_id)
    or exists(select 1 from buzzerhood.campaign_activity_logs where actor_id=input_user_id)
    or exists(select 1 from buzzerhood.campaign_partner_assignments where invited_by=input_user_id)
    or exists(select 1 from buzzerhood.content_submissions where submitted_by=input_user_id)
    or exists(select 1 from buzzerhood.content_submission_reviews where reviewer_id=input_user_id)
    or exists(select 1 from buzzerhood.publications where submitted_by=input_user_id or verified_by=input_user_id)
    or exists(select 1 from buzzerhood.publication_metric_snapshots where recorded_by=input_user_id)
    or exists(select 1 from buzzerhood.public_partner_applications where reviewed_by=input_user_id or archived_by=input_user_id)
    or exists(select 1 from buzzerhood.account_action_tokens where created_by=input_user_id)
    or exists(select 1 from buzzerhood.user_roles where granted_by=input_user_id)
  then raise exception 'user has business or audit references'; end if;
  delete from buzzerhood.users where id=input_user_id;
  return input_user_id;
end $$;

revoke all on function buzzerhood.admin_create_password_reset(uuid,text,timestamptz),buzzerhood.admin_delete_empty_user(uuid) from public,anon,authenticated;
grant execute on function buzzerhood.admin_create_password_reset(uuid,text,timestamptz),buzzerhood.admin_delete_empty_user(uuid) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0024','0024_admin_user_lifecycle.sql') on conflict(version) do nothing;
