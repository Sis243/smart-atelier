import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

function isPublicApiPath(pathname: string) {
  return pathname.startsWith("/api/auth") || pathname === "/api/health";
}

function canAccessPath(role: string, pathname: string) {
  const r = String(role || "").toUpperCase();

  if (pathname.startsWith("/api/_debug")) {
    return ["SUPERADMIN", "ADMIN"].includes(r);
  }

  if (pathname.startsWith("/api/admin")) {
    return ["SUPERADMIN", "ADMIN"].includes(r);
  }

  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/api")) {
    return true;
  }

  if (pathname.startsWith("/dashboard/users") || pathname.startsWith("/api/users")) {
    return ["SUPERADMIN", "ADMIN"].includes(r);
  }

  if (pathname.startsWith("/dashboard/hr") || pathname.startsWith("/api/hr")) {
    return ["SUPERADMIN", "ADMIN", "RH", "MANAGER"].includes(r);
  }

  if (pathname.startsWith("/dashboard/accounting") || pathname.startsWith("/api/accounting")) {
    return ["SUPERADMIN", "ADMIN", "COMPTABLE", "CAISSIER", "MANAGER"].includes(r);
  }

  if (
    pathname.startsWith("/dashboard/cut") ||
    pathname.startsWith("/api/cut") ||
    pathname.startsWith("/api/coupe")
  ) {
    return ["SUPERADMIN", "ADMIN", "MANAGER", "COUPE"].includes(r);
  }

  if (pathname.startsWith("/dashboard/production") || pathname.startsWith("/api/production")) {
    return ["SUPERADMIN", "ADMIN", "MANAGER", "PRODUCTION"].includes(r);
  }

  if (pathname.startsWith("/dashboard/quality") || pathname.startsWith("/api/quality")) {
    return ["SUPERADMIN", "ADMIN", "MANAGER", "QUALITE"].includes(r);
  }

  if (pathname.startsWith("/dashboard/delivery") || pathname.startsWith("/api/delivery")) {
    return ["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE"].includes(r);
  }

  if (pathname.startsWith("/dashboard/stock") || pathname.startsWith("/api/stock")) {
    return ["SUPERADMIN", "ADMIN", "MANAGER", "LOGISTIQUE", "COMPTABLE"].includes(r);
  }

  if (pathname.startsWith("/dashboard/activity") || pathname.startsWith("/api/activity")) {
    return ["SUPERADMIN", "ADMIN", "MANAGER"].includes(r);
  }

  if (pathname.startsWith("/api/customers")) {
    return ["SUPERADMIN", "ADMIN", "MANAGER", "CAISSIER"].includes(r);
  }

  if (pathname.startsWith("/api/orders") || pathname.startsWith("/api/payments")) {
    return ["SUPERADMIN", "ADMIN", "MANAGER", "CAISSIER", "COMPTABLE"].includes(r);
  }

  return true;
}

function apiJson(message: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      message,
    },
    { status }
  );
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api");
  const isDashboard = pathname.startsWith("/dashboard");

  if (isApi && isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  if (!isApi && !isDashboard) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isApi) {
      return apiJson("Session invalide ou expirée", 401);
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = String((token as any)?.role ?? "");

  if (!canAccessPath(role, pathname)) {
    if (isApi) {
      return apiJson("Accès refusé", 403);
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
