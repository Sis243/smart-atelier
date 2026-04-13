import "server-only";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import {
  hasPermission,
  normalizeRole,
  type AppRole,
} from "@/lib/role-permissions";
import { prisma } from "@/lib/prisma";

type SessionUserLike = {
  id?: string;
  uid?: string;
  sub?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type AuthUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AppRole | "";
};

type GuardOk = {
  ok: true;
  auth: AuthUser;
};

type GuardFail = {
  ok: false;
  response: NextResponse;
};

export type GuardResult = GuardOk | GuardFail;

function unauthorized(message = "Session invalide ou expirée") {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      message,
    },
    { status: 401 }
  );
}

function forbidden(message = "Accès refusé") {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      message,
    },
    { status: 403 }
  );
}

async function readSessionUser(req?: Request): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  let user = ((session as any)?.user ?? null) as SessionUserLike | null;

  if ((!user?.id || !user?.role) && req) {
    const token = (await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    })) as SessionUserLike | null;

    if (token) {
      user = {
        ...user,
        id: user?.id ?? token.id ?? token.uid ?? token.sub,
        name: user?.name ?? token.name,
        email: user?.email ?? token.email,
        role: user?.role ?? token.role,
      };
    }
  }

  if (!user?.id && !user?.email) return null;

  let id = String(user?.id ?? user?.uid ?? user?.sub ?? "");
  let role = normalizeRole(user?.role);
  let name = String(user?.name ?? "");
  const email = String(user?.email ?? "");

  if ((!id || !role) && email) {
    const dbUser = await getUserWithPermissionsByEmail(email);
    if (!dbUser?.isActive) return null;

    id = id || dbUser.id;
    role = role || dbUser.role;
    name = name || dbUser.fullName;
  }

  if (id && !role) {
    const dbUser = await prisma.user.findUnique({
      where: { id },
      select: {
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!dbUser?.isActive) return null;
    role = normalizeRole(dbUser.role);
    name = name || String(dbUser.fullName ?? "");
  }

  return {
    id,
    userId: id,
    name,
    email,
    role,
  };
}

export async function requireUser(req?: Request): Promise<GuardResult> {
  const auth = await readSessionUser(req);

  if (!auth?.id) {
    return {
      ok: false,
      response: unauthorized(),
    };
  }

  return {
    ok: true,
    auth,
  };
}

export async function requireRole(
  roles: readonly (AppRole | string)[],
  req?: Request
): Promise<GuardResult> {
  const guard = await requireUser(req);
  if (!guard.ok) return guard;

  const currentRole = normalizeRole(guard.auth.role);
  const allowed = roles.map((r) => normalizeRole(r)).filter(Boolean);

  if (!currentRole || !allowed.includes(currentRole)) {
    return {
      ok: false,
      response: forbidden("Vous n’avez pas l’autorisation requise."),
    };
  }

  return guard;
}

export async function requireRoles(
  roles: readonly (AppRole | string)[],
  req?: Request
): Promise<GuardResult> {
  return requireRole(roles, req);
}

export async function requirePermission(
  permission: string,
  req?: Request
): Promise<GuardResult> {
  const guard = await requireUser(req);
  if (!guard.ok) return guard;

  if (!hasPermission(guard.auth.role, permission)) {
    return {
      ok: false,
      response: forbidden("Permission insuffisante."),
    };
  }

  return guard;
}

export async function getUserWithPermissionsByEmail(email: string) {
  const safeEmail = String(email ?? "").trim().toLowerCase();
  if (!safeEmail) return null;

  const prismaAny = prisma as any;

  const user = await prismaAny.user.findFirst({
    where: {
      email: {
        equals: safeEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) return null;

  const role = normalizeRole(user.role);
  const id = String(user.id);

  return {
    id,
    userId: id,
    fullName: String(user.fullName ?? ""),
    email: String(user.email ?? ""),
    role,
    isActive: Boolean(user.isActive),
    hasPermission: (permission: string) => hasPermission(role, permission),
  };
}
