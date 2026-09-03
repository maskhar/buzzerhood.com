-- 0018: Backend B3 Campaign API context, workflow hardening, RLS, and least-privilege grants.

create or replace function buzzerhood.campaign_visible(target_campaign_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from buzzerhood.campaigns c
    where c.id=target_campaign_id and (
      buzzerhood.is_active_organization_member(c.organization_id)
      or buzzerhood.has_permission('campaigns.read')
      or exists(
        select 1 from buzzerhood.campaign_partner_assignments a
        where a.campaign_id=c.id and buzzerhood.is_active_partner_member(a.partner_id)
      )
    )
  )
$$;

create or replace function buzzerhood.campaign_assignment_visible(target_assignment_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from buzzerhood.campaign_partner_assignments a
    join buzzerhood.campaigns c on c.id=a.campaign_id
    where a.id=target_assignment_id and (
      buzzerhood.has_permission('campaigns.read')
      or buzzerhood.is_active_organization_member(c.organization_id)
      or buzzerhood.is_active_partner_member(a.partner_id)
    )
  )
$$;

create or replace function buzzerhood.campaign_deliverable_visible(target_deliverable_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from buzzerhood.campaign_deliverables d
    where d.id=target_deliverable_id and buzzerhood.campaign_assignment_visible(d.assignment_id)
  )
$$;

create or replace function buzzerhood.campaign_publication_visible(target_publication_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from buzzerhood.publications p
    where p.id=target_publication_id and buzzerhood.campaign_deliverable_visible(p.deliverable_id)
  )
$$;

create or replace function buzzerhood.create_campaign(input_organization_id uuid,input_name text,input_objective_summary text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if actor_id is null then raise exception 'authentication required'; end if;
  if not buzzerhood.is_active_organization_member(input_organization_id) then raise exception 'permission denied'; end if;
  if char_length(trim(input_name)) < 2 or char_length(trim(input_name)) > 180 then raise exception 'invalid campaign name'; end if;
  insert into buzzerhood.campaigns(organization_id,name,objective_summary,created_by)
  values(input_organization_id,trim(input_name),nullif(trim(input_objective_summary),''),actor_id) returning id into new_id;
  insert into buzzerhood.campaign_briefs(campaign_id,objective) values(new_id,nullif(trim(input_objective_summary),''));
  insert into buzzerhood.campaign_status_history(campaign_id,from_status,to_status,actor_id,reason) values(new_id,null,'draft',actor_id,'created');
  return new_id;
end $$;

create or replace function buzzerhood.transition_campaign(input_campaign_id uuid,input_to buzzerhood.campaign_status_v2,input_reason text default null)
returns buzzerhood.campaign_status_v2 language plpgsql security definer set search_path='' as $$
declare old buzzerhood.campaign_status_v2; org uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  select status,organization_id into old,org from buzzerhood.campaigns where id=input_campaign_id for update;
  if old is null then raise exception 'campaign not found'; end if;
  if not (buzzerhood.has_permission('campaigns.manage') or (input_to in ('submitted','draft') and buzzerhood.is_active_organization_member(org))) then raise exception 'permission denied'; end if;
  if not ((old='draft' and input_to='submitted') or (old='submitted' and input_to='internal_review') or (old='internal_review' and input_to in ('changes_requested','planning')) or (old='changes_requested' and input_to='draft') or (old='planning' and input_to='active') or (old='active' and input_to='publishing') or (old='publishing' and input_to='monitoring') or (old='monitoring' and input_to='reporting') or (old='reporting' and input_to='completed') or input_to in ('cancelled','archived')) then raise exception 'invalid campaign transition'; end if;
  update buzzerhood.campaigns set status=input_to,submitted_at=case when input_to='submitted' then now() else submitted_at end,completed_at=case when input_to='completed' then now() else completed_at end,cancelled_at=case when input_to='cancelled' then now() else cancelled_at end,cancellation_reason=case when input_to='cancelled' then nullif(trim(input_reason),'') else cancellation_reason end,updated_at=now() where id=input_campaign_id;
  insert into buzzerhood.campaign_status_history(campaign_id,from_status,to_status,actor_id,reason) values(input_campaign_id,old,input_to,actor_id,nullif(trim(input_reason),''));
  return input_to;
end $$;

create or replace function buzzerhood.invite_campaign_partner(input_campaign_id uuid,input_partner_id uuid,input_agreed_fee numeric default null,input_fee_currency text default null,input_rate_snapshot jsonb default null,input_internal_notes text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('campaigns.manage') then raise exception 'permission denied'; end if;
  if not exists(select 1 from buzzerhood.campaigns where id=input_campaign_id and status in ('planning','active')) then raise exception 'campaign not assignable'; end if;
  if not exists(select 1 from buzzerhood.partners p where p.id=input_partner_id and p.verification_status='approved' and exists(select 1 from buzzerhood.partner_members m where m.partner_id=p.id and m.status='active')) then raise exception 'partner not assignable'; end if;
  insert into buzzerhood.campaign_partner_assignments(campaign_id,partner_id,invited_by,agreed_fee,fee_currency,rate_snapshot,internal_notes)
  values(input_campaign_id,input_partner_id,actor_id,input_agreed_fee,upper(input_fee_currency),input_rate_snapshot,nullif(trim(input_internal_notes),'')) returning id into new_id;
  insert into buzzerhood.campaign_activity_logs(campaign_id,event_type,actor_id,metadata) values(input_campaign_id,'partner.invited',actor_id,jsonb_build_object('partner_id',input_partner_id,'assignment_id',new_id));
  return new_id;
end $$;

create or replace function buzzerhood.respond_campaign_assignment(input_assignment_id uuid,input_response text,input_reason text default null)
returns buzzerhood.campaign_assignment_status language plpgsql security definer set search_path='' as $$
declare current_status buzzerhood.campaign_assignment_status; target_partner uuid; next_status buzzerhood.campaign_assignment_status;
begin
  select status,partner_id into current_status,target_partner from buzzerhood.campaign_partner_assignments where id=input_assignment_id for update;
  if current_status is null or not buzzerhood.is_active_partner_member(target_partner) then raise exception 'assignment not found'; end if;
  if current_status <> 'invited' or input_response not in ('accepted','declined') then raise exception 'invalid assignment response'; end if;
  next_status:=input_response::buzzerhood.campaign_assignment_status;
  update buzzerhood.campaign_partner_assignments set status=next_status,responded_at=now(),accepted_at=case when next_status='accepted' then now() end,declined_reason=case when next_status='declined' then nullif(trim(input_reason),'') end,updated_at=now() where id=input_assignment_id;
  return next_status;
end $$;

create or replace function buzzerhood.create_campaign_deliverable(input_assignment_id uuid,input_title text,input_description text default null,input_platform text default null,input_due_date date default null,input_quantity integer default 1)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid;
begin
  if not buzzerhood.has_permission('campaigns.manage') then raise exception 'permission denied'; end if;
  if not exists(select 1 from buzzerhood.campaign_partner_assignments a join buzzerhood.campaigns c on c.id=a.campaign_id where a.id=input_assignment_id and a.status in ('invited','accepted','active') and c.status in ('planning','active')) then raise exception 'assignment not deliverable-ready'; end if;
  if char_length(trim(input_title)) < 2 or coalesce(input_quantity,1) < 1 then raise exception 'invalid deliverable'; end if;
  insert into buzzerhood.campaign_deliverables(assignment_id,title,description,platform,due_date,quantity)
  values(input_assignment_id,trim(input_title),nullif(trim(input_description),''),nullif(trim(input_platform),''),input_due_date,coalesce(input_quantity,1)) returning id into new_id;
  return new_id;
end $$;

create or replace function buzzerhood.submit_content_version(input_deliverable_id uuid,input_caption_body text,input_concept_notes text default null,input_asset_reference text default null,input_content_url text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare next_version integer; new_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if char_length(trim(coalesce(input_caption_body,''))) < 1 then raise exception 'invalid content submission'; end if;
  if not exists(select 1 from buzzerhood.campaign_deliverables d join buzzerhood.campaign_partner_assignments a on a.id=d.assignment_id where d.id=input_deliverable_id and d.status in ('planned','in_progress','revision_requested') and a.status in ('accepted','active') and buzzerhood.is_active_partner_member(a.partner_id)) then raise exception 'deliverable not submission-ready'; end if;
  perform pg_advisory_xact_lock(hashtextextended(input_deliverable_id::text,0));
  select coalesce(max(version),0)+1 into next_version from buzzerhood.content_submissions where deliverable_id=input_deliverable_id;
  insert into buzzerhood.content_submissions(deliverable_id,version,caption_body,concept_notes,asset_reference,content_url,submitted_by)
  values(input_deliverable_id,next_version,trim(input_caption_body),nullif(trim(input_concept_notes),''),nullif(trim(input_asset_reference),''),nullif(trim(input_content_url),''),actor_id) returning id into new_id;
  update buzzerhood.campaign_deliverables set status='draft_submitted',updated_at=now() where id=input_deliverable_id;
  return new_id;
end $$;

create or replace function buzzerhood.review_content_submission(input_submission_id uuid,input_context buzzerhood.content_review_context,input_decision buzzerhood.content_review_decision,input_note text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid; deliverable uuid; campaign_org uuid; deliverable_status buzzerhood.campaign_deliverable_status; actor_id uuid := buzzerhood.current_user_id();
begin
  select s.deliverable_id,c.organization_id,d.status into deliverable,campaign_org,deliverable_status
  from buzzerhood.content_submissions s join buzzerhood.campaign_deliverables d on d.id=s.deliverable_id join buzzerhood.campaign_partner_assignments a on a.id=d.assignment_id join buzzerhood.campaigns c on c.id=a.campaign_id
  where s.id=input_submission_id and s.version=(select max(latest.version) from buzzerhood.content_submissions latest where latest.deliverable_id=s.deliverable_id) for update of s,d;
  if deliverable is null then raise exception 'submission not reviewable'; end if;
  if input_context='internal' and (not buzzerhood.has_permission('campaigns.manage') or deliverable_status<>'draft_submitted') then raise exception 'content review not allowed'; end if;
  if input_context='client' and (not buzzerhood.is_active_organization_member(campaign_org) or deliverable_status<>'internal_approved') then raise exception 'content review not allowed'; end if;
  insert into buzzerhood.content_submission_reviews(submission_id,reviewer_id,reviewer_context,decision,note) values(input_submission_id,actor_id,input_context,input_decision,nullif(trim(input_note),'')) returning id into new_id;
  update buzzerhood.content_submissions set status=(case when input_decision='approved' then 'approved' when input_decision='revision_requested' then 'revision_requested' else 'rejected' end)::buzzerhood.submission_status where id=input_submission_id;
  update buzzerhood.campaign_deliverables set status=(case when input_decision='revision_requested' then 'revision_requested' when input_context='internal' and input_decision='approved' then 'internal_approved' when input_context='client' and input_decision='approved' then 'client_approved' else status::text end)::buzzerhood.campaign_deliverable_status,updated_at=now() where id=deliverable;
  return new_id;
end $$;

create or replace function buzzerhood.submit_publication(input_deliverable_id uuid,input_submission_id uuid,input_publication_url text,input_platform_account_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid; target_partner uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  select a.partner_id into target_partner from buzzerhood.campaign_deliverables d join buzzerhood.campaign_partner_assignments a on a.id=d.assignment_id
  where d.id=input_deliverable_id and d.status='client_approved' and a.status in ('accepted','active') and buzzerhood.is_active_partner_member(a.partner_id) for update of d;
  if target_partner is null then raise exception 'deliverable not publication-ready'; end if;
  if not exists(select 1 from buzzerhood.content_submissions s where s.id=input_submission_id and s.deliverable_id=input_deliverable_id and s.status='approved') then raise exception 'content not approved'; end if;
  if input_platform_account_id is not null and not exists(select 1 from buzzerhood.partner_platform_accounts where id=input_platform_account_id and partner_id=target_partner) then raise exception 'invalid platform account'; end if;
  insert into buzzerhood.publications(deliverable_id,content_submission_id,platform_account_id,publication_url,submitted_by)
  values(input_deliverable_id,input_submission_id,input_platform_account_id,trim(input_publication_url),actor_id) returning id into new_id;
  update buzzerhood.campaign_deliverables set status='published',updated_at=now() where id=input_deliverable_id;
  return new_id;
end $$;

create or replace function buzzerhood.verify_publication(input_publication_id uuid,input_decision buzzerhood.publication_status,input_note text default null)
returns buzzerhood.publication_status language plpgsql security definer set search_path='' as $$
declare deliverable uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if not buzzerhood.has_permission('campaigns.manage') then raise exception 'permission denied'; end if;
  if input_decision not in ('verified','rejected') then raise exception 'invalid publication decision'; end if;
  update buzzerhood.publications set status=input_decision,verified_by=actor_id,verified_at=now(),verification_note=nullif(trim(input_note),'') where id=input_publication_id and status='submitted' returning deliverable_id into deliverable;
  if deliverable is null then raise exception 'publication not verifiable'; end if;
  update buzzerhood.campaign_deliverables set status=(case when input_decision='verified' then 'verified' else status::text end)::buzzerhood.campaign_deliverable_status,updated_at=now() where id=deliverable;
  return input_decision;
end $$;

create or replace function buzzerhood.record_publication_metric(input_publication_id uuid,input_metric_type buzzerhood.metric_type,input_metric_value numeric,input_source text,input_period_start date default null,input_period_end date default null,input_note text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare new_id uuid; actor_id uuid := buzzerhood.current_user_id();
begin
  if not exists(select 1 from buzzerhood.publications p join buzzerhood.campaign_deliverables d on d.id=p.deliverable_id join buzzerhood.campaign_partner_assignments a on a.id=d.assignment_id where p.id=input_publication_id and p.status='verified' and (buzzerhood.has_permission('campaigns.manage') or buzzerhood.is_active_partner_member(a.partner_id))) then raise exception 'metric recording not allowed'; end if;
  insert into buzzerhood.publication_metric_snapshots(publication_id,metric_type,metric_value,period_start,period_end,source,recorded_by,verification_note)
  values(input_publication_id,input_metric_type,input_metric_value,input_period_start,input_period_end,trim(input_source),actor_id,nullif(trim(input_note),'')) returning id into new_id;
  return new_id;
end $$;

revoke all on function buzzerhood.campaign_visible(uuid),buzzerhood.campaign_assignment_visible(uuid),buzzerhood.campaign_deliverable_visible(uuid),buzzerhood.campaign_publication_visible(uuid),buzzerhood.create_campaign(uuid,text,text),buzzerhood.transition_campaign(uuid,buzzerhood.campaign_status_v2,text),buzzerhood.invite_campaign_partner(uuid,uuid,numeric,text,jsonb,text),buzzerhood.respond_campaign_assignment(uuid,text,text),buzzerhood.create_campaign_deliverable(uuid,text,text,text,date,integer),buzzerhood.submit_content_version(uuid,text,text,text,text),buzzerhood.review_content_submission(uuid,buzzerhood.content_review_context,buzzerhood.content_review_decision,text),buzzerhood.submit_publication(uuid,uuid,text,uuid),buzzerhood.verify_publication(uuid,buzzerhood.publication_status,text),buzzerhood.record_publication_metric(uuid,buzzerhood.metric_type,numeric,text,date,date,text) from public;
grant execute on function buzzerhood.campaign_visible(uuid),buzzerhood.campaign_assignment_visible(uuid),buzzerhood.campaign_deliverable_visible(uuid),buzzerhood.campaign_publication_visible(uuid),buzzerhood.create_campaign(uuid,text,text),buzzerhood.transition_campaign(uuid,buzzerhood.campaign_status_v2,text),buzzerhood.invite_campaign_partner(uuid,uuid,numeric,text,jsonb,text),buzzerhood.respond_campaign_assignment(uuid,text,text),buzzerhood.create_campaign_deliverable(uuid,text,text,text,date,integer),buzzerhood.submit_content_version(uuid,text,text,text,text),buzzerhood.review_content_submission(uuid,buzzerhood.content_review_context,buzzerhood.content_review_decision,text),buzzerhood.submit_publication(uuid,uuid,text,uuid),buzzerhood.verify_publication(uuid,buzzerhood.publication_status,text),buzzerhood.record_publication_metric(uuid,buzzerhood.metric_type,numeric,text,date,date,text) to authenticated,buzzerhood_app;

grant select on buzzerhood.services,buzzerhood.campaigns,buzzerhood.campaign_briefs,buzzerhood.campaign_partner_assignments,buzzerhood.campaign_deliverables,buzzerhood.content_submissions,buzzerhood.publications,buzzerhood.publication_metric_snapshots to buzzerhood_app;
grant update(name,objective_summary,planned_start,planned_end,estimated_budget,currency,updated_at) on buzzerhood.campaigns to buzzerhood_app;
grant update(objective,description,target_audience,key_message,call_to_action,content_direction,prohibited_content,notes,kpi_expectation,context,updated_at) on buzzerhood.campaign_briefs to buzzerhood_app;

drop policy if exists campaigns_app_read on buzzerhood.campaigns;
drop policy if exists campaigns_app_update on buzzerhood.campaigns;
drop policy if exists campaign_briefs_app_read on buzzerhood.campaign_briefs;
drop policy if exists campaign_briefs_app_update on buzzerhood.campaign_briefs;
drop policy if exists assignments_app_read on buzzerhood.campaign_partner_assignments;
drop policy if exists deliverables_app_read on buzzerhood.campaign_deliverables;
drop policy if exists submissions_app_read on buzzerhood.content_submissions;
drop policy if exists publications_app_read on buzzerhood.publications;
drop policy if exists publication_metrics_app_read on buzzerhood.publication_metric_snapshots;
drop policy if exists services_app_read on buzzerhood.services;

create policy campaigns_app_read on buzzerhood.campaigns for select to buzzerhood_app using(buzzerhood.campaign_visible(id));
create policy campaigns_app_update on buzzerhood.campaigns for update to buzzerhood_app using(buzzerhood.is_active_organization_member(organization_id) and status in ('draft','changes_requested')) with check(buzzerhood.is_active_organization_member(organization_id) and status in ('draft','changes_requested'));
create policy campaign_briefs_app_read on buzzerhood.campaign_briefs for select to buzzerhood_app using(buzzerhood.campaign_visible(campaign_id));
create policy campaign_briefs_app_update on buzzerhood.campaign_briefs for update to buzzerhood_app using(exists(select 1 from buzzerhood.campaigns c where c.id=campaign_id and c.status in ('draft','changes_requested') and buzzerhood.is_active_organization_member(c.organization_id))) with check(exists(select 1 from buzzerhood.campaigns c where c.id=campaign_id and c.status in ('draft','changes_requested') and buzzerhood.is_active_organization_member(c.organization_id)));
create policy assignments_app_read on buzzerhood.campaign_partner_assignments for select to buzzerhood_app using(buzzerhood.campaign_assignment_visible(id));
create policy deliverables_app_read on buzzerhood.campaign_deliverables for select to buzzerhood_app using(buzzerhood.campaign_deliverable_visible(id));
create policy submissions_app_read on buzzerhood.content_submissions for select to buzzerhood_app using(buzzerhood.campaign_deliverable_visible(deliverable_id));
create policy publications_app_read on buzzerhood.publications for select to buzzerhood_app using(buzzerhood.campaign_deliverable_visible(deliverable_id));
create policy publication_metrics_app_read on buzzerhood.publication_metric_snapshots for select to buzzerhood_app using(buzzerhood.campaign_publication_visible(publication_id));
create policy services_app_read on buzzerhood.services for select to buzzerhood_app using(is_active or buzzerhood.has_permission('campaigns.manage'));

insert into buzzerhood.schema_migrations(version,filename)
values('0018','0018_backend_campaign_api.sql') on conflict(version) do nothing;
