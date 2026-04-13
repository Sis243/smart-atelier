import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { normalizeRole } from "@/lib/role-permissions";

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user ?? null;

  return {
    session,
    user,
    isAuthenticated: !!user,
    userId: String(user?.id ?? ""),
    role: normalizeRole(user?.role),
    name: String(user?.name ?? ""),
    email: String(user?.email ?? ""),
  };
}