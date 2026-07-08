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
      case "override.set": {
        const { error } = await supabase.rpc("set_override", {
          edit_key: key,
          p_start: body.occurrence_start,
          p_holder: body.holder,
          p_note: body.note ?? null,
        });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "override.delete": {
        const { error } = await supabase.rpc("delete_override", {
          edit_key: key,
          p_start: body.occurrence_start,
        });
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case "pattern.save": {
        const { error } = await supabase.rpc("save_pattern", {
          edit_key: key,
          p_anchor: body.anchor_date,
          p_cycle: body.cycle,
          p_clear_overrides: Boolean(body.clear_overrides),
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
