-- 0030: Allow a reviewed Partner invitation to be reissued without duplicating identity.
drop function buzzerhood.create_partner_invitation(uuid,text,timestamptz);
create function buzzerhood.create_partner_invitation(input_application_id uuid,input_token_hash text,input_expires_at timestamptz)
returns table(user_id uuid,partner_id uuid,email text,display_name text,invitation_required boolean,account_active boolean) language plpgsql security definer set search_path='' as $$
declare
  actor_id uuid:=buzzerhood.current_user_id();
  app buzzerhood.public_partner_applications%rowtype;
  existing_partner_id uuid;
  existing_user_id uuid;
  existing_user_status buzzerhood.user_status;
  existing_member_status buzzerhood.membership_status;
  new_user_id uuid:=gen_random_uuid();
  new_partner_id uuid:=gen_random_uuid();
begin
  if not buzzerhood.has_permission('partners.manage') then raise exception 'permission denied'; end if;
  select * into app from buzzerhood.public_partner_applications where id=input_application_id and status='approved' and archived_at is null for update;
  if not found then raise exception 'approved public partner application not found'; end if;

  if app.partner_id is not null then
    select users.id,users.status,members.status into existing_user_id,existing_user_status,existing_member_status
    from buzzerhood.partner_members members
    join buzzerhood.profiles profiles on profiles.id=members.profile_id
    join buzzerhood.users users on users.id=profiles.user_id
    where members.partner_id=app.partner_id and members.role='owner'
    order by members.created_at limit 1 for update of users,members;
    if existing_user_id is null then raise exception 'partner identity requires manual review'; end if;
    if existing_user_status='active' and existing_member_status='active' then
      return query select existing_user_id,app.partner_id,app.email,app.full_name,false,true;
      return;
    end if;
    if existing_user_status<>'pending_activation' or existing_member_status<>'invited' then raise exception 'partner identity requires manual review'; end if;
    update buzzerhood.account_action_tokens tokens set used_at=coalesce(tokens.used_at,now()) where tokens.user_id=existing_user_id and kind='partner_invitation' and used_at is null;
    insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) values(existing_user_id,'partner_invitation',input_token_hash,input_expires_at,actor_id);
    return query select existing_user_id,app.partner_id,app.email,app.full_name,true,false;
    return;
  end if;

  select previous.partner_id into existing_partner_id
  from buzzerhood.public_partner_applications previous
  join buzzerhood.partners partner on partner.id=previous.partner_id
  where previous.id<>app.id and previous.status='approved' and previous.archived_at is not null and partner.archived_at is not null and previous.normalized_email=app.normalized_email and previous.normalized_whatsapp=app.normalized_whatsapp
  limit 1;
  if existing_partner_id is not null then
    select users.id,users.status,members.status into existing_user_id,existing_user_status,existing_member_status
    from buzzerhood.partner_members members
    join buzzerhood.profiles profiles on profiles.id=members.profile_id
    join buzzerhood.users users on users.id=profiles.user_id
    where members.partner_id=existing_partner_id and members.role='owner'
    order by members.created_at limit 1 for update of users,members;
    if existing_user_id is null or existing_user_status in ('suspended','disabled') then raise exception 'archived partner account requires manual review'; end if;
    update buzzerhood.partners set display_name=app.full_name,partner_type=app.category,category=app.category,location=app.city,bio=app.message,archived_at=null,archived_by=null,updated_at=now() where id=existing_partner_id;
    update buzzerhood.public_partner_applications set partner_id=existing_partner_id,updated_at=now() where id=app.id;
    if existing_user_status='active' and existing_member_status in ('active','suspended') then
      update buzzerhood.partner_members members set status='active',joined_at=coalesce(joined_at,now()),updated_at=now() where members.partner_id=existing_partner_id and members.profile_id=existing_user_id and status='suspended';
      return query select existing_user_id,existing_partner_id,app.email,app.full_name,false,true;
      return;
    end if;
    if existing_user_status<>'pending_activation' or existing_member_status not in ('suspended','invited') then raise exception 'archived partner account requires manual review'; end if;
    update buzzerhood.partner_members members set status='invited',updated_at=now() where members.partner_id=existing_partner_id and members.profile_id=existing_user_id and status='suspended';
    update buzzerhood.account_action_tokens tokens set used_at=coalesce(tokens.used_at,now()) where tokens.user_id=existing_user_id and kind='partner_invitation' and used_at is null;
    insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) values(existing_user_id,'partner_invitation',input_token_hash,input_expires_at,actor_id);
    return query select existing_user_id,existing_partner_id,app.email,app.full_name,true,false;
    return;
  end if;

  if exists(select 1 from buzzerhood.users users where users.normalized_email=app.normalized_email) then raise exception 'email already registered'; end if;
  insert into buzzerhood.users(id,email,normalized_email,password_hash,status) values(new_user_id,app.email,app.normalized_email,'$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','pending_activation');
  insert into buzzerhood.profiles(id,user_id,display_name) values(new_user_id,new_user_id,app.full_name);
  insert into buzzerhood.partners(id,display_name,partner_kind,partner_type,category,location,bio,verification_status,is_public,source_data) values(new_partner_id,app.full_name,'individual',app.category,app.category,app.city,app.message,'approved',false,jsonb_build_object('public_partner_application_id',app.id));
  insert into buzzerhood.partner_members(partner_id,profile_id,role,status,invited_by) values(new_partner_id,new_user_id,'owner','invited',actor_id);
  insert into buzzerhood.account_action_tokens(user_id,kind,token_hash,expires_at,created_by) values(new_user_id,'partner_invitation',input_token_hash,input_expires_at,actor_id);
  update buzzerhood.public_partner_applications set partner_id=new_partner_id,updated_at=now() where id=app.id;
  return query select new_user_id,new_partner_id,app.email,app.full_name,true,false;
end $$;
revoke all on function buzzerhood.create_partner_invitation(uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function buzzerhood.create_partner_invitation(uuid,text,timestamptz) to buzzerhood_app;
insert into buzzerhood.schema_migrations(version,filename) values('0030','0030_partner_invitation_resend.sql') on conflict(version) do nothing;
