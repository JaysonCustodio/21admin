import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// route protection: presence check only — the API verifies the session signature on every request
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("session");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
