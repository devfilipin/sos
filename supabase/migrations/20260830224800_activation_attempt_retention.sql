-- Keep activation security events for the 90-day window approved for V1.
create index activation_attempts_created_at_idx on private.activation_attempts(created_at);

create function private.cleanup_activation_attempts()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  delete from private.activation_attempts
  where created_at < clock_timestamp() - interval '90 days';
  return null;
end
$$;

revoke all on function private.cleanup_activation_attempts() from public,anon,authenticated;

create trigger cleanup_activation_attempts
after insert on private.activation_attempts
for each statement execute function private.cleanup_activation_attempts();
