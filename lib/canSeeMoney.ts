// lib/canSeeMoney.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const MONEY_ROLES = ["SUPERADMIN", "ADMIN", "MANAGER", "CAISSIER", "COMPTABLE"] as const;

export async function getCanSeeMoney() {
  const session = await getServerSession(authOptions);
  const role = String((session as any)?.user?.role ?? "").toUpperCase();

  return MONEY_ROLES.includes(role as any);
}