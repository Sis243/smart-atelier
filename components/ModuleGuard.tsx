import "server-only";

import { ReactNode } from "react";
import { getAuthUser } from "@/lib/auth-helpers";
import { canAccessModuleWithPermissions } from "@/lib/access";
import EmptyState from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";

type ModuleKey =
  | "dashboard"
  | "users"
  | "customers"
  | "orders"
  | "cut"
  | "production"
  | "quality"
  | "delivery"
  | "stock"
  | "hr"
  | "accounting"
  | "chat"
  | "activity";

type Props = {
  moduleKey: ModuleKey;
  children: ReactNode;
};

export default async function ModuleGuard({ moduleKey, children }: Props) {
  const auth = await getAuthUser();

  if (!auth?.userId) {
    return <>{children}</>;
  }

  const userPermissions = await prisma.userPermission.findMany({
    where: { userId: auth.userId },
    select: { permission: { select: { key: true } } },
  });
  const permissionKeys = userPermissions.map((row) => row.permission.key);

  if (!canAccessModuleWithPermissions(auth.role, permissionKeys, moduleKey)) {
    return (
      <EmptyState
        title="Accès refusé"
        description="Vous n’avez pas l’autorisation d’ouvrir ce module."
      />
    );
  }

  return <>{children}</>;
}
