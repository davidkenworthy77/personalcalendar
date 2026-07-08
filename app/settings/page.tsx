import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/SettingsForm";
import type { Category, CustodyPattern } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [categoriesRes, patternRes, tokenRes, overridesRes] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("custody_pattern").select("anchor_date,cycle").eq("id", 1).maybeSingle(),
    supabase
      .from("share_tokens")
      .select("token")
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("custody_overrides").select("occurrence_start"),
  ]);

  return (
    <SettingsForm
      categories={(categoriesRes.data ?? []) as Category[]}
      pattern={(patternRes.data as CustodyPattern | null) ?? null}
      activeToken={tokenRes.data?.token ?? null}
      overrideCount={overridesRes.data?.length ?? 0}
    />
  );
}
