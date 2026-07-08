import { createClient } from "@supabase/supabase-js";
import { CalendarApp } from "@/components/CalendarApp";
import type { Category, EventItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ShareData {
  categories: { id: number; name: string; color: string }[];
  shown: { title: string; category_id: number; start_date: string; end_date: string }[];
  busy: { start_date: string; end_date: string }[];
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // The share_view function validates the token and strips titles/notes from
  // private events inside the database — they never reach this page.
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
            This link isn&rsquo;t active anymore. Ask for a fresh one.
          </p>
        </div>
      </main>
    );
  }

  const categories: Category[] = share.categories.map((c, i) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    is_custody: true,
    sort: i,
  }));

  const events: EventItem[] = [
    ...share.shown.map((e, i) => ({
      id: `shown-${i}`,
      title: e.title,
      category_id: e.category_id,
      start_date: e.start_date,
      end_date: e.end_date,
      notes: null,
    })),
    ...share.busy.map((b, i) => ({
      id: `busy-${i}`,
      title: "Busy",
      category_id: -1,
      start_date: b.start_date,
      end_date: b.end_date,
      notes: null,
    })),
  ];

  return <CalendarApp readOnly categories={categories} initialEvents={events} />;
}
