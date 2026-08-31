-- Fixture integralmente revertida. Executar somente em banco vazio/de validação.
begin;

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('00000000-0000-4000-8000-0000000004a1','authenticated','authenticated','activation-a@example.invalid',now(),now()),
  ('00000000-0000-4000-8000-0000000004b2','authenticated','authenticated','activation-b@example.invalid',now(),now());

insert into public.emergency_profiles(id,user_id,preferred_name,subject_relationship)
values
  ('10000000-0000-4000-8000-0000000004a1','00000000-0000-4000-8000-0000000004a1','Perfil A','self'),
  ('10000000-0000-4000-8000-0000000004b2','00000000-0000-4000-8000-0000000004b2','Perfil B','self');

insert into private.products(id,public_code,nfc_token_hash,activation_secret_hash)
values(
  '40000000-0000-4000-8000-0000000004a1',
  'FA23B',
  decode(repeat('4a',32),'hex'),
  extensions.crypt('segredo-ativacao-123',extensions.gen_salt('bf'))
);

do $$
declare v_result uuid;
begin
  select public.server_activate_product(
    '00000000-0000-4000-8000-0000000004a1',
    '10000000-0000-4000-8000-0000000004b2',
    'FA23B','segredo-ativacao-123',decode(repeat('1a',32),'hex')
  ) into v_result;
  if v_result is not null then raise exception 'cross-owner profile activation succeeded'; end if;

  select public.server_activate_product(
    '00000000-0000-4000-8000-0000000004a1',
    '10000000-0000-4000-8000-0000000004a1',
    'FA23B','segredo-ativacao-123',decode(repeat('1a',32),'hex')
  ) into v_result;
  if v_result <> '40000000-0000-4000-8000-0000000004a1' then raise exception 'valid activation failed'; end if;

  select public.server_activate_product(
    '00000000-0000-4000-8000-0000000004a1',
    '10000000-0000-4000-8000-0000000004a1',
    'FA23B','segredo-ativacao-123',decode(repeat('1a',32),'hex')
  ) into v_result;
  if v_result is not null then raise exception 'activation secret was reused'; end if;

  if not exists(select 1 from private.products where id='40000000-0000-4000-8000-0000000004a1' and owner_id='00000000-0000-4000-8000-0000000004a1' and emergency_profile_id='10000000-0000-4000-8000-0000000004a1' and status='active') then raise exception 'product link invalid';end if;
  if not exists(select 1 from public.user_products where product_id='40000000-0000-4000-8000-0000000004a1' and emergency_profile_id='10000000-0000-4000-8000-0000000004a1') then raise exception 'product projection invalid';end if;
  if not exists(select 1 from private.product_events where product_id='40000000-0000-4000-8000-0000000004a1' and event_type='activated') then raise exception 'activation audit missing';end if;
end
$$;

rollback;
