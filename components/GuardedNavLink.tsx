"use client";

import Link from "next/link";
import {
  canAccessModule,
  canAccessModuleWithPermissions,
  type ModuleKey,
} from "@/lib/access";

type Props = {
  role: string;
  permissionKeys?: string[];
  moduleKey: ModuleKey;
  href: string;
  label: string;
};

export default function GuardedNavLink({
  role,
  permissionKeys,
  moduleKey,
  href,
  label,
}: Props) {
  const allowed = permissionKeys
    ? canAccessModuleWithPermissions(role, permissionKeys, moduleKey)
    : canAccessModule(role, moduleKey);

  if (!allowed) return null;

  return (
    <Link
      href={href}
      target="_self"
      className="flex items-center justify-between rounded-xl px-3 py-2 text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      <span>{label}</span>
      <span className="text-[10px] text-white/35">→</span>
    </Link>
  );
}
