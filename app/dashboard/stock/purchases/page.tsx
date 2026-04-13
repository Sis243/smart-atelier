"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  SectionCard,
  DataTable,
  EmptyState,
  FormField,
} from "@/components/ui";

type Item = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
};

type Purchase = {
  id: string;
  quantity: number;
  unitCost: number;
  currency: string;
  reference?: string | null;
  purchasedAt: string;
  item: {
    name: string;
  };
  supplier?: {
    name: string;
  } | null;
};

export default function StockPurchasesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [itemId, setItemId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unitCost, setUnitCost] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [reference, setReference] = useState("");
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("TOUT");
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      fetch("/api/stock/items", { cache: "no-store" }),
      fetch("/api/stock/suppliers", { cache: "no-store" }),
      fetch("/api/stock/purchases", { cache: "no-store" }),
    ]);

    const d1 = await r1.json();
    const d2 = await r2.json();
    const d3 = await r3.json();

    if (d1?.ok) {
      setItems(d1.items || []);
      if (d1.items?.length) {
        setItemId((current) => current || d1.items[0].id);
      }
    }
    if (d2?.ok) {
      setSuppliers(d2.suppliers || []);
      if (d2.suppliers?.length) {
        setSupplierId((current) => current || d2.suppliers[0].id);
      }
    }
    if (d3?.ok) setPurchases(d3.purchases || []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        purchase.item.name.toLowerCase().includes(q) ||
        String(purchase.supplier?.name ?? "").toLowerCase().includes(q) ||
        String(purchase.reference ?? "").toLowerCase().includes(q);

      const matchCurrency =
        currencyFilter === "TOUT" || purchase.currency === currencyFilter;

      return matchSearch && matchCurrency;
    });
  }, [purchases, search, currencyFilter]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const res = await fetch("/api/stock/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          supplierId: supplierId || null,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          currency,
          reference,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Achat impossible");

      setQuantity("0");
      setUnitCost("0");
      setReference("");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Achats stock"
        subtitle="Recherche, filtres et impression des achats."
        actions={[
          { label: "Retour stock", href: "/dashboard/stock" },
          { label: "Exporter CSV", href: "/api/stock/export?format=csv", variant: "primary" },
        ]}
      />

      <SectionCard title="Nouvel achat">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <FormField label="Article">
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Fournisseur">
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="">—</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Référence">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <FormField label="Quantité">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <FormField label="Coût unitaire">
            <input
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <FormField label="Devise">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </FormField>

          <div className="xl:col-span-3 flex items-center gap-3">
            <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
              Enregistrer achat
            </button>
            {err ? <span className="text-sm text-red-300">{err}</span> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Recherche et filtres">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Recherche">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Article, fournisseur, référence..."
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <FormField label="Devise">
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="TOUT">Toutes</option>
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title={`Historique achats (${filteredPurchases.length})`}>
        <DataTable
          headers={["Date", "Article", "Fournisseur", "Qté", "Coût unitaire", "Devise", "Référence", "Bon"]}
          empty={
            <EmptyState
              title="Aucun achat"
              description="Aucun résultat avec ces filtres."
            />
          }
          colSpan={8}
        >
          {filteredPurchases.length > 0
            ? filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-zinc-300">
                    {new Date(purchase.purchasedAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{purchase.item.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{purchase.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{purchase.quantity}</td>
                  <td className="px-4 py-3 text-zinc-300">{purchase.unitCost}</td>
                  <td className="px-4 py-3 text-zinc-300">{purchase.currency}</td>
                  <td className="px-4 py-3 text-zinc-300">{purchase.reference ?? "—"}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/stock/purchases/${purchase.id}/receipt`}
                      className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15"
                    >
                      Imprimer
                    </a>
                  </td>
                </tr>
              ))
            : null}
        </DataTable>
      </SectionCard>
    </main>
  );
}
