import { EDIT_KEY, serviceClient } from "@/lib/supabase/service";
import { CalendarApp } from "@/components/CalendarApp";
import type { Category, CustodyOverride, CustodyPattern, EventItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = serviceClient();
  const { data } = await supabase.rpc("get_owner_data", { edit_key: EDIT_KEY() });

  return (
    <CalendarApp
      categories={(data?.categories ?? []) as Category[]}
      initialEvents={(data?.events ?? []) as EventItem[]}
      pattern={(data?.pattern as CustodyPattern | null) ?? null}
      initialOverrides={(data?.overrides ?? []) as CustodyOverride[]}
    />
  );
}
