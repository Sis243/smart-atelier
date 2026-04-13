import { ReactNode } from "react";
import { getAuthUser } from "@/lib/auth-helpers";
import { canSeeMoney } from "@/lib/access";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

export default async function MoneyGuard({ children, fallback = null }: Props) {
  const auth = await getAuthUser();

  if (!canSeeMoney(auth.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}