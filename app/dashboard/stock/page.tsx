"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/ui";
import LowStockPanel from "@/components/stock/LowStockPanel";

type DashboardData = {
  stats: {
    totalItems: number;
    totalQuantity: number;
    totalValuation: number;
    lowCount: number;
    movesCount: number;
    purchasesCount: number;
    suppliersCount: number;
  };
  lowItems: Array<{
    id: string;
    name: string;
    quantity: number;
    minQuantity: number;
  }>;
  recentMoves: Array<{
    id: string;
    type: string;
    quantity: number;
    note?: string | null;
    movedAt: string;
    item: {
      name: string;
    };
  }>;
};

function money(v: number) {
  return Number(v || 0).toLocaleString("fr-FR");
}

export default function StockDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function loadData() {
    const res = await fetch("/api/stock/dashboard", { cache: "no-store" });
    const json = await res.json();
    if (json?.ok) setData(json.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Stock premium"
        subtitle="Pilotage des articles, mouvements, fournisseurs et achats."
        actions={[
          { label: "Articles", href: "/dashboard/stock/items" },
          { label: "Mouvements", href: "/dashboard/stock/moves" },
          { label: "Fournisseurs", href: "/dashboard/stock/suppliers" },
          { label: "Achats", href: "/dashboard/stock/purchases" },
          { label: "Analytics", href: "/dashboard/stock/analytics" },
          { label: "Stock faible", href: "/dashboard/stock/low" },
          { label: "Presets", href: "/dashboard/stock/presets" },
          { label: "Exporter CSV", href: "/api/stock/export?format=csv", variant: "primary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Articles" value={data?.stats.totalItems ?? 0} helper="Articles enregistrés" />
        <StatCard label="Quantité totale" value={money(data?.stats.totalQuantity ?? 0)} helper="Somme des stocks" />
        <StatCard label="Valorisation" value={money(data?.stats.totalValuation ?? 0)} helper="Valeur théorique stock" />
        <StatCard label="Stock faible" value={data?.stats.lowCount ?? 0} helper="Articles à surveiller" danger={(data?.stats.lowCount ?? 0) > 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <StatCard label="Mouvements" value={data?.stats.movesCount ?? 0} helper="Entrées / sorties / ajustements" />
        <StatCard label="Achats" value={data?.stats.purchasesCount ?? 0} helper="Achats stock enregistrés" />
        <StatCard label="Fournisseurs" value={data?.stats.suppliersCount ?? 0} helper="Partenaires stock" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Alertes stock"
          subtitle="Articles en seuil minimum ou critique"
        >
          <LowStockPanel items={data?.lowItems ?? []} />
        </SectionCard>

        <SectionCard
          title="Mouvements récents"
          subtitle="Derniers mouvements enregistrés"
        >
          <div className="space-y-3">
            {(data?.recentMoves ?? []).length === 0 ? (
              <div className="text-sm text-zinc-400">Aucun mouvement récent.</div>
            ) : (
              (data?.recentMoves ?? []).map((move) => (
                <div key={move.id} className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">{move.item.name}</div>
                    <div className="text-xs text-zinc-300">{move.type}</div>
                  </div>
                  <div className="mt-1 text-sm text-zinc-300">
                    Quantité : <b>{move.quantity}</b>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {new Date(move.movedAt).toLocaleString("fr-FR")}
                  </div>
                  {move.note ? (
                    <div className="mt-2 text-xs text-zinc-400">{move.note}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}