create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.profiles(user_id,display_name)
  values(new.id,left(nullif(trim(new.raw_user_meta_data->>'display_name'),''),80))
  on conflict(user_id) do nothing;
  return new;
end
$$;

revoke all on function private.handle_new_user() from public,anon,authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();
