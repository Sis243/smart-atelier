import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adapte le chemin si différent

export async function requireAnyRole(roles: string[]) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || !role || !roles.includes(role)) {
    return { ok: false as const, session: null };
  }
  return { ok: true as const, session };
}
