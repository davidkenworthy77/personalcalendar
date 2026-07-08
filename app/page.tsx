import { EDIT_KEY, serviceClient } from "@/lib/supabase/service";
import { CalendarApp } from "@/components/CalendarApp";
import type { Category, EventItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = serviceClient();
  const { data, error } = await supabase.rpc("get_owner_data", { edit_key: EDIT_KEY() });

  if (error || !data) {
    // Never render an empty calendar when the backend is misconfigured — say so.
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center rise-in max-w-md">
          <h1 className="font-display text-4xl font-semibold mb-2">Glance</h1>
          <p className="text-ink-soft">
            The calendar couldn&rsquo;t load its data. This usually means the server&rsquo;s
            EDIT_KEY or Supabase environment variables are missing or wrong — check them
            and redeploy.
          </p>
        </div>
      </main>
    );
  }

  return (
    <CalendarApp
      categories={(data.categories ?? []) as Category[]}
      initialEvents={(data.events ?? []) as EventItem[]}
    />
  );
}
