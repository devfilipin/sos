create table private.admin_audit_events(
 id bigint generated always as identity primary key,
 actor_user_id uuid not null references auth.users(id) on delete restrict,
 action text not null check(action in('batch_created','product_blocked','product_unblocked','product_revoked')),
 product_id uuid references private.products(id) on delete restrict,
 batch_id uuid references private.product_batches(id) on delete restrict,
 reason text not null check(char_length(reason) between 3 and 500),
 created_at timestamptz not null default now()
);
create index admin_audit_actor_recent_idx on private.admin_audit_events(actor_user_id,created_at desc);
create index admin_audit_product_recent_idx on private.admin_audit_events(product_id,created_at desc) where product_id is not null;
revoke all on private.admin_audit_events from public,anon,authenticated;

create function public.server_admin_create_batch(p_actor uuid,p_name text,p_items jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_batch uuid;v_item jsonb;
begin
 if p_actor is null or char_length(trim(p_name)) not between 3 and 80 or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then return null;end if;
 insert into private.product_batches(name,quantity,created_by) values(trim(p_name),jsonb_array_length(p_items),p_actor) returning id into v_batch;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if v_item->>'public_code'!~'^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$' or char_length(v_item->>'activation_secret') not between 20 and 128 or v_item->>'nfc_token_hash'!~'^[0-9a-f]{64}$' then raise exception 'invalid_batch_item';end if;
  insert into private.products(public_code,nfc_token_hash,activation_secret_hash,batch_id)
  values(v_item->>'public_code',decode(v_item->>'nfc_token_hash','hex'),extensions.crypt(v_item->>'activation_secret',extensions.gen_salt('bf')),v_batch);
 end loop;
 insert into private.admin_audit_events(actor_user_id,action,batch_id,reason) values(p_actor,'batch_created',v_batch,'Geração de lote administrativo');
 return v_batch;
end$$;
revoke all on function public.server_admin_create_batch(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.server_admin_create_batch(uuid,text,jsonb) to service_role;

create function public.server_admin_manage_product(p_actor uuid,p_product uuid,p_action text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_current private.product_status;v_target private.product_status;v_now timestamptz:=clock_timestamp();
begin
 if p_actor is null or char_length(trim(p_reason)) not between 3 and 500 or p_action not in('block','unblock','revoke') then return false;end if;
 select status into v_current from private.products where id=p_product for update;if not found then return false;end if;
 if p_action='block' and v_current='active' then v_target='blocked';
 elsif p_action='unblock' and v_current='blocked' then v_target='active';
 elsif p_action='revoke' and v_current<>'revoked' then v_target='revoked';
 else return false;end if;
 update private.products set status=v_target,updated_at=v_now where id=p_product;
 update public.user_products set status=v_target::text,updated_at=v_now where product_id=p_product;
 insert into private.product_events(product_id,actor_user_id,event_type) values(p_product,p_actor,case p_action when 'block' then 'blocked' when 'unblock' then 'unblocked' else 'revoked' end);
 insert into private.admin_audit_events(actor_user_id,action,product_id,reason) values(p_actor,case p_action when 'block' then 'product_blocked' when 'unblock' then 'product_unblocked' else 'product_revoked' end,p_product,trim(p_reason));
 return true;
end$$;
revoke all on function public.server_admin_manage_product(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.server_admin_manage_product(uuid,uuid,text,text) to service_role;

alter table private.product_events drop constraint product_events_event_type_check;
alter table private.product_events add constraint product_events_event_type_check check(event_type in('activated','blocked','unblocked','revoked'));

create function public.server_admin_snapshot()
returns jsonb language sql security definer set search_path='' stable as $$
 select jsonb_build_object(
  'counts',(select coalesce(jsonb_object_agg(status,c),'{}') from(select status::text status,count(*) c from private.products group by status)s),
  'products',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'publicCode',public_code,'status',status::text,'createdAt',created_at) order by created_at desc),'[]') from(select * from private.products order by created_at desc limit 100)p),
  'batches',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'quantity',quantity,'createdAt',created_at) order by created_at desc),'[]') from(select * from private.product_batches order by created_at desc limit 20)b)
 )
$$;
revoke all on function public.server_admin_snapshot() from public,anon,authenticated;
grant execute on function public.server_admin_snapshot() to service_role;
