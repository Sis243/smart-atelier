"use client";

import { useEffect, useMemo, useState } from "react";

type Currency = "USD" | "CDF";

type Preset = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  minQuantity: number;
  unitCost: number;
};

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type StockItem = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  quantity: number;
  minQuantity: number;
  unitCost: number;
};

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function j<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // @ts-ignore
    return { raw: text } as T;
  }
}

/**
 * ✅ Form PRO:
 * - Checklist déroulante (presets) + "autre" saisie
 * - Auto-catégorisation selon preset choisi
 * - Catégorie/Unité verrouillables
 * - Quick create "+ nouveau preset"
 * - Gestion fournisseurs + prix d’achat (purchase)
 * - Import stock initial via /api/stock/bootstrap
 */
export default function StockItemForm(props: {
  onCreated?: (item: StockItem) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Selection preset / custom
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const selectedPreset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId) ?? null,
    [presets, selectedPresetId]
  );

  // Locks
  const [lockCategory, setLockCategory] = useState(true);
  const [lockUnit, setLockUnit] = useState(true);

  // Item fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("0");
  const [minQuantity, setMinQuantity] = useState<string>("0");
  const [unitCost, setUnitCost] = useState<string>("0");

  // Purchase (supplier + purchase price)
  const [supplierId, setSupplierId] = useState<string>("");
  const [purchaseQty, setPurchaseQty] = useState<string>("0");
  const [purchaseUnitCost, setPurchaseUnitCost] = useState<string>("0");
  const [purchaseCurrency, setPurchaseCurrency] = useState<Currency>("USD");
  const [purchaseRef, setPurchaseRef] = useState<string>("");

  // Quick create preset
  const [showNewPreset, setShowNewPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCategory, setNewPresetCategory] = useState("");
  const [newPresetUnit, setNewPresetUnit] = useState("");
  const [newPresetMin, setNewPresetMin] = useState<string>("0");
  const [newPresetCost, setNewPresetCost] = useState<string>("0");

  async function loadLists() {
    setErr(null);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/stock/presets", { cache: "no-store" }),
        fetch("/api/stock/suppliers", { cache: "no-store" }),
      ]);
      const pData = await j<{ presets: Preset[] }>(pRes);
      const sData = await j<{ suppliers: Supplier[] }>(sRes);

      setPresets(Array.isArray(pData?.presets) ? pData.presets : []);
      setSuppliers(Array.isArray(sData?.suppliers) ? sData.suppliers : []);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur chargement listes");
    }
  }

  useEffect(() => {
    loadLists();
  }, []);

  // Auto-fill when preset selected
  useEffect(() => {
    if (!selectedPreset) return;

    setName(selectedPreset.name);

    if (lockCategory) setCategory(selectedPreset.category ?? "");
    if (lockUnit) setUnit(selectedPreset.unit ?? "");

    setMinQuantity(String(selectedPreset.minQuantity ?? 0));
    setUnitCost(String(selectedPreset.unitCost ?? 0));
  }, [selectedPresetId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function bootstrapInitialStock() {
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/stock/bootstrap", { method: "POST" });
      const data = await j<any>(res);
      if (!res.ok) throw new Error(data?.error || "Bootstrap échoué");
      setMsg("✅ Stock initial importé + presets créés.");
      await loadLists();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur bootstrap");
    } finally {
      setLoading(false);
    }
  }

  async function createPresetQuick() {
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const payload = {
        name: newPresetName.trim(),
        category: newPresetCategory.trim() || null,
        unit: newPresetUnit.trim() || null,
        minQuantity: toNum(newPresetMin),
        unitCost: toNum(newPresetCost),
      };
      if (!payload.name) throw new Error("Nom du preset requis");

      const res = await fetch("/api/stock/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await j<any>(res);
      if (!res.ok) throw new Error(data?.error || "Création preset échouée");

      setMsg("✅ Preset créé.");
      setShowNewPreset(false);

      setNewPresetName("");
      setNewPresetCategory("");
      setNewPresetUnit("");
      setNewPresetMin("0");
      setNewPresetCost("0");

      await loadLists();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur preset");
    } finally {
      setLoading(false);
    }
  }

  async function createItem() {
    setLoading(true);
    setMsg(null);
    setErr(null);

    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || null,
        unit: unit.trim() || null,
        quantity: toNum(quantity),
        minQuantity: toNum(minQuantity),
        unitCost: toNum(unitCost),
      };
      if (!payload.name) throw new Error("Article requis");

      const res = await fetch("/api/stock/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await j<any>(res);
      if (!res.ok) throw new Error(data?.error || "Création article échouée");

      const created = data?.item as StockItem;
      setMsg("✅ Article ajouté.");
      props.onCreated?.(created);

      // Optionnel: enregistrer un achat (supplier + prix d’achat)
      const pq = toNum(purchaseQty);
      const puc = toNum(purchaseUnitCost);
      if (created?.id && (pq > 0 || puc > 0 || supplierId)) {
        await fetch("/api/stock/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemName: created.name,
            supplierId: supplierId || null,
            quantity: pq,
            unitCost: puc,
            currency: purchaseCurrency,
            reference: purchaseRef || null,
          }),
        });
      }

      // reset minimal
      setSelectedPresetId("");
      setName("");
      if (!lockCategory) setCategory("");
      if (!lockUnit) setUnit("");
      setQuantity("0");
      setMinQuantity("0");
      setUnitCost("0");

      setSupplierId("");
      setPurchaseQty("0");
      setPurchaseUnitCost("0");
      setPurchaseCurrency("USD");
      setPurchaseRef("");
    } catch (e: any) {
      setErr(e?.message ?? "Erreur création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Ajouter un article</h2>
          <p className="text-sm text-zinc-300/80">
            Checklist + auto-catégorisation + fournisseurs + import initial (PRO)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={bootstrapInitialStock}
            disabled={loading}
            className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-60"
          >
            Importer stock initial
          </button>

          <button
            type="button"
            onClick={() => setShowNewPreset((v) => !v)}
            disabled={loading}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm text-zinc-100 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-60"
          >
            + Nouveau preset
          </button>
        </div>
      </div>

      {msg && (
        <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {err}
        </div>
      )}

      {/* Quick create preset */}
      {showNewPreset && (
        <div className="mt-5 rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-zinc-100">Créer un preset rapide</p>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              placeholder="Nom preset (ex: Wax imprimé)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
            <input
              className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              placeholder="Catégorie (ex: Tissu)"
              value={newPresetCategory}
              onChange={(e) => setNewPresetCategory(e.target.value)}
            />
            <input
              className="md:col-span-1 rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              placeholder="Unité (ex: m)"
              value={newPresetUnit}
              onChange={(e) => setNewPresetUnit(e.target.value)}
            />
            <input
              className="md:col-span-1 rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              placeholder="Seuil min"
              value={newPresetMin}
              onChange={(e) => setNewPresetMin(e.target.value)}
              inputMode="decimal"
            />
            <input
              className="md:col-span-2 rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              placeholder="Coût unitaire"
              value={newPresetCost}
              onChange={(e) => setNewPresetCost(e.target.value)}
              inputMode="decimal"
            />

            <div className="md:col-span-6 flex justify-end">
              <button
                type="button"
                onClick={createPresetQuick}
                disabled={loading}
                className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
              >
                Créer preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form main */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-6">
        {/* Preset selector */}
        <div className="md:col-span-3">
          <label className="mb-1 block text-sm text-zinc-200">Checklist (preset)</label>
          <select
            className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
          >
            <option value="">— Choisir un article (ou laisser vide pour saisir) —</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">
            Si tu choisis un preset: nom/catégorie/unité peuvent être auto-remplis.
          </p>
        </div>

        {/* Locks */}
        <div className="md:col-span-3 flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={lockCategory}
              onChange={(e) => setLockCategory(e.target.checked)}
            />
            Catégorie verrouillable
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-200">
            <input type="checkbox" checked={lockUnit} onChange={(e) => setLockUnit(e.target.checked)} />
            Unité verrouillable
          </label>
        </div>

        {/* Visible fields */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-zinc-200">Article</label>
          <input
            className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Wax imprimé"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-zinc-200">Catégorie</label>
          <input
            className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10 disabled:opacity-60"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={lockCategory && !!selectedPreset}
            placeholder="Ex: Tissu / Fil / Mercerie"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-zinc-200">Unité</label>
          <input
            className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10 disabled:opacity-60"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={lockUnit && !!selectedPreset}
            placeholder="Ex: m / pièce / bobine"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-zinc-200">Quantité</label>
          <input
            className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-zinc-200">Seuil min</label>
          <input
            className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-zinc-200">Coût unitaire</label>
          <input
            className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </div>
      </div>

      {/* Supplier & purchase */}
      <div className="mt-6 rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
        <p className="text-sm font-semibold text-zinc-100">Fournisseur & prix d’achat (optionnel)</p>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-zinc-200">Fournisseur</label>
            <select
              className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">— Aucun —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm text-zinc-200">Qté achat</label>
            <input
              className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm text-zinc-200">Devise</label>
            <select
              className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              value={purchaseCurrency}
              onChange={(e) => setPurchaseCurrency(e.target.value as Currency)}
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm text-zinc-200">Prix achat</label>
            <input
              className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              value={purchaseUnitCost}
              onChange={(e) => setPurchaseUnitCost(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-sm text-zinc-200">Référence</label>
            <input
              className="w-full rounded-xl bg-zinc-950/40 p-3 text-zinc-100 ring-1 ring-white/10"
              value={purchaseRef}
              onChange={(e) => setPurchaseRef(e.target.value)}
              placeholder="Facture, bon, etc."
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={createItem}
          disabled={loading}
          className={cls(
            "rounded-xl px-5 py-3 text-sm font-semibold",
            "bg-amber-400/90 text-zinc-950 hover:bg-amber-400",
            "disabled:opacity-60"
          )}
        >
          {loading ? "..." : "Ajouter"}
        </button>
      </div>
    </div>
  );
}
