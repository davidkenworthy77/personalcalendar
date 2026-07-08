import { NextResponse } from "next/server";
import { EDIT_KEY, serviceClient } from "@/lib/supabase/service";

// Full owner dataset — used by the Settings "Download my data" button.
export async function GET() {
  const supabase = serviceClient();
  const { data, error } = await supabase.rpc("get_owner_data", { edit_key: EDIT_KEY() });
  if (error) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json(data);
}
