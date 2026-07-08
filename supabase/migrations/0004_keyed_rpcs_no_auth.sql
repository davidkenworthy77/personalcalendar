-- Applied to project ddxvblfgkqkpowolgltr via Supabase MCP (keyed_rpcs_no_auth).
--
-- Login removed from the app. RLS stays deny-by-default for anon (no table
-- grants). All owner operations go through SECURITY DEFINER functions that
-- validate a secret edit key (same pattern as share_view's token) — held
-- server-side by the app and never shipped to browsers.
--
-- Functions (all `security definer, set search_path = public`, granted to anon,
-- first arg `edit_key text` validated by check_edit_key which compares
-- sha256(edit_key) against app_config.edit_key_hash and raises on mismatch):
--   check_edit_key(k)                                  -- helper, NOT granted
--   get_owner_data(edit_key) -> jsonb                  -- categories/events/pattern/overrides/active_token
--   save_event(edit_key, p_id, p_title, p_category_id, p_start, p_end, p_notes) -> uuid
--   delete_event(edit_key, p_id)
--   set_override(edit_key, p_start, p_holder, p_note)  -- upsert
--   delete_override(edit_key, p_start)
--   save_pattern(edit_key, p_anchor, p_cycle, p_clear_overrides)
--   save_category(edit_key, p_id, p_name, p_color)
--   rotate_share_token(edit_key) -> text               -- replaced the zero-arg authed version
--
-- Plus:
create table public.app_config (
  id smallint primary key check (id = 1),
  edit_key_hash text not null
);
alter table public.app_config enable row level security; -- no policies: nobody reads it
-- (seeded with the sha256 hash of the EDIT_KEY env var)
--
-- To rotate the edit key: generate a new value, update the EDIT_KEY env var,
-- and run:
--   update app_config set edit_key_hash = encode(extensions.digest('<new-key>','sha256'),'hex') where id = 1;
