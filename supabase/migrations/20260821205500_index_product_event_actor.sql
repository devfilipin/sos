create index product_events_actor_user_id_idx
  on private.product_events (actor_user_id)
  where actor_user_id is not null;
