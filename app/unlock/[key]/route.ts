import { type NextRequest, NextResponse } from "next/server";

// The secret bookmark: visiting /unlock/<key> once per device unlocks editing
// (long-lived cookie), then drops you on the calendar.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!process.env.EDIT_KEY || key !== process.env.EDIT_KEY) {
    return NextResponse.redirect(new URL("/locked", request.url));
  }
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("glance_key", key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400, // browser maximum (~13 months); re-click to renew
  });
  return response;
}
