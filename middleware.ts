import { NextResponse, type NextRequest } from "next/server";

// No login: a secret bookmark URL (/unlock/<key>) sets a long-lived cookie,
// and everything except the public surfaces requires it.
const PUBLIC_PREFIXES = ["/share", "/unlock", "/locked"];
if (process.env.NODE_ENV !== "production") PUBLIC_PREFIXES.push("/dev");

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  const key = request.cookies.get("glance_key")?.value;
  if (!process.env.EDIT_KEY || key !== process.env.EDIT_KEY) {
    const url = request.nextUrl.clone();
    url.pathname = "/locked";
    // Rewrite (not redirect) so the URL bar keeps what the user typed.
    return NextResponse.rewrite(url, { status: pathname.startsWith("/api") ? 401 : 200 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
