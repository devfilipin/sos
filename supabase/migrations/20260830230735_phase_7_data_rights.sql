create function public.server_export_my_data(p_user uuid)
returns jsonb language sql security definer set search_path='' stable as $$
 select jsonb_build_object(
 'exportedAt',clock_timestamp(),'account',(select jsonb_build_object('id',u.id,'email',u.email,'createdAt',u.created_at) from auth.users u where u.id=p_user),
 'profile',(select to_jsonb(p)-'user_id' from public.profiles p where p.user_id=p_user),
 'emergencyProfiles',(select coalesce(jsonb_agg(to_jsonb(e)-'user_id'),'[]') from public.emergency_profiles e where e.user_id=p_user),
 'contacts',(select coalesce(jsonb_agg(to_jsonb(c)-'user_id'),'[]') from public.emergency_contacts c where c.user_id=p_user),
 'products',(select coalesce(jsonb_agg(jsonb_build_object('publicCode',u.public_code,'status',u.status,'profileId',u.emergency_profile_id,'activatedAt',u.activated_at)),'[]') from public.user_products u where u.user_id=p_user),
 'consents',(select coalesce(jsonb_agg(to_jsonb(c)-'user_id'),'[]') from public.consent_events c where c.user_id=p_user)
 )
$$;
revoke all on function public.server_export_my_data(uuid) from public,anon,authenticated;
grant execute on function public.server_export_my_data(uuid) to service_role;

create function public.server_prepare_account_deletion(p_user uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_paths jsonb;v_now timestamptz:=clock_timestamp();
begin
 if p_user is null or exists(select 1 from private.product_batches where created_by=p_user) or exists(select 1 from private.admin_audit_events where actor_user_id=p_user) then return null;end if;
 select coalesce(jsonb_agg(photo_path)filter(where photo_path is not null),'[]') into v_paths from public.emergency_profiles where user_id=p_user;
 update public.emergency_profiles set status='hidden',published_at=null,updated_at=v_now where user_id=p_user;
 update private.products set status='revoked',updated_at=v_now where owner_id=p_user;
 update public.user_products set status='revoked',updated_at=v_now where user_id=p_user;
 return jsonb_build_object('photoPaths',v_paths);
end$$;
revoke all on function public.server_prepare_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.server_prepare_account_deletion(uuid) to service_role;
