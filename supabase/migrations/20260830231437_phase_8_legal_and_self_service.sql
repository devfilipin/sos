create table private.legal_acceptances(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 terms_version text not null,
 privacy_version text not null,
 adult_confirmed boolean not null,
 accepted_at timestamptz not null default now()
);
create index legal_acceptances_user_recent_idx on private.legal_acceptances(user_id,accepted_at desc);
revoke all on private.legal_acceptances from public,anon,authenticated;

create function private.capture_signup_legal_acceptance()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.raw_user_meta_data->>'terms_version'='terms-v1' and new.raw_user_meta_data->>'privacy_version'='privacy-v1' and new.raw_user_meta_data->>'adult_confirmed'='true' then
  insert into private.legal_acceptances(user_id,terms_version,privacy_version,adult_confirmed) values(new.id,'terms-v1','privacy-v1',true);
 end if;
 return new;
end$$;
revoke all on function private.capture_signup_legal_acceptance() from public,anon,authenticated;
create trigger capture_signup_legal_acceptance after insert on auth.users for each row execute function private.capture_signup_legal_acceptance();

create function public.server_unblock_my_product(p_product_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_updated integer;v_now timestamptz:=clock_timestamp();v_auth_time bigint;
begin
 begin v_auth_time:=(auth.jwt()->>'auth_time')::bigint;exception when others then return false;end;
 if v_user is null or v_auth_time is null or extract(epoch from v_now)::bigint-v_auth_time>600 then return false;end if;
 update private.products set status='active',updated_at=v_now where id=p_product_id and owner_id=v_user and status='blocked';
 get diagnostics v_updated=row_count;
 if v_updated=1 then
  update public.user_products set status='active',updated_at=v_now where product_id=p_product_id and user_id=v_user;
  insert into private.product_events(product_id,actor_user_id,event_type)values(p_product_id,v_user,'unblocked');
 end if;
 return v_updated=1;
end$$;
revoke all on function public.server_unblock_my_product(uuid) from public,anon;
grant execute on function public.server_unblock_my_product(uuid) to authenticated;
