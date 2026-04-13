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

type Move = {
  id: string;
  type: string;
  quantity: number;
  note?: string | null;
  movedAt: string;
  item: {
    id?: string;
    name: string;
  };
};

export default function StockMovesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [itemId, setItemId] = useState("");
  const [type, setType] = useState("OUT");
  const [quantity, setQuantity] = useState("0");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("TOUT");
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/stock/items", { cache: "no-store" }),
      fetch("/api/stock/moves", { cache: "no-store" }),
    ]);

    const d1 = await r1.json();
    const d2 = await r2.json();

    if (d1?.ok) {
      setItems(d1.items || []);
      if (d1.items?.length) {
        setItemId((current) => current || d1.items[0].id);
      }
    }
    if (d2?.ok) setMoves(d2.moves || []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredMoves = useMemo(() => {
    return moves.filter((move) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        move.item.name.toLowerCase().includes(q) ||
        String(move.note ?? "").toLowerCase().includes(q);

      const matchType = typeFilter === "TOUT" || move.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [moves, search, typeFilter]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const res = await fetch("/api/stock/moves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          type,
          quantity: Number(quantity),
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Mouvement impossible");

      setQuantity("0");
      setNote("");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Mouvements stock"
        subtitle="Entrées, sorties, ajustements, recherche et impression."
        actions={[
          { label: "Retour stock", href: "/dashboard/stock" },
          { label: "Exporter CSV", href: "/api/stock/export?format=csv", variant: "primary" },
        ]}
      />

      <SectionCard title="Nouveau mouvement">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-4">
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

          <FormField label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="IN">Entrée</option>
              <option value="OUT">Sortie</option>
              <option value="ADJUST">Ajustement</option>
            </select>
          </FormField>

          <FormField label="Quantité">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <FormField label="Note">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <div className="xl:col-span-4 flex items-center gap-3">
            <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
              Enregistrer
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
              placeholder="Article ou note..."
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <FormField label="Type">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="TOUT">Tous</option>
              <option value="IN">Entrées</option>
              <option value="OUT">Sorties</option>
              <option value="ADJUST">Ajustements</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title={`Historique mouvements (${filteredMoves.length})`}>
        <DataTable
          headers={["Date", "Article", "Type", "Quantité", "Note", "Bon"]}
          empty={
            <EmptyState
              title="Aucun mouvement"
              description="Aucun résultat avec ces filtres."
            />
          }
          colSpan={6}
        >
          {filteredMoves.length > 0
            ? filteredMoves.map((move) => (
                <tr key={move.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-zinc-300">
                    {new Date(move.movedAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{move.item.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{move.type}</td>
                  <td className="px-4 py-3 text-zinc-300">{move.quantity}</td>
                  <td className="px-4 py-3 text-zinc-300">{move.note ?? "—"}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/stock/moves/${move.id}/receipt`}
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
