import { EDIT_KEY, serviceClient } from "@/lib/supabase/service";
import { CalendarApp } from "@/components/CalendarApp";
import type { Category, EventItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = serviceClient();
  const { data, error } = await supabase.rpc("get_owner_data", { edit_key: EDIT_KEY() });

  if (error || !data) {
    // Never render an empty calendar when the backend is misconfigured — say
    // exactly what the server sees (presence + length only, never values).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const editKey = process.env.EDIT_KEY;
    const checks = [
      `NEXT_PUBLIC_SUPABASE_URL: ${url ? `set (${url})` : "MISSING"}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anon ? `set (${anon.length} chars — expected 45)` : "MISSING"}`,
      `EDIT_KEY: ${editKey ? `set (${editKey.length} chars — expected 48)` : "MISSING"}`,
      `Database says: ${error ? `${error.code ?? ""} ${error.message}` : "no data returned"}`,
    ];
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="rise-in max-w-lg">
          <h1 className="font-display text-4xl font-semibold mb-2 text-center">Glance</h1>
          <p className="text-ink-soft mb-4 text-center">
            The calendar couldn&rsquo;t load its data. Here&rsquo;s what the server sees —
            fix the failing line in Vercel&rsquo;s environment variables and redeploy:
          </p>
          <ul className="rounded-xl border border-hairline bg-paper-raised p-4 space-y-1.5 text-sm font-mono">
            {checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
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
