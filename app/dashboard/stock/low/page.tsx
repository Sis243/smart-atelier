"use client";

import { useEffect, useState } from "react";
import { PageHeader, SectionCard, DataTable, EmptyState } from "@/components/ui";

type Item = {
  id: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  updatedAt?: string;
};

export default function StockLowPage() {
  const [items, setItems] = useState<Item[]>([]);

  async function loadData() {
    const res = await fetch("/api/stock/low", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setItems(data.items || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Stock faible"
        subtitle="Articles sous le seuil minimum."
        actions={[{ label: "Retour stock", href: "/dashboard/stock" }]}
      />

      <SectionCard title="Articles en alerte">
        <DataTable
          headers={["Nom", "Catégorie", "Unité", "Quantité", "Seuil min", "Dernière mise à jour"]}
          empty={
            <EmptyState
              title="Aucune alerte"
              description="Aucun article n’est sous le seuil."
            />
          }
          colSpan={6}
        >
          {items.length > 0
            ? items.map((item) => (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{item.category ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{item.unit ?? "—"}</td>
                  <td className="px-4 py-3 text-red-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-zinc-300">{item.minQuantity}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString("fr-FR") : "—"}
                  </td>
                </tr>
              ))
            : null}
        </DataTable>
      </SectionCard>
    </main>
  );
}