-- Applied to project ddxvblfgkqkpowolgltr via Supabase MCP (init_schema).
-- Kept in-repo as the schema of record.

create table public.categories (
  id smallint primary key,
  name text not null,
  color text not null,
  is_custody boolean not null default false,
  holder text check (holder in ('me','coparent')),
  sort smallint not null default 0
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id smallint not null references public.categories(id),
  start_date date not null,
  end_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint valid_range check (end_date >= start_date)
);

create table public.custody_pattern (
  id smallint primary key check (id = 1),
  anchor_date date not null,
  cycle jsonb not null
);

create table public.custody_overrides (
  occurrence_start date primary key,
  holder text not null check (holder in ('me','coparent')),
  note text
);

create table public.share_tokens (
  token text primary key,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- RLS: deny-by-default; only the owner (by email) gets access. anon gets nothing.
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.custody_pattern enable row level security;
alter table public.custody_overrides enable row level security;
alter table public.share_tokens enable row level security;

create policy owner_all_categories on public.categories for all to authenticated
  using ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com');
create policy owner_all_events on public.events for all to authenticated
  using ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com');
create policy owner_all_custody_pattern on public.custody_pattern for all to authenticated
  using ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com');
create policy owner_all_custody_overrides on public.custody_overrides for all to authenticated
  using ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com');
create policy owner_all_share_tokens on public.share_tokens for all to authenticated
  using ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'davidkenworthy77@gmail.com');

insert into public.categories (id, name, color, is_custody, holder, sort) values
  (1, 'Dog: Me',        '#2dd4bf', true,  'me',       1),
  (2, 'Dog: Co-parent', '#fbbf24', true,  'coparent', 2),
  (3, 'Activity',       '#60a5fa', false, null,       3),
  (4, 'Vacation',       '#f472b6', false, null,       4),
  (5, 'Trip',           '#a78bfa', false, null,       5);

insert into public.custody_pattern (id, anchor_date, cycle) values
  (1, '2026-07-06', '[{"holder":"me","days":7},{"holder":"coparent","days":7}]');
