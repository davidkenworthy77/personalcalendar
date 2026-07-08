import { EDIT_KEY, serviceClient } from "@/lib/supabase/service";
import { SettingsForm } from "@/components/SettingsForm";
import type { Category, CustodyPattern } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = serviceClient();
  const { data } = await supabase.rpc("get_owner_data", { edit_key: EDIT_KEY() });

  return (
    <SettingsForm
      categories={(data?.categories ?? []) as Category[]}
      pattern={(data?.pattern as CustodyPattern | null) ?? null}
      activeToken={(data?.active_token as string | null) ?? null}
      overrideCount={data?.overrides?.length ?? 0}
    />
  );
}
