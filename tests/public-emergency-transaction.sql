-- Teste integralmente revertido para a projeção pública da fase 5.
begin;

insert into auth.users(id,aud,role,email,created_at,updated_at)
values('00000000-0000-4000-8000-0000000005a1','authenticated','authenticated','public-a@example.invalid',now(),now());

insert into public.emergency_profiles(
  id,user_id,status,published_at,preferred_name,birth_date,allergies,conditions,
  photo_path,organ_donor_status,organ_donor_notes,visibility,subject_relationship
) values(
  '10000000-0000-4000-8000-0000000005a1',
  '00000000-0000-4000-8000-0000000005a1',
  'published',now(),'Perfil público','2000-01-01','Alergia pública','Condição privada',
  '00000000-0000-4000-8000-0000000005a1/foto.webp','yes','Observação autorizada',
  '{"preferred_name":true,"age":true,"allergies":true,"conditions":false,"photo":true,"organ_donor_status":true,"contacts":true}',
  'self'
);

insert into public.emergency_contacts(id,user_id,emergency_profile_id,name,phone,is_public,sort_order)
values
  ('20000000-0000-4000-8000-0000000005a1','00000000-0000-4000-8000-0000000005a1','10000000-0000-4000-8000-0000000005a1','Contato público','+5565999995001',true,0),
  ('20000000-0000-4000-8000-0000000005a2','00000000-0000-4000-8000-0000000005a1','10000000-0000-4000-8000-0000000005a1','Contato privado','+5565999995002',false,1);

insert into private.products(
  id,public_code,nfc_token_hash,activation_secret_hash,status,owner_id,emergency_profile_id,activated_at
) values(
  '40000000-0000-4000-8000-0000000005a1','FP23B',decode(repeat('5a',32),'hex'),repeat('x',60),
  'active','00000000-0000-4000-8000-0000000005a1','10000000-0000-4000-8000-0000000005a1',now()
);

do $$
declare v_code jsonb;v_nfc jsonb;v_unavailable jsonb;
begin
  select public.server_get_emergency_profile('FP23B',null,decode(repeat('11',32),'hex'),'code',false) into v_code;
  if v_code->>'preferredName'<>'Perfil público' or v_code->>'allergies'<>'Alergia pública' then raise exception 'allowed fields missing';end if;
  if v_code ? 'conditions' or v_code ? 'user_id' or v_code ? 'public_code' then raise exception 'private field leaked';end if;
  if v_code->>'photoPath'<>'00000000-0000-4000-8000-0000000005a1/foto.webp' then raise exception 'photo handoff missing';end if;
  if jsonb_array_length(v_code->'contacts')<>1 or v_code->'contacts'->0->>'name'<>'Contato público' then raise exception 'contact visibility failed';end if;

  select public.server_get_emergency_profile(null,decode(repeat('5a',32),'hex'),decode(repeat('12',32),'hex'),'nfc',false) into v_nfc;
  if v_nfc->>'preferredName'<>'Perfil público' then raise exception 'nfc lookup failed';end if;

  update private.products set status='blocked' where id='40000000-0000-4000-8000-0000000005a1';
  select public.server_get_emergency_profile('FP23B',null,decode(repeat('13',32),'hex'),'code',false) into v_unavailable;
  if v_unavailable is not null then raise exception 'blocked product remained public';end if;

  update private.products set status='active' where id='40000000-0000-4000-8000-0000000005a1';
  update public.emergency_profiles set status='hidden',published_at=null where id='10000000-0000-4000-8000-0000000005a1';
  select public.server_get_emergency_profile('FP23B',null,decode(repeat('14',32),'hex'),'code',false) into v_unavailable;
  if v_unavailable is not null then raise exception 'hidden profile remained public';end if;
end
$$;

rollback;
