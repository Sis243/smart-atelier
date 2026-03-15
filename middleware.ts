import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN"]);

function isAdminPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/permissions")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Laisse passer assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // On protège dashboard + api
  const mustProtect = pathname.startsWith("/dashboard") || pathname.startsWith("/api");
  if (!mustProtect) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Pas connecté => login
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + (searchParams.toString() ? `?${searchParams}` : ""));
    return NextResponse.redirect(loginUrl);
  }

  // Bloque Users + APIs sensibles
  if (isAdminPath(pathname)) {
    const role = String((token as any)?.role ?? "").toUpperCase();
    if (!ADMIN_ROLES.has(role)) {
      const denied = req.nextUrl.clone();
      denied.pathname = "/dashboard";
      denied.searchParams.set("denied", "users");
      return NextResponse.redirect(denied);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
