// lib/authz.ts
import { prisma } from "@/lib/db";

export type Permission = { id: string; key: string; label: string };

export async function getUserWithPermissionsByEmail(email: string) {
  // 1) user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user) return null;

  // 2) permissions via table pivot (on évite de dépendre du nom de relation)
  const rows = await prisma.userPermission.findMany({
    where: { userId: user.id },
    select: {
      permission: { select: { id: true, key: true, label: true } },
    },
  });

  const permissions = rows.map((r) => r.permission);

  return {
    ...user,
    permissions,
  };
}

export function hasPermission(perms: Permission[] | null | undefined, key: string) {
  const k = (key ?? "").toUpperCase();
  return Array.isArray(perms) && perms.some((p) => (p.key ?? "").toUpperCase() === k);
}
