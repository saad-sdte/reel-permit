import { NextResponse, type NextRequest } from "next/server";

const LOCALE_COOKIE = "ap_lang";

/**
 * Competitor-style `/es/...` locale prefix.
 * Rewrites to the bare path and sets ap_lang=es so the client LocaleProvider
 * can agree on Spanish without duplicating every route.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/es" || pathname.startsWith("/es/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/es" ? "/" : pathname.replace(/^\/es/, "") || "/";
    const response = NextResponse.rewrite(url);
    response.cookies.set(LOCALE_COOKIE, "es", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // Non-/es paths are English — clear any stuck Spanish cookie so EN toggle sticks.
  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
