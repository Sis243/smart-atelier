"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, EmptyState, FormField, PageHeader, SectionCard } from "@/components/ui";

type Preset = {
  id: string;
  name: string;
  category?: string | null;
  unit?: string | null;
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

function errorMessage(error: unknown, fallback = "Erreur inconnue") {
  return error instanceof Error ? error.message : fallback;
}

export default function StockPresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);

  const [articleMode, setArticleMode] = useState<"preset" | "custom">("preset");
  const [categoryMode, setCategoryMode] = useState<"preset" | "custom">("preset");
  const [unitMode, setUnitMode] = useState<"preset" | "custom">("preset");

  const [presetArticle, setPresetArticle] = useState(ARTICLE_PRESETS[0]?.name ?? "");
  const [customArticle, setCustomArticle] = useState("");

  const [presetCategory, setPresetCategory] = useState(CATEGORY_OPTIONS[0] ?? "");
  const [customCategory, setCustomCategory] = useState("");

  const [presetUnit, setPresetUnit] = useState(UNIT_OPTIONS[0] ?? "");
  const [customUnit, setCustomUnit] = useState("");

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
    return ARTICLE_PRESETS.find((article) => article.name === presetArticle) ?? null;
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
    const res = await fetch("/api/stock/presets", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setPresets(data.presets || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEdit(preset: Preset) {
    setEditingId(preset.id);
    setEditName(preset.name);
    setEditCategory(preset.category ?? "");
    setEditUnit(preset.unit ?? "");
    setEditMinQuantity(String(preset.minQuantity ?? 0));
    setEditUnitCost(String(preset.unitCost ?? 0));
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
      const res = await fetch(`/api/stock/presets/${id}`, {
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

      setMsg("Preset modifié avec succès.");
      cancelEdit();
      await loadData();
    } catch (error) {
      setErr(errorMessage(error));
    }
  }

  async function deletePreset(id: string) {
    if (!window.confirm("Voulez-vous vraiment supprimer ce preset ?")) return;

    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/stock/presets/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Suppression impossible");

      setMsg("Preset supprimé avec succès.");
      await loadData();
    } catch (error) {
      setErr(errorMessage(error));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!finalName) return setErr("Le nom du preset est requis.");
    if (!finalCategory) return setErr("La catégorie est requise.");
    if (!finalUnit) return setErr("L'unité est requise.");

    try {
      const res = await fetch("/api/stock/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          category: finalCategory,
          unit: finalUnit,
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
      setMinQuantity("0");
      setUnitCost("0");
      setMsg("Preset enregistré avec succès.");
      await loadData();
    } catch (error) {
      setErr(errorMessage(error));
    }
  }

  async function seedInitial() {
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/stock/presets/seed", {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Seed impossible");

      setMsg("Presets initiaux injectés.");
      await loadData();
    } catch (error) {
      setErr(errorMessage(error));
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Presets stock"
        subtitle="Créer, modifier et supprimer les presets."
        actions={[
          { label: "Retour stock", href: "/dashboard/stock" },
          { label: "Charger presets initiaux", onClick: seedInitial as any, variant: "primary" },
        ]}
      />

      <SectionCard title="Nouveau preset">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-4">
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

          <FormField label="Seuil minimum">
            <input type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <FormField label="Coût unitaire">
            <input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10" />
          </FormField>

          <div className="flex flex-wrap items-center gap-3 xl:col-span-4">
            <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
              Ajouter preset
            </button>
            {msg ? <span className="text-sm text-emerald-300">{msg}</span> : null}
            {err ? <span className="text-sm text-red-300">{err}</span> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Liste presets">
        <DataTable
          headers={["Nom", "Catégorie", "Unité", "Seuil min", "Coût unitaire", "Actions"]}
          empty={<EmptyState title="Aucun preset" description="Ajoute un preset ou charge les presets initiaux." />}
          colSpan={6}
        >
          {presets.length > 0
            ? presets.map((preset) => (
                <tr key={preset.id} className="hover:bg-white/5">
                  {editingId === preset.id ? (
                    <>
                      <td className="px-4 py-3"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input value={editUnit} onChange={(e) => setEditUnit(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input type="number" value={editMinQuantity} onChange={(e) => setEditMinQuantity(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3"><input type="number" value={editUnitCost} onChange={(e) => setEditUnitCost(e.target.value)} className="w-full rounded-xl bg-zinc-950/40 p-2 ring-1 ring-white/10" /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEdit(preset.id)} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200">Enregistrer</button>
                          <button type="button" onClick={cancelEdit} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white">Annuler</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-white">{preset.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{preset.category ?? "-"}</td>
                      <td className="px-4 py-3 text-zinc-300">{preset.unit ?? "-"}</td>
                      <td className="px-4 py-3 text-zinc-300">{preset.minQuantity}</td>
                      <td className="px-4 py-3 text-zinc-300">{preset.unitCost}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(preset)} className="rounded-lg bg-cyan-500/20 px-3 py-2 text-xs text-cyan-200">Modifier</button>
                          <button type="button" onClick={() => deletePreset(preset.id)} className="rounded-lg bg-red-600/20 px-3 py-2 text-xs text-red-200">Supprimer</button>
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
