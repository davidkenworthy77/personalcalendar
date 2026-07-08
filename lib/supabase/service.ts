import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. The anon key grants nothing by itself (RLS is
// deny-all); every owner operation passes EDIT_KEY into a security-definer
// function that validates it inside Postgres.
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export const EDIT_KEY = () => process.env.EDIT_KEY ?? "";
