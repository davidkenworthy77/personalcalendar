import { EDIT_KEY, serviceClient } from "@/lib/supabase/service";
import { SettingsForm } from "@/components/SettingsForm";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = serviceClient();
  const { data } = await supabase.rpc("get_owner_data", { edit_key: EDIT_KEY() });

  return (
    <SettingsForm
      categories={(data?.categories ?? []) as Category[]}
      activeToken={(data?.active_token as string | null) ?? null}
    />
  );
}
