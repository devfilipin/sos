-- Executar em banco de desenvolvimento vazio. Toda fixture é revertida ao final.
begin;

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1','authenticated','authenticated','rls-a@example.invalid',now(),now()),
  ('00000000-0000-4000-8000-0000000000b2','authenticated','authenticated','rls-b@example.invalid',now(),now()),
  ('00000000-0000-4000-8000-0000000000c3','authenticated','authenticated','rls-c@example.invalid',now(),now());

-- O gatilho de criação de auth.users já cria public.profiles.
update public.profiles set display_name='Usuária A' where user_id='00000000-0000-4000-8000-0000000000a1';
update public.profiles set display_name='Usuária B' where user_id='00000000-0000-4000-8000-0000000000b2';

insert into public.emergency_profiles(id,user_id,preferred_name,subject_relationship,responsibility_confirmed_at)
values
  ('10000000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-0000000000a1','A','self',null),
  ('10000000-0000-4000-8000-0000000000a2','00000000-0000-4000-8000-0000000000a1','Filho A','child',now()),
  ('10000000-0000-4000-8000-0000000000b2','00000000-0000-4000-8000-0000000000b2','B','self',null);

insert into public.emergency_contacts(id,user_id,emergency_profile_id,name,phone)
values
  ('20000000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-0000000000a1','10000000-0000-4000-8000-0000000000a1','Contato A','+5565999990001'),
  ('20000000-0000-4000-8000-0000000000b2','00000000-0000-4000-8000-0000000000b2','10000000-0000-4000-8000-0000000000b2','Contato B','+5565999990002');

insert into public.consent_events(id,user_id,emergency_profile_id,event_type,document_version,purpose)
values
  ('30000000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-0000000000a1','10000000-0000-4000-8000-0000000000a1','test','v1','Teste A'),
  ('30000000-0000-4000-8000-0000000000b2','00000000-0000-4000-8000-0000000000b2','10000000-0000-4000-8000-0000000000b2','test','v1','Teste B');

insert into private.products(id,public_code,nfc_token_hash,activation_secret_hash,status,owner_id,emergency_profile_id,activated_at)
values
  ('40000000-0000-4000-8000-0000000000a1','AA23B',decode(repeat('aa',32),'hex'),repeat('x',60),'active','00000000-0000-4000-8000-0000000000a1','10000000-0000-4000-8000-0000000000a1',now()),
  ('40000000-0000-4000-8000-0000000000b2','BB24C',decode(repeat('bb',32),'hex'),repeat('y',60),'active','00000000-0000-4000-8000-0000000000b2','10000000-0000-4000-8000-0000000000b2',now());

insert into public.user_products(product_id,user_id,emergency_profile_id,public_code,status,activated_at)
select id,owner_id,emergency_profile_id,public_code,'active',activated_at from private.products;

insert into storage.objects(id,bucket_id,name,owner,owner_id)
values
  ('50000000-0000-4000-8000-0000000000a1','profile-photos','00000000-0000-4000-8000-0000000000a1/a.jpg','00000000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-0000000000a1'),
  ('50000000-0000-4000-8000-0000000000b2','profile-photos','00000000-0000-4000-8000-0000000000b2/b.jpg','00000000-0000-4000-8000-0000000000b2','00000000-0000-4000-8000-0000000000b2');

do $$
begin
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='photo_delete' and cmd='DELETE') then
    raise exception 'storage delete policy missing';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","user_metadata":{"role":"admin"}}',true);

do $$
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'profiles isolation failed'; end if;
  if (select count(*) from public.emergency_profiles) <> 2 then raise exception 'multiple owned profiles or isolation failed'; end if;
  if (select count(*) from public.emergency_contacts) <> 1 then raise exception 'contacts isolation failed'; end if;
  if (select count(*) from public.consent_events) <> 1 then raise exception 'consents isolation failed'; end if;
  if (select count(*) from public.user_products) <> 1 then raise exception 'user_products isolation failed'; end if;
  if (select count(*) from storage.objects where bucket_id='profile-photos') <> 1 then raise exception 'storage isolation failed'; end if;
end $$;

do $$
declare affected integer;
begin
  update public.emergency_profiles set preferred_name='Ataque' where id='10000000-0000-4000-8000-0000000000b2';
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'cross-owner dependent profile update succeeded';end if;
  begin
    insert into public.emergency_profiles(user_id,preferred_name,subject_relationship,responsibility_confirmed_at)
    values('00000000-0000-4000-8000-0000000000b2','Perfil forjado','dependent',now());
    raise exception 'cross-owner dependent creation succeeded';
  exception when insufficient_privilege or check_violation then null;
  end;
end $$;

do $$
begin
  begin
    update public.emergency_profiles set status='published',published_at=now()
    where user_id='00000000-0000-4000-8000-0000000000a1';
    raise exception 'direct publication was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.consent_events(user_id,event_type,document_version,purpose)
    values('00000000-0000-4000-8000-0000000000a1','forged','v1','forged');
    raise exception 'direct consent insertion was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.emergency_profiles(user_id,status,published_at)
    values('00000000-0000-4000-8000-0000000000c3','published',now());
    raise exception 'direct published profile creation was accepted';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    update public.profiles set user_id='00000000-0000-4000-8000-0000000000c3'
    where user_id='00000000-0000-4000-8000-0000000000a1';
    raise exception 'ownership reassignment was accepted';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.profiles where user_id='00000000-0000-4000-8000-0000000000a1') <> 1 then
    raise exception 'owner row changed';
  end if;
end $$;

do $$
declare affected integer;
begin
  delete from public.emergency_contacts where user_id='00000000-0000-4000-8000-0000000000b2';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'cross-owner delete succeeded'; end if;
end $$;

do $$
begin
  begin
    update private.products set status='revoked' where public_code='BB24C';
    raise exception 'direct private product update was accepted';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    insert into storage.objects(bucket_id,name,owner,owner_id)
    values('profile-photos','00000000-0000-4000-8000-0000000000b2/attack.jpg','00000000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-0000000000a1');
    raise exception 'cross-owner upload was accepted';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','anon',true);

do $$
begin
  begin
    perform * from public.emergency_profiles;
    raise exception 'anon medical read was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.user_products;
    raise exception 'anon product read was accepted';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
rollback;
