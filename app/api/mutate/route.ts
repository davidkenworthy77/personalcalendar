import { NextResponse, type NextRequest } from "next/server";
import { EDIT_KEY, serviceClient } from "@/lib/supabase/service";

// Single mutation endpoint. Middleware already requires the unlock cookie for
// /api/*, and every call is re-validated by the edit key inside Postgres.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = serviceClient();
  const key = EDIT_KEY();

  try {
    switch (body.kind) {
      case "event.save": {
        const e = body.event;
        const { data, error } = await supabase.rpc("save_event", {
          edit_key: key,
          p_id: e.id ?? null,
          p_title: e.title,
          p_category_id: e.category_id,
          p_start: e.start_date,
          p_end: e.end_date,
          p_notes: e.notes ?? null,
        });
        if (error) throw error;
        return NextResponse.json({ id: data });
      }
      case "event.delete": {
        const { error } = await supabase.rpc("delete_event", {
          edit_key: key,
          p_id: body.id,
        });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "category.save": {
        const { error } = await supabase.rpc("save_category", {
          edit_key: key,
          p_id: body.id,
          p_name: body.name,
          p_color: body.color,
        });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "category.add": {
        const { data, error } = await supabase.rpc("add_category", {
          edit_key: key,
          p_name: body.name,
          p_color: body.color,
        });
        if (error) throw error;
        return NextResponse.json(data);
      }
      case "category.delete": {
        const { error } = await supabase.rpc("delete_category", {
          edit_key: key,
          p_id: body.id,
        });
        if (error) {
          const inUse = String(error.message).includes("category in use");
          return NextResponse.json(
            { error: inUse ? "category in use" : "mutation failed" },
            { status: inUse ? 409 : 500 }
          );
        }
        return NextResponse.json({ ok: true });
      }
      case "token.rotate": {
        const { data, error } = await supabase.rpc("rotate_share_token", {
          edit_key: key,
        });
        if (error) throw error;
        return NextResponse.json({ token: data });
      }
      default:
        return NextResponse.json({ error: "unknown kind" }, { status: 400 });
    }
  } catch (err) {
    console.error("mutate failed:", body?.kind, err);
    return NextResponse.json({ error: "mutation failed" }, { status: 500 });
  }
}
