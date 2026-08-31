revoke update on public.profiles from authenticated;
grant update(display_name,photo_path,preferred_language,updated_at) on public.profiles to authenticated;

revoke update on public.emergency_profiles from authenticated;
grant update(preferred_name,birth_date,pronouns,blood_type,allergies,conditions,medications,support_needs,medical_devices,health_plan_name,other_guidance,visibility,updated_at) on public.emergency_profiles to authenticated;

revoke update on public.emergency_contacts from authenticated;
grant update(name,relationship,phone,is_public,sort_order) on public.emergency_contacts to authenticated;

drop policy if exists consent_insert on public.consent_events;
revoke insert on public.consent_events from authenticated;

create policy photo_delete on storage.objects for delete to authenticated
using(bucket_id='profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

alter default privileges in schema public revoke all on tables from anon,authenticated;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated;
