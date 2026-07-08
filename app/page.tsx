import { createClient } from "@/lib/supabase/server";
import { CalendarApp } from "@/components/CalendarApp";
import type { Category, CustodyOverride, CustodyPattern, EventItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const [categoriesRes, eventsRes, patternRes, overridesRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("events").select("id,title,category_id,start_date,end_date,notes"),
    supabase.from("custody_pattern").select("anchor_date,cycle").eq("id", 1).maybeSingle(),
    supabase.from("custody_overrides").select("occurrence_start,holder,note"),
  ]);

  return (
    <CalendarApp
      categories={(categoriesRes.data ?? []) as Category[]}
      initialEvents={(eventsRes.data ?? []) as EventItem[]}
      pattern={(patternRes.data as CustodyPattern | null) ?? null}
      initialOverrides={(overridesRes.data ?? []) as CustodyOverride[]}
    />
  );
}
