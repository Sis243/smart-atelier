import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserWithPermissionsByEmail } from "@/lib/authz";
import { hasPermission } from "@/lib/role-permissions";

type Props = {
  children: ReactNode;
};

export default async function UsersLayout({ children }: Props) {
  const session = await getServerSession(authOptions);
  const email = String((session as any)?.user?.email ?? "").trim();

  if (!email) {
    redirect("/login");
  }

  const u = await getUserWithPermissionsByEmail(email);

  if (!u || !u.isActive) {
    redirect("/login");
  }

  if (!hasPermission(u.role, "users.view")) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}