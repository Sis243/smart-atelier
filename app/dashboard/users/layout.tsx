import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth"; // <-- change ce chemin si chez toi c’est ailleurs
import { getUserWithPermissionsByEmail, hasPermission } from "@/lib/authz";

export default async function UsersLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // pas connecté -> login
  const email = session?.user?.email;
  if (!email) redirect("/login");

  // user + permissions
  const u = await getUserWithPermissionsByEmail(email);
  if (!u) redirect("/login");

  // désactivé -> login
  if (!u.isActive) redirect("/login");

  // superadmin -> ok
  const role = (u.role ?? "").toUpperCase();
  if (role === "SUPERADMIN") return <>{children}</>;

  // permission obligatoire
  if (!hasPermission(u.permissions, "USERS_VIEW")) {
    redirect("/dashboard"); // ou une page /403 si tu veux
  }

  return <>{children}</>;
}
