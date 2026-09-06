-- 0026: Fix ambiguous actor references in constrained permanent user deletion.

create or replace function buzzerhood.admin_delete_empty_user(input_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  current_actor_id uuid:=buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('users.manage') then raise exception 'permission denied'; end if;
  if input_user_id=current_actor_id then raise exception 'cannot delete own account'; end if;
  if not exists(select 1 from buzzerhood.users u where u.id=input_user_id) then raise exception 'user not found'; end if;

  if exists(select 1 from buzzerhood.organization_members om where om.profile_id=input_user_id or om.invited_by=input_user_id)
    or exists(select 1 from buzzerhood.partner_members pm where pm.profile_id=input_user_id or pm.invited_by=input_user_id)
    or exists(select 1 from buzzerhood.partner_claim_requests pcr where pcr.claimant_profile_id=input_user_id or pcr.reviewed_by=input_user_id)
    or exists(select 1 from buzzerhood.partner_application_reviews par where par.reviewed_by=input_user_id)
    or exists(select 1 from buzzerhood.campaigns c where c.created_by=input_user_id)
    or exists(select 1 from buzzerhood.campaign_status_history csh where csh.actor_id=input_user_id)
    or exists(select 1 from buzzerhood.campaign_activity_logs cal where cal.actor_id=input_user_id)
    or exists(select 1 from buzzerhood.campaign_partner_assignments cpa where cpa.invited_by=input_user_id)
    or exists(select 1 from buzzerhood.content_submissions cs where cs.submitted_by=input_user_id)
    or exists(select 1 from buzzerhood.content_submission_reviews csr where csr.reviewer_id=input_user_id)
    or exists(select 1 from buzzerhood.publications p where p.submitted_by=input_user_id or p.verified_by=input_user_id)
    or exists(select 1 from buzzerhood.publication_metric_snapshots pms where pms.recorded_by=input_user_id)
    or exists(select 1 from buzzerhood.public_partner_applications ppa where ppa.reviewed_by=input_user_id or ppa.archived_by=input_user_id)
    or exists(select 1 from buzzerhood.account_action_tokens aat where aat.created_by=input_user_id)
    or exists(select 1 from buzzerhood.user_roles ur where ur.granted_by=input_user_id)
  then raise exception 'user has business or audit references'; end if;

  delete from buzzerhood.users u where u.id=input_user_id;
  return input_user_id;
end $$;

revoke all on function buzzerhood.admin_delete_empty_user(uuid) from public,anon,authenticated;
grant execute on function buzzerhood.admin_delete_empty_user(uuid) to buzzerhood_app;

insert into buzzerhood.schema_migrations(version,filename)
values('0026','0026_fix_admin_user_delete.sql')
on conflict(version) do nothing;
