# Glance

A high-level planning calendar: the shared dog-custody schedule, weekend
activities, vacations, and trips — readable at Month, 3-month, 6-month, and
Year zoom. Day-granularity only; a bar shows its full title or no text at all
(never a truncated one).

## How it works

- **Next.js (App Router) + Supabase + Tailwind**, deployed on Vercel.
- **Custody is computed, never stored**: [lib/custody.ts](lib/custody.ts) walks
  the repeating pattern (`custody_pattern`) from its anchor date and applies
  one-row-per-swap overrides (`custody_overrides`). Click any custody band on
  the calendar to swap a block; click a swapped block to revert.
- **Share link** (`/share/<token>`): read-only for the dog co-parent. The
  `share_view` Postgres function (security definer) is the only thing the
  anonymous key can call — it returns the custody schedule in full and all
  other events as anonymous date ranges. Titles and notes never leave the
  database.
- **Auth**: magic-link email for the owner only; row-level security pins every
  table to the owner's email, and the anon role has zero table access.

## Development

```bash
npm run dev                     # local dev (uses .env.local)
npx tsx tests/custody.test.ts   # custody engine unit tests
```

`/dev` is a UI sandbox with fixture data and no auth — it 404s in production.

Database schema lives in [supabase/migrations](supabase/migrations) (applied
via the Supabase MCP; kept in-repo as the record).

## Settings (`/settings`)

- Edit the custody pattern (presets + custom cycle) with a live 8-week preview.
  Changing the pattern clears existing swaps (they belong to old block dates).
- Create/rotate the share link. Rotating deactivates the old link instantly.
- Rename categories and change their colors.
