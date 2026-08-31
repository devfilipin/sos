create index admin_audit_batch_recent_idx on private.admin_audit_events(batch_id,created_at desc) where batch_id is not null;
