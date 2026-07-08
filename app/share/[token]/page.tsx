import { createClient } from "@supabase/supabase-js";
import { CalendarApp } from "@/components/CalendarApp";
import type { Category, CustodyOverride, CustodyPattern, EventItem, Holder } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ShareData {
  pattern: { anchor_date: string; cycle: CustodyPattern["cycle"] } | null;
  overrides: { occurrence_start: string; holder: Holder }[];
  custody_categories: { holder: Holder; name: string; color: string }[];
  busy: { start_date: string; end_date: string }[];
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Anonymous client — the share_view function is the only thing anon can
  // execute, and it strips titles/notes inside the database.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.rpc("share_view", { share_token: token });
  const share = data as ShareData | null;

  if (!share) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center rise-in">
          <h1 className="font-display text-4xl font-semibold mb-2">Glance</h1>
          <p className="text-ink-soft">
            This link isn’t active anymore. Ask for a fresh one.
          </p>
        </div>
      </main>
    );
  }

  const categories: Category[] = share.custody_categories.map((c, i) => ({
    id: i + 1,
    name: c.name,
    color: c.color,
    is_custody: true,
    holder: c.holder,
    sort: i,
  }));

  const busyEvents: EventItem[] = share.busy.map((b, i) => ({
    id: `busy-${i}`,
    title: "Busy",
    category_id: -1,
    start_date: b.start_date,
    end_date: b.end_date,
    notes: null,
  }));

  return (
    <CalendarApp
      readOnly
      categories={categories}
      initialEvents={busyEvents}
      pattern={
        share.pattern
          ? { anchor_date: share.pattern.anchor_date, cycle: share.pattern.cycle }
          : null
      }
      initialOverrides={share.overrides as CustodyOverride[]}
    />
  );
}
