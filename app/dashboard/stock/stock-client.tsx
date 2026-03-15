"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type StockItem = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  updatedAt: string;
};

type StockMove = {
  id: string;
  itemId: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  note: string | null;
  movedAt: string;
};

type KPI = {
  totalItems: number;
  totalQty: number;
  totalValue: number;
  lowCount: number;
};

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function pill(kind: "ok" | "low") {
  return kind === "low"
    ? "px-2 py-1 text-[11px] rounded-full bg-red-500/15 text-red-200 ring-1 ring-red-400/20"
    : "px-2 py-1 text-[11px] rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20";
}

export default function StockClient() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");

  const [items, setItems] = useState<StockItem[]>([]);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [selected, setSelected] = useState<StockItem | null>(null);

  const [tab, setTab] = useState<"ALL" | "LOW">("ALL");
  const [q, setQ] = useState("");

  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // KPI
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [topOut, setTopOut] = useState<{ itemId: string; name: string; outQty: number }[]>([]);

  // Create item form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newQty, setNewQty] = useState("0");
  const [newMin, setNewMin] = useState("0");
  const [newCost, setNewCost] = useState("0");

  // Move form
  const [mType, setMType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [mQty, setMQty] = useState("");
  const [mNote, setMNote] = useState("");

  async function loadKPI() {
    try {
      const res = await fetch("/api/stock/kpi", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setKpi(data.kpi ?? null);
      setTopOut(Array.isArray(data.topOut) ? data.topOut : []);
    } catch {}
  }

  async function loadItems() {
    setErr(null);
    setBusy("loadItems");
    try {
      const res = await fetch("/api/stock/items", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur chargement stock");
      setItems(Array.isArray(data.items) ? data.items : []);
      loadKPI();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function loadLow() {
    setErr(null);
    setBusy("loadLow");
    try {
      const res = await fetch("/api/stock/low", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur stock bas");
      setItems(Array.isArray(data.items) ? data.items : []);
      loadKPI();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function loadMoves(itemId: string) {
    setErr(null);
    setBusy("loadMoves");
    try {
      const res = await fetch(`/api/stock/items/${itemId}/moves`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur chargement mouvements");
      setMoves(Array.isArray(data.moves) ? data.moves : []);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (tab === "ALL") loadItems();
    else loadLow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!focusId || !items.length) return;
    const found = items.find((i) => i.id === focusId);
    if (found) {
      setSelected(found);
      loadMoves(found.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, items.length]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => {
      return (
        i.name.toLowerCase().includes(s) ||
        (i.category ?? "").toLowerCase().includes(s) ||
        (i.unit ?? "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  async function createItem() {
    setErr(null);
    setBusy("createItem");
    try {
      const payload = {
        name: newName,
        category: newCategory || null,
        unit: newUnit || null,
        quantity: Number(newQty || 0),
        minQuantity: Number(newMin || 0),
        unitCost: Number(newCost || 0),
      };

      const res = await fetch("/api/stock/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erreur création article");

      setNewName("");
      setNewCategory("");
      setNewUnit("");
      setNewQty("0");
      setNewMin("0");
      setNewCost("0");

      if (tab === "ALL") await loadItems();
      else await loadLow();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function updateFields(itemId: string, patch: Partial<Pick<StockItem, "minQuantity" | "unitCost">>) {
    setErr(null);
    setBusy("updateFields");
    try {
      const res = await fetch(`/api/stock/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erreur mise à jour");

      if (tab === "ALL") await loadItems();
      else await loadLow();

      if (selected?.id === itemId) setSelected((s) => (s ? { ...s, ...patch } as any : s));
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function addMove() {
    if (!selected) return;
    setErr(null);
    setBusy("addMove");
    try {
      const qty = Number(mQty || 0);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantité invalide");

      const payload = { type: mType, quantity: qty, note: mNote || null };

      const res = await fetch(`/api/stock/items/${selected.id}/moves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erreur mouvement");

      setMQty("");
      setMNote("");

      if (tab === "ALL") await loadItems();
      else await loadLow();

      const itemRes = await fetch(`/api/stock/items/${selected.id}`, { cache: "no-store" });
      const itemData = await itemRes.json();
      if (itemRes.ok) setSelected(itemData.item);

      await loadMoves(selected.id);
      loadKPI();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  }

  function exportFile(format: "csv" | "excel") {
    window.open(`/api/stock/export?format=${format}`, "_blank", "noopener,noreferrer");
  }

  function printMove(moveId: string) {
    window.open(`/api/stock/moves/${moveId}/receipt`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      {/* KPI + Export */}
      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Dashboard KPI</h2>
            <p className="mt-1 text-sm text-zinc-300/80">
              Vue rapide: quantités, valeur stock, stock bas, top sorties.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exportFile("csv")}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportFile("excel")}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
            <div className="text-xs text-zinc-300/70">Articles</div>
            <div className="mt-1 text-xl font-semibold">{kpi?.totalItems ?? "—"}</div>
          </div>
          <div className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
            <div className="text-xs text-zinc-300/70">Quantité totale</div>
            <div className="mt-1 text-xl font-semibold">
              {kpi ? kpi.totalQty.toLocaleString("fr-FR") : "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
            <div className="text-xs text-zinc-300/70">Valeur stock (Σ qty×coût)</div>
            <div className="mt-1 text-xl font-semibold">
              {kpi ? kpi.totalValue.toLocaleString("fr-FR") : "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
            <div className="text-xs text-zinc-300/70">Stock bas</div>
            <div className="mt-1 text-xl font-semibold">{kpi?.lowCount ?? "—"}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-sm font-semibold">Top sorties (OUT)</div>
          <div className="mt-2 space-y-2">
            {topOut.length === 0 ? (
              <div className="text-sm text-zinc-300/80">Aucune sortie enregistrée.</div>
            ) : (
              topOut.map((t) => (
                <div key={t.itemId} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-100">{t.name}</span>
                  <span className="text-zinc-300/80">{t.outQty.toLocaleString("fr-FR")}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Corps (liste + détail) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* LEFT: LIST */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setTab("ALL")}
                  className={cls(
                    "rounded-xl px-4 py-2 text-sm ring-1 ring-white/10",
                    tab === "ALL" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  Tous les articles
                </button>
                <button
                  onClick={() => setTab("LOW")}
                  className={cls(
                    "rounded-xl px-4 py-2 text-sm ring-1 ring-white/10",
                    tab === "LOW" ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  Stock bas
                </button>
              </div>

              <button
                onClick={() => (tab === "ALL" ? loadItems() : loadLow())}
                disabled={!!busy}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
              >
                Rafraîchir
              </button>
            </div>

            <div className="mt-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (nom, catégorie, unité)…"
                className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
            </div>

            {err && (
              <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
                {err}
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-zinc-200">
                  <tr>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Seuil</th>
                    <th className="px-4 py-3">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((i) => {
                    const low = i.quantity < i.minQuantity;
                    return (
                      <tr
                        key={i.id}
                        className={cls("cursor-pointer hover:bg-white/5", selected?.id === i.id && "bg-white/5")}
                        onClick={() => {
                          setSelected(i);
                          loadMoves(i.id);
                        }}
                      >
                        <td className="px-4 py-3 font-medium">{i.name}</td>
                        <td className="px-4 py-3 text-zinc-300/80">{i.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          {i.quantity.toLocaleString("fr-FR")} {i.unit ?? ""}
                        </td>
                        <td className="px-4 py-3 text-zinc-300/80">{i.minQuantity.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3">
                          <span className={pill(low ? "low" : "ok")}>{low ? "STOCK BAS" : "OK"}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-zinc-300/80" colSpan={5}>
                        Aucun article.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CREATE ITEM */}
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Créer un article</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom *"
                className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Catégorie"
                className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
              <input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Unité (m, pcs, kg…)"
                className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />

              <input
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Quantité initiale"
                type="number"
                className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
              <input
                value={newMin}
                onChange={(e) => setNewMin(e.target.value)}
                placeholder="Seuil min"
                type="number"
                className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />
              <input
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="Coût unitaire"
                type="number"
                className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              />

              <button
                onClick={createItem}
                disabled={!!busy}
                className="md:col-span-6 rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
              >
                + Ajouter l’article
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: DETAIL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Détails & Mouvements</h2>

            {!selected ? (
              <p className="mt-3 text-sm text-zinc-300/80">
                Sélectionne un article à gauche pour voir les mouvements.
              </p>
            ) : (
              <>
                <div className="mt-4 rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                  <div className="text-sm font-semibold">{selected.name}</div>
                  <div className="mt-1 text-xs text-zinc-300/70">
                    {selected.category ?? "—"} • unité: {selected.unit ?? "—"}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-zinc-300/70">Stock actuel</div>
                    <div className="text-sm font-semibold">
                      {selected.quantity.toLocaleString("fr-FR")} {selected.unit ?? ""}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-zinc-300/70">Seuil min</div>
                    <div className="text-sm font-semibold">{selected.minQuantity.toLocaleString("fr-FR")}</div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-zinc-300/70">Coût unitaire</div>
                    <div className="text-sm font-semibold">{selected.unitCost.toLocaleString("fr-FR")}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <label className="text-xs text-zinc-300/70">Seuil min (blur = save)</label>
                    <input
                      defaultValue={String(selected.minQuantity)}
                      onBlur={(e) => updateFields(selected.id, { minQuantity: Number(e.target.value || 0) })}
                      className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                      type="number"
                    />

                    <label className="text-xs text-zinc-300/70">Coût unitaire (blur = save)</label>
                    <input
                      defaultValue={String(selected.unitCost)}
                      onBlur={(e) => updateFields(selected.id, { unitCost: Number(e.target.value || 0) })}
                      className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                      type="number"
                    />
                  </div>
                </div>

                {/* ADD MOVE */}
                <div className="mt-4 rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                  <p className="text-sm font-semibold">Nouveau mouvement</p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <select
                      value={mType}
                      onChange={(e) => setMType(e.target.value as any)}
                      className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                    >
                      <option value="IN">IN (Entrée)</option>
                      <option value="OUT">OUT (Sortie)</option>
                      <option value="ADJUST">ADJUST (Fixer stock)</option>
                    </select>

                    <input
                      value={mQty}
                      onChange={(e) => setMQty(e.target.value)}
                      placeholder={mType === "ADJUST" ? "Nouveau stock (ex: 120)" : "Quantité (ex: 5)"}
                      type="number"
                      className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                    />

                    <input
                      value={mNote}
                      onChange={(e) => setMNote(e.target.value)}
                      placeholder="Note (optionnel)"
                      className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
                    />

                    <button
                      onClick={addMove}
                      disabled={!!busy}
                      className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
                    >
                      Valider mouvement
                    </button>

                    <p className="text-[11px] text-zinc-300/60">
                      IN = ajoute • OUT = retire • ADJUST = remplace le stock par la valeur.
                    </p>
                  </div>
                </div>

                {/* MOVES HISTORY */}
                <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
                  <div className="bg-white/5 px-4 py-3 text-sm font-semibold">Historique</div>
                  <div className="divide-y divide-white/10">
                    {moves.map((m) => (
                      <div key={m.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-zinc-300/70">
                            {new Date(m.movedAt).toLocaleString("fr-FR")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{m.type}</span>
                            <button
                              onClick={() => printMove(m.id)}
                              className="rounded-lg bg-white/10 px-2 py-1 text-xs ring-1 ring-white/10 hover:bg-white/15"
                            >
                              Bon
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 text-sm">
                          {m.quantity.toLocaleString("fr-FR")} {selected.unit ?? ""}
                        </div>
                        {m.note ? <div className="mt-1 text-xs text-zinc-300/70">{m.note}</div> : null}
                      </div>
                    ))}
                    {moves.length === 0 && (
                      <div className="px-4 py-6 text-sm text-zinc-300/80">Aucun mouvement.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
