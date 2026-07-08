# Glance

A high-level planning calendar: the shared dog-custody schedule, weekend
activities, vacations, and trips — readable at Month, 3-month, 6-month, and
Year zoom. Day-granularity only; a bar shows its full title or no text at all
(never a truncated one).

## How it works

- **Next.js (App Router) + Supabase + Tailwind**, deployed on Vercel.
- **Everything is an event**: drag across days, give it a title and a color.
  Colors (categories) are managed in Settings — add, rename, recolor, delete.
  The two "shared" colors are the Holly (dog) schedule.
- **Share link** (`/share/<token>`): read-only for the dog co-parent. The
  `share_view` Postgres function (security definer) returns events in the two
  shared colors in full and all other events as anonymous "Busy" date ranges.
  Titles and notes of private events never leave the database.
- **Access**: no login. A secret bookmark URL (`/unlock/<EDIT_KEY>`) sets a
  long-lived cookie; middleware gates everything except `/share/*` on it. All
  reads/writes go through server API routes calling key-validated
  `security definer` functions — the anon role has zero table access and the
  database credential never ships to a browser. Env vars:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EDIT_KEY`.

## Development

```bash
npm run dev   # local dev (uses .env.local)
```

`/dev` is a UI sandbox with fixture data and no auth — it 404s in production.

Database schema lives in [supabase/migrations](supabase/migrations) (applied
via the Supabase MCP; kept in-repo as the record).

## Settings (`/settings`)

- Manage colors: add, rename, recolor, delete (deleting is blocked while
  events still use the color). The two "shared" colors can't be deleted —
  they're what Harriet's link shows in full.
- Create/rotate the share link. Rotating deactivates the old link instantly.
- Download all data as JSON.
