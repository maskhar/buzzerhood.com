-- 0011: production compatibility for expanded Phase 3C review API.
create or replace function buzzerhood.review_partner_application(input_partner_id uuid, input_decision text, input_review_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  if input_decision not in ('approved','rejected') then raise exception 'invalid decision'; end if;
  perform 1 from buzzerhood.partners where id=input_partner_id and verification_status='pending' for update;
  if not found then raise exception 'pending partner not found'; end if;
  update buzzerhood.partners set verification_status=input_decision,is_public=(input_decision='approved'),updated_at=now() where id=input_partner_id;
  update buzzerhood.partner_members set status=case when input_decision='approved' then 'active'::buzzerhood.membership_status else 'removed'::buzzerhood.membership_status end,joined_at=case when input_decision='approved' then coalesce(joined_at,now()) else joined_at end,updated_at=now() where partner_id=input_partner_id and status='invited';
  insert into buzzerhood.partner_application_reviews(partner_id,decision,reviewed_by,review_note) values(input_partner_id,input_decision,auth.uid(),nullif(trim(input_review_note),''));
  return input_partner_id;
end; $$;
create or replace function buzzerhood.reject_partner_claim(input_claim_id uuid, input_review_note text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claim_partner_id uuid;
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  update buzzerhood.partner_claim_requests set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),review_note=nullif(trim(input_review_note),''),updated_at=now() where id=input_claim_id and status='pending' returning partner_id into claim_partner_id;
  if claim_partner_id is null then raise exception 'pending claim not found'; end if;
  return claim_partner_id;
end; $$;
revoke all on function buzzerhood.review_partner_application(uuid,text,text), buzzerhood.reject_partner_claim(uuid,text) from public;
grant execute on function buzzerhood.review_partner_application(uuid,text,text), buzzerhood.reject_partner_claim(uuid,text) to authenticated;
insert into buzzerhood.schema_migrations(version,filename) values('0011','0011_review_api_compatibility.sql') on conflict(version) do nothing;
