create index emergency_lookup_created_at_idx on private.emergency_lookup_attempts(created_at);
create function private.cleanup_emergency_lookup_attempts()returns trigger language plpgsql security definer set search_path='' as $$begin delete from private.emergency_lookup_attempts where created_at<now()-interval'24 hours';return null;end$$;
revoke all on function private.cleanup_emergency_lookup_attempts()from public,anon,authenticated;
create trigger cleanup_emergency_lookup_attempts after insert on private.emergency_lookup_attempts for each statement execute function private.cleanup_emergency_lookup_attempts();
