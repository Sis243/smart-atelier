"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardTopActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/dashboard/orders/nouvelle"
        className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
      >
        + Nouvelle commande
      </Link>

      <Link
        href="/dashboard/orders"
        className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
      >
        Voir les commandes
      </Link>

      <div className="ml-auto md:ml-2">
        <LogoutButton />
      </div>
    </div>
  );
}
