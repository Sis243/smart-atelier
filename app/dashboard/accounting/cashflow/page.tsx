"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalIn: number;
  totalOut: number;
  netCash: number;
};

export default function CashflowPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const res = await fetch("/api/accounting/reports/cashflow", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (mounted && data?.ok) setStats(data.stats);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { label: "Entrées", value: stats?.totalIn ?? 0 },
    { label: "Sorties", value: stats?.totalOut ?? 0 },
    { label: "Trésorerie nette", value: stats?.netCash ?? 0 },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Trésorerie</h1>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <div className="text-sm text-zinc-300">{c.label}</div>
              <div className="mt-3 text-3xl font-semibold">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
