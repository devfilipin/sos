create table private.activation_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_hash bytea not null check (octet_length(origin_hash) = 32),
  succeeded boolean not null,
  reason text not null check (reason in ('activated', 'invalid', 'rate_limited')),
  created_at timestamptz not null default now()
);
create index activation_attempts_user_recent_idx on private.activation_attempts (user_id, created_at desc);
create index activation_attempts_origin_recent_idx on private.activation_attempts (origin_hash, created_at desc);

create table private.product_events (
  id bigint generated always as identity primary key,
  product_id uuid not null references private.products(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('activated')),
  created_at timestamptz not null default now()
);
create index product_events_product_recent_idx on private.product_events (product_id, created_at desc);
revoke all on private.activation_attempts, private.product_events from public, anon, authenticated;

drop function if exists public.server_activate_product(uuid, text, text);
create function public.server_activate_product(p_user_id uuid, p_public_code text, p_activation_secret text, p_origin_hash bytea)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_product private.products; v_now timestamptz := clock_timestamp(); v_user_attempts integer; v_origin_attempts integer;
begin
  if p_user_id is null or p_origin_hash is null or octet_length(p_origin_hash) <> 32
    or p_public_code !~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$'
    or char_length(p_activation_secret) not between 12 and 256 then return null; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(encode(p_origin_hash, 'hex'), 1));
  select count(*) into v_user_attempts from private.activation_attempts where user_id=p_user_id and created_at >= v_now-interval '15 minutes';
  select count(*) into v_origin_attempts from private.activation_attempts where origin_hash=p_origin_hash and created_at >= v_now-interval '15 minutes';
  if v_user_attempts >= 5 or v_origin_attempts >= 20 then
    insert into private.activation_attempts(user_id,origin_hash,succeeded,reason) values(p_user_id,p_origin_hash,false,'rate_limited'); return null;
  end if;

  select * into v_product from private.products where public_code=p_public_code for update;
  if not found or v_product.status <> 'available'
    or extensions.crypt(p_activation_secret,v_product.activation_secret_hash) <> v_product.activation_secret_hash then
    insert into private.activation_attempts(user_id,origin_hash,succeeded,reason) values(p_user_id,p_origin_hash,false,'invalid'); return null;
  end if;

  update private.products set owner_id=p_user_id,status='active',activated_at=v_now,
    activation_secret_hash=encode(extensions.gen_random_bytes(32),'hex'),updated_at=v_now where id=v_product.id;
  insert into public.user_products(product_id,user_id,public_code,status,activated_at,updated_at)
    values(v_product.id,p_user_id,v_product.public_code,'active',v_now,v_now);
  insert into public.emergency_profiles(user_id,status) values(p_user_id,'draft') on conflict(user_id) do nothing;
  insert into private.product_events(product_id,actor_user_id,event_type) values(v_product.id,p_user_id,'activated');
  insert into private.activation_attempts(user_id,origin_hash,succeeded,reason) values(p_user_id,p_origin_hash,true,'activated');
  return v_product.id;
end $$;
revoke all on function public.server_activate_product(uuid,text,text,bytea) from public,anon,authenticated;
grant execute on function public.server_activate_product(uuid,text,text,bytea) to service_role;
