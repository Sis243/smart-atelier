"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, SectionCard, StatCard, EmptyState } from "@/components/ui";

type AnalyticsData = {
  kpi: {
    totalItems: number;
    totalQty: number;
    totalValue: number;
    lowCount: number;
  };
  topOut: Array<{
    itemId: string;
    name: string;
    outQty: number;
  }>;
  byCategory: Array<{
    category: string;
    items: number;
    quantity: number;
    value: number;
  }>;
  lowItems: Array<{
    id: string;
    name: string;
    category?: string | null;
    quantity: number;
    minQuantity: number;
  }>;
};

function money(v: number) {
  return Number(v || 0).toLocaleString("fr-FR");
}

export default function StockAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [search, setSearch] = useState("");

  async function loadData() {
    const res = await fetch("/api/stock/analytics", { cache: "no-store" });
    const json = await res.json();
    if (json?.ok) {
      setData({
        kpi: json.kpi,
        topOut: json.topOut || [],
        byCategory: json.byCategory || [],
        lowItems: json.lowItems || [],
      });
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredLowItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data?.lowItems ?? [];
    return (data?.lowItems ?? []).filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        String(item.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Analytics stock"
        subtitle="Vue décisionnelle du stock, des sorties et des alertes."
        actions={[
          { label: "Retour stock", href: "/dashboard/stock" },
          { label: "Stock faible", href: "/dashboard/stock/low" },
          { label: "Exporter CSV", href: "/api/stock/export?format=csv", variant: "primary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Articles" value={data?.kpi.totalItems ?? 0} helper="Articles enregistrés" />
        <StatCard label="Quantité totale" value={money(data?.kpi.totalQty ?? 0)} helper="Volume global" />
        <StatCard label="Valeur stock" value={money(data?.kpi.totalValue ?? 0)} helper="Valorisation théorique" />
        <StatCard
          label="Alertes stock"
          value={data?.kpi.lowCount ?? 0}
          helper="Articles sous seuil"
          danger={(data?.kpi.lowCount ?? 0) > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Top sorties" subtitle="Articles les plus sortis du stock">
          {(data?.topOut ?? []).length === 0 ? (
            <EmptyState
              title="Aucune donnée"
              description="Les sorties stock apparaîtront ici."
            />
          ) : (
            <div className="space-y-3">
              {(data?.topOut ?? []).map((row, index) => (
                <div
                  key={row.itemId}
                  className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-zinc-400">#{index + 1}</div>
                      <div className="text-sm font-semibold text-white">{row.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-400">Sorties cumulées</div>
                      <div className="text-lg font-bold text-amber-300">{row.outQty}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Répartition par catégorie" subtitle="Nombre d’articles, quantité et valeur">
          {(data?.byCategory ?? []).length === 0 ? (
            <EmptyState
              title="Aucune catégorie"
              description="Les catégories apparaîtront ici."
            />
          ) : (
            <div className="space-y-3">
              {(data?.byCategory ?? []).map((row) => (
                <div
                  key={row.category}
                  className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{row.category}</div>
                    <div className="text-xs text-zinc-400">{row.items} article(s)</div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm xl:grid-cols-3">
                    <div className="rounded-xl bg-white/5 p-3">
                      <div className="text-zinc-400">Quantité</div>
                      <div className="mt-1 font-semibold text-white">{row.quantity}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <div className="text-zinc-400">Valeur</div>
                      <div className="mt-1 font-semibold text-white">{money(row.value)}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3 col-span-2 xl:col-span-1">
                      <div className="text-zinc-400">Poids catalogue</div>
                      <div className="mt-1 font-semibold text-white">{row.items}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Alertes détaillées" subtitle="Recherche rapide dans les articles sous le seuil">
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article ou une catégorie..."
            className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />
        </div>

        {filteredLowItems.length === 0 ? (
          <EmptyState
            title="Aucune alerte trouvée"
            description="Aucun article ne correspond à cette recherche."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filteredLowItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-red-400/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {item.category ?? "Sans catégorie"}
                    </div>
                  </div>
                  <div className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 ring-1 ring-red-400/20">
                    Stock faible
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-zinc-400">Quantité actuelle</div>
                    <div className="mt-1 font-semibold text-red-300">{item.quantity}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-zinc-400">Seuil minimum</div>
                    <div className="mt-1 font-semibold text-white">{item.minQuantity}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </main>
  );
}