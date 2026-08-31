-- Phase 2: one adult account can manage self, child and dependent profiles.
create type public.profile_relationship as enum ('self','child','dependent');
create type public.organ_donor_status as enum ('not_declared','yes','no','unknown');

alter table public.emergency_profiles drop constraint emergency_profiles_user_id_key;
alter table public.emergency_profiles
  add column subject_relationship public.profile_relationship not null default 'self',
  add column responsibility_confirmed_at timestamptz,
  add column photo_path text check(photo_path is null or char_length(photo_path)<=500),
  add column transfusion_preference text check(char_length(transfusion_preference)<=300),
  add column resuscitation_preference text check(char_length(resuscitation_preference)<=300),
  add column organ_donor_status public.organ_donor_status not null default 'not_declared',
  add column organ_donor_notes text check(char_length(organ_donor_notes)<=300),
  add column preferred_language text check(char_length(preferred_language)<=40);

alter table public.emergency_profiles add constraint dependent_responsibility_confirmation
  check(subject_relationship='self' or responsibility_confirmed_at is not null);
create unique index one_self_profile_per_account on public.emergency_profiles(user_id) where subject_relationship='self';

create function private.validate_emergency_profile() returns trigger language plpgsql set search_path='' as $$
declare v_key text;v_allowed constant text[]:=array['preferred_name','photo','age','pronouns','blood_type','allergies','conditions','medications','support_needs','medical_devices','transfusion_preference','resuscitation_preference','organ_donor_status','preferred_language','health_plan_name','other_guidance','contacts'];
begin
  if new.birth_date is not null and new.birth_date>current_date then raise exception 'birth_date_in_future' using errcode='check_violation';end if;
  for v_key in select jsonb_object_keys(new.visibility) loop
    if not(v_key=any(v_allowed)) or jsonb_typeof(new.visibility->v_key)<>'boolean' then raise exception 'invalid_visibility' using errcode='check_violation';end if;
  end loop;
  return new;
end $$;
revoke all on function private.validate_emergency_profile() from public,anon,authenticated;
create trigger validate_emergency_profile before insert or update of birth_date,visibility on public.emergency_profiles for each row execute function private.validate_emergency_profile();
alter table public.emergency_contacts add constraint emergency_contacts_sort_order_check check(sort_order between 0 and 2);

create function private.enforce_three_contacts() returns trigger language plpgsql set search_path='' as $$
begin
  if (select count(*) from public.emergency_contacts where emergency_profile_id=new.emergency_profile_id and id<>new.id)>=3 then
    raise exception 'contact_limit_reached' using errcode='check_violation';
  end if;
  return new;
end $$;
revoke all on function private.enforce_three_contacts() from public,anon,authenticated;
create trigger enforce_three_contacts before insert or update of emergency_profile_id on public.emergency_contacts for each row execute function private.enforce_three_contacts();

alter table public.consent_events add column emergency_profile_id uuid references public.emergency_profiles(id) on delete cascade;
update public.consent_events c set emergency_profile_id=(select e.id from public.emergency_profiles e where e.user_id=c.user_id order by e.id limit 1) where emergency_profile_id is null;
create index consent_events_profile_id_idx on public.consent_events(emergency_profile_id) where emergency_profile_id is not null;

alter table private.products add column emergency_profile_id uuid references public.emergency_profiles(id) on delete set null;
update private.products p set emergency_profile_id=(select e.id from public.emergency_profiles e where e.user_id=p.owner_id order by e.id limit 1) where p.owner_id is not null;
create index products_emergency_profile_id_idx on private.products(emergency_profile_id) where emergency_profile_id is not null;

alter table public.user_products add column emergency_profile_id uuid references public.emergency_profiles(id) on delete cascade;
update public.user_products u set emergency_profile_id=(select p.emergency_profile_id from private.products p where p.id=u.product_id);
create index user_products_emergency_profile_id_idx on public.user_products(emergency_profile_id) where emergency_profile_id is not null;

alter table public.emergency_profiles drop constraint emergency_profiles_check;
alter table public.emergency_profiles add constraint emergency_profile_publication_state
  check((status='published' and published_at is not null) or (status<>'published' and published_at is null));

drop policy emergency_profiles_insert on public.emergency_profiles;
create policy emergency_profiles_insert on public.emergency_profiles for insert to authenticated
  with check((select auth.uid())=user_id and (subject_relationship='self' or responsibility_confirmed_at is not null));

revoke insert on public.emergency_profiles from authenticated;
grant insert(user_id,preferred_name,birth_date,pronouns,blood_type,allergies,conditions,medications,support_needs,medical_devices,health_plan_name,other_guidance,visibility,subject_relationship,responsibility_confirmed_at,photo_path,transfusion_preference,resuscitation_preference,organ_donor_status,organ_donor_notes,preferred_language)
  on public.emergency_profiles to authenticated;
revoke update on public.emergency_profiles from authenticated;
grant update(preferred_name,birth_date,pronouns,blood_type,allergies,conditions,medications,support_needs,medical_devices,health_plan_name,other_guidance,visibility,updated_at,photo_path,transfusion_preference,resuscitation_preference,organ_donor_status,organ_donor_notes,preferred_language)
  on public.emergency_profiles to authenticated;

create function public.server_publish_emergency_profile(p_profile_id uuid,p_sensitive_version text,p_publication_version text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=(select auth.uid());v_now timestamptz:=clock_timestamp();v_profile public.emergency_profiles;v_authorized_fields jsonb;
begin
  if v_user_id is null or char_length(p_sensitive_version) not between 1 and 40 or char_length(p_publication_version) not between 1 and 40 then return false;end if;
  select * into v_profile from public.emergency_profiles where id=p_profile_id and user_id=v_user_id for update;
  if not found or not exists(select 1 from private.products where emergency_profile_id=p_profile_id and owner_id=v_user_id and status='active') then return false;end if;
  if coalesce(v_profile.preferred_name,'')='' or not(v_profile.visibility@>'{"preferred_name":true}'::jsonb) then return false;end if;
  if not(
    (v_profile.visibility@>'{"allergies":true}'::jsonb and coalesce(v_profile.allergies,'')<>'') or
    (v_profile.visibility@>'{"conditions":true}'::jsonb and coalesce(v_profile.conditions,'')<>'') or
    (v_profile.visibility@>'{"medications":true}'::jsonb and coalesce(v_profile.medications,'')<>'') or
    (v_profile.visibility@>'{"support_needs":true}'::jsonb and coalesce(v_profile.support_needs,'')<>'') or
    (v_profile.visibility@>'{"medical_devices":true}'::jsonb and coalesce(v_profile.medical_devices,'')<>'') or
    (v_profile.visibility@>'{"contacts":true}'::jsonb and exists(select 1 from public.emergency_contacts where emergency_profile_id=p_profile_id and user_id=v_user_id and is_public=true))
  ) then return false;end if;
  select coalesce(jsonb_agg(key order by key),'[]'::jsonb) into v_authorized_fields from jsonb_each(v_profile.visibility) where value='true'::jsonb;
  update public.emergency_profiles set status='published',published_at=v_now,updated_at=v_now where id=p_profile_id;
  insert into public.consent_events(user_id,emergency_profile_id,event_type,document_version,purpose,authorized_fields)
    values(v_user_id,p_profile_id,'sensitive_data_consent',p_sensitive_version,'Tratamento de dados sensíveis',v_authorized_fields),
          (v_user_id,p_profile_id,'publication_authorization',p_publication_version,'Publicação do perfil de emergência',v_authorized_fields);
  return true;
end $$;
revoke all on function public.server_publish_emergency_profile(uuid,text,text) from public,anon;
grant execute on function public.server_publish_emergency_profile(uuid,text,text) to authenticated;

create function public.server_hide_emergency_profile(p_profile_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=(select auth.uid());v_updated integer;
begin
  if v_user_id is null then return false;end if;
  update public.emergency_profiles set status='hidden',published_at=null,updated_at=clock_timestamp() where id=p_profile_id and user_id=v_user_id;
  get diagnostics v_updated=row_count;
  if v_updated=1 then insert into public.consent_events(user_id,emergency_profile_id,event_type,document_version,purpose,authorized_fields,revoked_at)
    values(v_user_id,p_profile_id,'publication_revoked','publication-v1','Ocultação do perfil','[]',clock_timestamp());end if;
  return v_updated=1;
end $$;
revoke all on function public.server_hide_emergency_profile(uuid) from public,anon;
grant execute on function public.server_hide_emergency_profile(uuid) to authenticated;

create function public.server_block_my_product(p_product_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=(select auth.uid());v_updated integer;v_now timestamptz:=clock_timestamp();
begin
  if v_user_id is null then return false;end if;
  update private.products set status='blocked',updated_at=v_now where id=p_product_id and owner_id=v_user_id and status='active';
  get diagnostics v_updated=row_count;
  if v_updated=1 then
    update public.user_products set status='blocked',updated_at=v_now where product_id=p_product_id and user_id=v_user_id;
    insert into private.product_events(product_id,actor_user_id,event_type) values(p_product_id,v_user_id,'blocked');
  end if;
  return v_updated=1;
end $$;
revoke all on function public.server_block_my_product(uuid) from public,anon;
grant execute on function public.server_block_my_product(uuid) to authenticated;

alter table private.product_events drop constraint product_events_event_type_check;
alter table private.product_events add constraint product_events_event_type_check check(event_type in('activated','blocked'));

drop function public.server_activate_product(uuid,text,text,bytea);
create function public.server_activate_product(p_user_id uuid,p_profile_id uuid,p_public_code text,p_activation_secret text,p_origin_hash bytea)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_product private.products;v_now timestamptz:=clock_timestamp();v_user_attempts integer;v_origin_attempts integer;
begin
  if p_user_id is null or p_profile_id is null or not exists(select 1 from public.emergency_profiles where id=p_profile_id and user_id=p_user_id)
    or p_origin_hash is null or octet_length(p_origin_hash)<>32 or p_public_code!~'^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$'
    or char_length(p_activation_secret) not between 12 and 256 then return null;end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(encode(p_origin_hash,'hex'),1));
  select count(*)into v_user_attempts from private.activation_attempts where user_id=p_user_id and created_at>=v_now-interval'15 minutes';
  select count(*)into v_origin_attempts from private.activation_attempts where origin_hash=p_origin_hash and created_at>=v_now-interval'15 minutes';
  if v_user_attempts>=5 or v_origin_attempts>=20 then insert into private.activation_attempts(user_id,origin_hash,succeeded,reason)values(p_user_id,p_origin_hash,false,'rate_limited');return null;end if;
  select * into v_product from private.products where public_code=p_public_code for update;
  if not found or v_product.status<>'available' or extensions.crypt(p_activation_secret,v_product.activation_secret_hash)<>v_product.activation_secret_hash then insert into private.activation_attempts(user_id,origin_hash,succeeded,reason)values(p_user_id,p_origin_hash,false,'invalid');return null;end if;
  update private.products set owner_id=p_user_id,emergency_profile_id=p_profile_id,status='active',activated_at=v_now,activation_secret_hash=encode(extensions.gen_random_bytes(32),'hex'),updated_at=v_now where id=v_product.id;
  insert into public.user_products(product_id,user_id,emergency_profile_id,public_code,status,activated_at,updated_at)values(v_product.id,p_user_id,p_profile_id,v_product.public_code,'active',v_now,v_now);
  insert into private.product_events(product_id,actor_user_id,event_type)values(v_product.id,p_user_id,'activated');
  insert into private.activation_attempts(user_id,origin_hash,succeeded,reason)values(p_user_id,p_origin_hash,true,'activated');
  return v_product.id;
end $$;
revoke all on function public.server_activate_product(uuid,uuid,text,text,bytea) from public,anon,authenticated;
grant execute on function public.server_activate_product(uuid,uuid,text,text,bytea) to service_role;

drop function public.server_get_emergency_profile(text,bytea,bytea,text,boolean);
create function public.server_get_emergency_profile(p_code text,p_token_hash bytea,p_origin_hash bytea,p_mode text,p_captcha_verified boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_attempts integer;v_product private.products;v_profile public.emergency_profiles;v_result jsonb;v_contacts jsonb;
begin
 if p_origin_hash is null or octet_length(p_origin_hash)<>32 or p_mode not in('code','nfc')or(p_mode='code'and(p_code is null or p_code!~'^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$'))or(p_mode='nfc'and(p_token_hash is null or octet_length(p_token_hash)<>32))then return null;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(encode(p_origin_hash,'hex')||p_mode,2));
 select count(*)into v_attempts from private.emergency_lookup_attempts where origin_hash=p_origin_hash and lookup_mode=p_mode and created_at>=now()-interval'10 minutes';
 if(p_mode='code'and v_attempts>=20)or(p_mode='nfc'and v_attempts>=60)then insert into private.emergency_lookup_attempts(origin_hash,lookup_mode,succeeded,outcome)values(p_origin_hash,p_mode,false,'rate_limited');return null;end if;
 if p_mode='code'and v_attempts>=3 and not p_captcha_verified then insert into private.emergency_lookup_attempts(origin_hash,lookup_mode,succeeded,outcome)values(p_origin_hash,p_mode,false,'captcha_required');return jsonb_build_object('captcha_required',true);end if;
 select * into v_product from private.products where status='active'and((p_mode='code'and public_code=p_code)or(p_mode='nfc'and nfc_token_hash=p_token_hash))limit 1;
 if not found or v_product.emergency_profile_id is null then insert into private.emergency_lookup_attempts(origin_hash,lookup_mode,succeeded,outcome)values(p_origin_hash,p_mode,false,'unavailable');return null;end if;
 select * into v_profile from public.emergency_profiles where id=v_product.emergency_profile_id and status='published';
 if not found then insert into private.emergency_lookup_attempts(origin_hash,lookup_mode,succeeded,outcome)values(p_origin_hash,p_mode,false,'unavailable');return null;end if;
 if v_profile.visibility@>'{"contacts":true}'::jsonb then select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('name',c.name,'relationship',c.relationship,'phone',c.phone))order by c.sort_order,c.created_at),'[]'::jsonb)into v_contacts from public.emergency_contacts c where c.emergency_profile_id=v_profile.id and c.user_id=v_profile.user_id and c.is_public=true;else v_contacts:='[]'::jsonb;end if;
 v_result:=jsonb_strip_nulls(jsonb_build_object('preferredName',case when v_profile.visibility@>'{"preferred_name":true}'::jsonb then v_profile.preferred_name end,'photoPath',case when v_profile.visibility@>'{"photo":true}'::jsonb then v_profile.photo_path end,'age',case when v_profile.visibility@>'{"age":true}'::jsonb and v_profile.birth_date is not null then date_part('year',age(current_date,v_profile.birth_date))::int end,'pronouns',case when v_profile.visibility@>'{"pronouns":true}'::jsonb then v_profile.pronouns end,'bloodType',case when v_profile.visibility@>'{"blood_type":true}'::jsonb then v_profile.blood_type end,'allergies',case when v_profile.visibility@>'{"allergies":true}'::jsonb then v_profile.allergies end,'conditions',case when v_profile.visibility@>'{"conditions":true}'::jsonb then v_profile.conditions end,'medications',case when v_profile.visibility@>'{"medications":true}'::jsonb then v_profile.medications end,'supportNeeds',case when v_profile.visibility@>'{"support_needs":true}'::jsonb then v_profile.support_needs end,'medicalDevices',case when v_profile.visibility@>'{"medical_devices":true}'::jsonb then v_profile.medical_devices end,'transfusionPreference',case when v_profile.visibility@>'{"transfusion_preference":true}'::jsonb then v_profile.transfusion_preference end,'resuscitationPreference',case when v_profile.visibility@>'{"resuscitation_preference":true}'::jsonb then v_profile.resuscitation_preference end,'organDonorStatus',case when v_profile.visibility@>'{"organ_donor_status":true}'::jsonb then v_profile.organ_donor_status::text end,'organDonorNotes',case when v_profile.visibility@>'{"organ_donor_status":true}'::jsonb then v_profile.organ_donor_notes end,'preferredLanguage',case when v_profile.visibility@>'{"preferred_language":true}'::jsonb then v_profile.preferred_language end,'healthPlanName',case when v_profile.visibility@>'{"health_plan_name":true}'::jsonb then v_profile.health_plan_name end,'otherGuidance',case when v_profile.visibility@>'{"other_guidance":true}'::jsonb then v_profile.other_guidance end,'contacts',v_contacts,'updatedAt',v_profile.updated_at));
 insert into private.emergency_lookup_attempts(origin_hash,lookup_mode,succeeded,outcome)values(p_origin_hash,p_mode,true,'found');return v_result;
end $$;
revoke all on function public.server_get_emergency_profile(text,bytea,bytea,text,boolean) from public,anon,authenticated;
grant execute on function public.server_get_emergency_profile(text,bytea,bytea,text,boolean) to service_role;
