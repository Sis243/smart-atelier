"use client";

import { useEffect, useMemo, useState } from "react";
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
  category?: string | null;
  unit?: string | null;
  quantity: number;
  minQuantity: number;
  unitCost: number;
};

type ArticlePreset = {
  name: string;
  category: string;
  unit: string;
};

const CATEGORY_OPTIONS: string[] = [
  "Tissus et matières premières",
  "Mercerie",
  "Outils et équipements",
  "Produits finis",
  "Produits semi-finis",
  "Entretien et finition",
  "Stock et logistique",
  "Fournitures administratives",
];

const UNIT_OPTIONS: string[] = [
  "Mètre (m)",
  "Centimètre (cm)",
  "Millimètre (mm)",
  "Yard",
  "Rouleau",
  "Pièce",
  "Pièce (pcs)",
  "Unité (u)",
  "Lot",
  "Paquet",
  "Boîte",
  "Bobine",
  "Cône",
  "Paire",
  "Douzaine",
  "Kit",
  "Carton",
  "Sac",
  "Palette",
  "Kilogramme (kg)",
  "Gramme (g)",
];

const ARTICLE_PRESETS: ArticlePreset[] = [
  { name: "Tissus coton", category: "Tissus et matières premières", unit: "Mètre (m)" },
  { name: "Tissus wax", category: "Tissus et matières premières", unit: "Yard" },
  { name: "Bazin riche", category: "Tissus et matières premières", unit: "Mètre (m)" },
  { name: "Fils à coudre", category: "Mercerie", unit: "Bobine" },
  { name: "Aiguilles", category: "Mercerie", unit: "Boîte" },
  { name: "Boutons", category: "Mercerie", unit: "Pièce (pcs)" },
  { name: "Machine Singer", category: "Outils et équipements", unit: "Pièce" },
  { name: "Robe soirée", category: "Produits finis", unit: "Pièce" },
  { name: "Pièces découpées", category: "Produits semi-finis", unit: "Lot" },
  { name: "Produits de nettoyage textile", category: "Entretien et finition", unit: "Boîte" },
  { name: "Sachet plastique", category: "Stock et logistique", unit: "Sac" },
  { name: "Carnets", category: "Fournitures administratives", unit: "Pièce" },
];

export default function StockItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TOUT");
  const [stockFilter, setStockFilter] = useState("TOUT");

  const [articleMode, setArticleMode] = useState<"preset" | "custom">("preset");
  const [categoryMode, setCategoryMode] = useState<"preset" | "custom">("preset");
  const [unitMode, setUnitMode] = useState<"preset" | "custom">("preset");

  const [presetArticle, setPresetArticle] = useState<string>(ARTICLE_PRESETS[0]?.name ?? "");
  const [customArticle, setCustomArticle] = useState<string>("");

  const [presetCategory, setPresetCategory] = useState<string>(CATEGORY_OPTIONS[0] ?? "");
  const [customCategory, setCustomCategory] = useState<string>("");

  const [presetUnit, setPresetUnit] = useState<string>(UNIT_OPTIONS[0] ?? "");
  const [customUnit, setCustomUnit] = useState<string>("");

  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [unitCost, setUnitCost] = useState("0");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editMinQuantity, setEditMinQuantity] = useState("0");
  const [editUnitCost, setEditUnitCost] = useState("0");

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedPreset = useMemo(() => {
    return ARTICLE_PRESETS.find((a) => a.name === presetArticle) ?? null;
  }, [presetArticle]);

  const finalName = articleMode === "preset" ? presetArticle : customArticle.trim();
  const finalCategory = categoryMode === "preset" ? presetCategory : customCategory.trim();
  const finalUnit = unitMode === "preset" ? presetUnit : customUnit.trim();

  useEffect(() => {
    if (articleMode === "preset" && selectedPreset) {
      setPresetCategory(selectedPreset.category);
      setPresetUnit(selectedPreset.unit);
      setCategoryMode("preset");
      setUnitMode("preset");
    }
  }, [articleMode, selectedPreset]);

  async function loadData() {
    const res = await fetch("/api/stock/items", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setItems(data.items || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        String(item.category ?? "").toLowerCase().includes(q) ||
        String(item.unit ?? "").toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === "TOUT" || (item.category ?? "") === categoryFilter;

      const isLow = Number(item.quantity || 0) <= Number(item.minQuantity || 0);

      const matchStock =
        stockFilter === "TOUT" ||
        (stockFilter === "FAIBLE" && isLow) ||
        (stockFilter === "NORMAL" && !isLow);

      return matchSearch && matchCategory && matchStock;
    });
  }, [items, search, categoryFilter, stockFilter]);

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category ?? "");
    setEditUnit(item.unit ?? "");
    setEditMinQuantity(String(item.minQuantity ?? 0));
    setEditUnitCost(String(item.unitCost ?? 0));
    setErr(null);
    setMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/stock/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          category: editCategory,
          unit: editUnit,
          minQuantity: Number(editMinQuantity),
          unitCost: Number(editUnitCost),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Modification impossible");

      setMsg("Article modifié avec succès.");
      cancelEdit();
      await loadData();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Voulez-vous vraiment supprimer cet article ?")) return;

    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/stock/items/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Suppression impossible");

      setMsg("Article supprimé avec succès.");
      await loadData();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!finalName) return setErr("Le nom de l’article est requis.");
    if (!finalCategory) return setErr("La catégorie est requise.");
    if (!finalUnit) return setErr("L’unité est requise.");

    try {
      const res = await fetch("/api/stock/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          category: finalCategory,
          unit: finalUnit,
          quantity: Number(quantity),
          minQuantity: Number(minQuantity),
          unitCost: Number(unitCost),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Création impossible");

      setArticleMode("preset");
      setCategoryMode("preset");
      setUnitMode("preset");
      setPresetArticle(ARTICLE_PRESETS[0]?.name ?? "");
      setCustomArticle("");
      setPresetCategory(ARTICLE_PRESETS[0]?.category ?? CATEGORY_OPTIONS[0] ?? "");
      setCustomCategory("");
      setPresetUnit(ARTICLE_PRESETS[0]?.unit ?? UNIT_OPTIONS[0] ?? "");
      setCustomUnit("");
      setQuantity("0");
      setMinQuantity("0");
      setUnitCost("0");
      setMsg("Article ajouté avec succès.");
      await loadData();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Articles stock"
        subtitle="Créer, rechercher, filtrer, modifier et supprimer les articles."
        actions={[
          { label: "Retour stock", href: "/dashboard/stock" },
          { label: "Exporter CSV", href: "/api/stock/export?format=csv", variant: "primary" },
        ]}
      />

      <SectionCard title="Nouvel article">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <FormField label="Article">
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setArticleMode("preset")} className={`rounded-xl px-3 py-2 text-sm ring-1 ${articleMode === "preset" ? "bg-amber-400/90 text-zinc-950 ring-amber-300/40" : "bg-zinc-950/40 text-white ring-white/10"}`}>Liste intégrée</button>
                <button type="button" onClick={() => setArticleMode("custom")} className={`rounded-xl px-3 py-2 text-sm ring-1 ${articleMode === "custom" ? "bg-amber-400/90 text-zinc-950 ring-amber-300/40" : "bg-zinc-950/40 text-white ring-white/10"}`}>Saisie libre</button>
              </div>
              {articleMode === "preset" ? (
                <select value={presetArticle} onChange={(e) => setPresetArticle(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10">
                  {ARTICLE_PRESETS.map((article) => (
                    <option key={article.name} value={article.name}>{article.name}</option>
                  ))}
                </select>
              ) : (
                <input value={customArticle} onChange={(e) => setCustomArticle(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" placeholder="Saisir un nouvel article" required={articleMode === "custom"} />
              )}
            </div>
          </FormField>

          <FormField label="Catégorie">
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setCategoryMode("preset")} className={`rounded-xl px-3 py-2 text-sm ring-1 ${categoryMode === "preset" ? "bg-amber-400/90 text-zinc-950 ring-amber-300/40" : "bg-zinc-950/40 text-white ring-white/10"}`}>Liste intégrée</button>
                <button type="button" onClick={() => setCategoryMode("custom")} className={`rounded-xl px-3 py-2 text-sm ring-1 ${categoryMode === "custom" ? "bg-amber-400/90 text-zinc-950 ring-amber-300/40" : "bg-zinc-950/40 text-white ring-white/10"}`}>Saisie libre</button>
              </div>
              {categoryMode === "preset" ? (
                <select value={presetCategory} onChange={(e) => setPresetCategory(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10">
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              ) : (
                <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" placeholder="Saisir une catégorie absente" required={categoryMode === "custom"} />
              )}
            </div>
          </FormField>

          <FormField label="Unité">
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setUnitMode("preset")} className={`rounded-xl px-3 py-2 text-sm ring-1 ${unitMode === "preset" ? "bg-amber-400/90 text-zinc-950 ring-amber-300/40" : "bg-zinc-950/40 text-white ring-white/10"}`}>Liste intégrée</button>
                <button type="button" onClick={() => setUnitMode("custom")} className={`rounded-xl px-3 py-2 text-sm ring-1 ${unitMode === "custom" ? "bg-amber-400/90 text-zinc-950 ring-amber-300/40" : "bg-zinc-950/40 text-white ring-white/10"}`}>Saisie libre</button>
              </div>
              {unitMode === "preset" ? (
                <select value={presetUnit} onChange={(e) => setPresetUnit(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10">
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              ) : (
                <input value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" placeholder="Saisir une unité absente" required={unitMode === "custom"} />
              )}
            </div>
          </FormField>

          <FormField label="Quantité initiale">
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <FormField label="Seuil minimum">
            <input type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <FormField label="Coût unitaire">
            <input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <div className="xl:col-span-3 flex flex-wrap items-center gap-3">
            <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
              Ajouter l’article
            </button>
            {msg ? <span className="text-sm text-emerald-300">{msg}</span> : null}
            {err ? <span className="text-sm text-red-300">{err}</span> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Recherche et filtres">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Recherche">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, catégorie, unité..."
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </FormField>

          <FormField label="Catégorie">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="TOUT">Toutes</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </FormField>

          <FormField label="État stock">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="TOUT">Tous</option>
              <option value="FAIBLE">Stock faible</option>
              <option value="NORMAL">Stock normal</option>
            </select>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title={`Liste articles (${filteredItems.length})`}>
        <DataTable
          headers={["Nom", "Catégorie", "Unité", "Quantité", "Min", "Coût unitaire", "Actions"]}
          empty={<EmptyState title="Aucun article" description="Aucun résultat avec ces filtres." />}
          colSpan={7}
        >
          {filteredItems.length > 0
            ? filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5">
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-3"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3 text-zinc-300">{item.quantity}</td>
                      <td className="px-4 py-3"><input type="number" value={editMinQuantity} onChange={(e) => setEditMinQuantity(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input type="number" value={editUnitCost} onChange={(e) => setEditUnitCost(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEdit(item.id)} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200">Enregistrer</button>
                          <button type="button" onClick={cancelEdit} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white">Annuler</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{item.category ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-300">{item.unit ?? "—"}</td>
                      <td className={`px-4 py-3 ${Number(item.quantity || 0) <= Number(item.minQuantity || 0) ? "text-red-300 font-semibold" : "text-zinc-300"}`}>
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{item.minQuantity}</td>
                      <td className="px-4 py-3 text-zinc-300">{item.unitCost}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(item)} className="rounded-lg bg-cyan-500/20 px-3 py-2 text-xs text-cyan-200">Modifier</button>
                          <button type="button" onClick={() => deleteItem(item.id)} className="rounded-lg bg-red-600/20 px-3 py-2 text-xs text-red-200">Supprimer</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            : null}
        </DataTable>
      </SectionCard>
    </main>
  );
}