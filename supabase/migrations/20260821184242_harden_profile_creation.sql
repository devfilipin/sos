revoke insert on public.emergency_profiles from authenticated;
grant insert(user_id,preferred_name,birth_date,pronouns,blood_type,allergies,conditions,medications,support_needs,medical_devices,health_plan_name,other_guidance,visibility)
on public.emergency_profiles to authenticated;
