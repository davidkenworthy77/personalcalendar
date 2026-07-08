-- Applied to project ddxvblfgkqkpowolgltr via Supabase MCP (share_rpcs_and_palette).

-- Richer "marker on paper" palette
update public.categories set color = '#0D9488' where id = 1;
update public.categories set color = '#D97706' where id = 2;
update public.categories set color = '#2563EB' where id = 3;
update public.categories set color = '#DB2777' where id = 4;
update public.categories set color = '#7C3AED' where id = 5;

-- Masked share view: the ONLY thing anon can ever read.
-- Returns full custody data + anonymous busy ranges. Titles/notes never leave the DB.
create or replace function public.share_view(share_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  select exists(
    select 1 from share_tokens where token = share_token and revoked_at is null
  ) into ok;
  if not ok then
    return null;
  end if;
  return jsonb_build_object(
    'pattern', (select jsonb_build_object('anchor_date', anchor_date, 'cycle', cycle)
                from custody_pattern where id = 1),
    'overrides', coalesce(
      (select jsonb_agg(jsonb_build_object('occurrence_start', occurrence_start, 'holder', holder)
                        order by occurrence_start)
       from custody_overrides), '[]'::jsonb),
    'custody_categories', coalesce(
      (select jsonb_agg(jsonb_build_object('holder', holder, 'name', name, 'color', color) order by sort)
       from categories where is_custody), '[]'::jsonb),
    'busy', coalesce(
      (select jsonb_agg(jsonb_build_object('start_date', e.start_date, 'end_date', e.end_date)
                        order by e.start_date)
       from events e join categories c on c.id = e.category_id
       where not c.is_custody), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.share_view(text) from public;
grant execute on function public.share_view(text) to anon, authenticated;

-- Owner-only: revoke current token, mint a new unguessable one.
create or replace function public.rotate_share_token()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
begin
  if (auth.jwt() ->> 'email') is distinct from 'davidkenworthy77@gmail.com' then
    raise exception 'not allowed';
  end if;
  update share_tokens set revoked_at = now() where revoked_at is null;
  new_token := translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_');
  insert into share_tokens(token) values (new_token);
  return new_token;
end;
$$;

revoke all on function public.rotate_share_token() from public;
grant execute on function public.rotate_share_token() to authenticated;
