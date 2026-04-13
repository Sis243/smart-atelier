"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type CustomerLite = {
  id: string;
  fullName: string;
  phone: string | null;
};

export type StockPresetLite = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
};

type FabricPresetOption = {
  name: string;
  category: string | null;
};

const ORDER_ITEM_TYPES = [
  "Robe",
  "Robe de soirée",
  "Robe de mariée",
  "Jupe",
  "Chemise",
  "Chemisier",
  "Pantalon",
  "Veste",
  "Costume",
  "Boubou",
  "Abaya",
  "Ensemble complet",
  "Uniforme",
  "Tenue enfant",
  "Retouche",
];

const ORDER_CATEGORY_OPTIONS = [
  "Femme",
  "Homme",
  "Enfant",
  "Bébé",
  "Mixte",
  "Cérémonie",
  "Mariage",
  "Professionnel / Uniforme",
  "Traditionnel",
  "Décontracté",
  "Retouche",
];

const FABRIC_PRESET_FALLBACKS: FabricPresetOption[] = [
  { name: "Coton", category: "Tissu" },
  { name: "Tissus coton", category: "Tissu" },
  { name: "Tissus wax", category: "Tissu" },
  { name: "Wax imprimé", category: "Tissu" },
  { name: "Bazin riche", category: "Tissu" },
  { name: "Lin", category: "Tissu" },
  { name: "Jean (denim)", category: "Tissu" },
  { name: "Coton simple", category: "Tissu" },
  { name: "Satin", category: "Tissu" },
  { name: "Soie", category: "Tissu" },
];

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFabricPreset(preset: StockPresetLite) {
  const category = (preset.category ?? "").toLowerCase();
  const unit = (preset.unit ?? "").toLowerCase();

  return (
    category.includes("tissu") ||
    category.includes("mati") ||
    unit === "m" ||
    unit.includes("mètre") ||
    unit.includes("metre") ||
    unit.includes("yard")
  );
}

type UploadedAttachment = {
  title?: string | null;
  fileName?: string | null;
  type?: string | null;
  url: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

export interface NewOrderClientProps {
  customers: CustomerLite[];
  selectedCustomerId?: string;
  stockPresets?: StockPresetLite[];
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function calcTypeFromMime(mime: string, fileName: string) {
  const m = (mime || "").toLowerCase();
  const fn = (fileName || "").toLowerCase();

  if (m.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(fn)) return "IMAGE";
  if (m === "application/pdf" || fn.endsWith(".pdf")) return "PDF";
  if (m.includes("word") || /\.(doc|docx)$/i.test(fn)) return "WORD";
  if (m.includes("excel") || m.includes("spreadsheet") || /\.(xls|xlsx|csv)$/i.test(fn)) return "EXCEL";

  return "OTHER";
}

async function apiJson(url: string, method: "POST" | "PATCH", data: unknown) {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? `Erreur (${res.status})`);
  }

  return json;
}

async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "Upload impossible");
  }

  return json as {
    ok: true;
    url: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  };
}

export default function NewOrderClient({
  customers,
  selectedCustomerId,
  stockPresets = [],
}: NewOrderClientProps) {
  const router = useRouter();
  const initialCustomerId =
    customers.some((customer) => customer.id === selectedCustomerId)
      ? selectedCustomerId ?? ""
      : customers?.[0]?.id ?? "";

  const [busy, setBusy] = useState(false);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [currency, setCurrency] = useState<"USD" | "CDF">("USD");
  const [fxRate, setFxRate] = useState("2900");

  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [discount, setDiscount] = useState("");

  const [isLot, setIsLot] = useState(false);
  const [lotLabel, setLotLabel] = useState("");
  const [lotQuantity, setLotQuantity] = useState("1");

  const [itemType, setItemType] = useState("");
  const [category, setCategory] = useState("");
  const [fabricType, setFabricType] = useState("");
  const [fabricColor, setFabricColor] = useState("");
  const [fabricMeters, setFabricMeters] = useState("");

  const [description, setDescription] = useState("");
  const [measurements, setMeasurements] = useState("");

  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [attachTitle, setAttachTitle] = useState("");
  const [attachUrl, setAttachUrl] = useState("");

  const canSubmit = useMemo(() => !busy && !!customerId, [busy, customerId]);
  const fabricPresetOptions = useMemo<FabricPresetOption[]>(
    () => [
      ...FABRIC_PRESET_FALLBACKS,
      ...stockPresets.filter(isFabricPreset).map((preset) => ({
        name: preset.name,
        category: preset.category,
      })),
    ],
    [stockPresets]
  );
  const itemTypeOptions = useMemo(
    () => Array.from(new Set(ORDER_ITEM_TYPES)).sort(),
    []
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set(ORDER_CATEGORY_OPTIONS)).sort(),
    []
  );
  const fabricOptions = useMemo(
    () =>
      Array.from(
        new Set(fabricPresetOptions.map((preset) => preset.name).filter(isNonEmptyString))
      ).sort(),
    [fabricPresetOptions]
  );

  function applyPresetToOrder(presetName: string) {
    setItemType(presetName);
  }

  function addUrlAttachment() {
    const url = attachUrl.trim();
    if (!url) return alert("URL du fichier requis");
    if (!/^https?:\/\//i.test(url)) return alert("L'URL doit commencer par http:// ou https://");

    const title = attachTitle.trim() || null;
    const fileName = url.split("?")[0].split("#")[0].split("/").pop() || "fichier";
    const type = calcTypeFromMime("", fileName);

    setAttachments((prev) => [
      { url, title, fileName, type, mimeType: null, fileSize: null },
      ...prev,
    ]);
    setAttachTitle("");
    setAttachUrl("");
  }

  async function addFileAttachment(file: File) {
    try {
      setBusy(true);
      const up = await uploadFile(file);
      const type = calcTypeFromMime(up.mimeType, up.fileName);

      setAttachments((prev) => [
        {
          url: up.url,
          title: null,
          fileName: up.fileName,
          type,
          mimeType: up.mimeType,
          fileSize: up.fileSize,
        },
        ...prev,
      ]);
    } catch (e: any) {
      alert(e?.message ?? "Upload impossible");
    } finally {
      setBusy(false);
    }
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    try {
      setBusy(true);

      const payload = {
        customerId,
        currency,
        fxRate: toNum(fxRate, 1),
        totalAmount: toNum(totalAmount, 0),
        depositAmount: toNum(depositAmount, 0),
        discount: toNum(discount, 0),
        isLot,
        lotLabel: lotLabel.trim() || null,
        lotQuantity: Math.max(1, Math.floor(toNum(lotQuantity, 1))),
        itemType: itemType.trim() || null,
        category: category.trim() || null,
        fabricType: fabricType.trim() || null,
        fabricColor: fabricColor.trim() || null,
        fabricMeters: fabricMeters.trim() ? toNum(fabricMeters, 0) : null,
        description: description.trim() || null,
        measurements: measurements.trim() || null,
        attachments,
      };

      const created = await apiJson("/api/orders", "POST", payload);
      router.push(`/dashboard/orders/${created.id}`);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Erreur création commande");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="text-xs text-white/60">Client</div>

        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} {c.phone ? `- ${c.phone}` : ""}
            </option>
          ))}
        </select>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-white/60">Devise</div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "USD" | "CDF")}
              className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-white/60">Taux USD vers CDF</div>
            <input
              value={fxRate}
              onChange={(e) => setFxRate(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
              placeholder="2900"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <input
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="Total"
            className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
          <input
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Acompte"
            className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
          <input
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="Remise"
            className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setIsLot((v) => !v)}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white"
          >
            {isLot ? "Lot activé" : "Activer lot"}
          </button>
        </div>

        {isLot && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <input
              value={lotLabel}
              onChange={(e) => setLotLabel(e.target.value)}
              placeholder="Libellé du lot"
              className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
            />
            <input
              value={lotQuantity}
              onChange={(e) => setLotQuantity(e.target.value)}
              placeholder="Quantité lot"
              className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="grid gap-2">
          <div>
            <div className="mb-1 text-xs text-white/60">Type article</div>
            <input
              list="order-item-types"
              value={itemType}
              onChange={(e) => applyPresetToOrder(e.target.value)}
              placeholder="Choisir ou saisir un type"
              className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-white/60">Catégorie</div>
            <input
              list="order-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Choisir ou saisir une catégorie"
              className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-white/60">Tissu</div>
            <input
              list="fabric-preset-names"
              value={fabricType}
              onChange={(e) => setFabricType(e.target.value)}
              placeholder="Choisir ou saisir un tissu"
              className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
            />
          </div>

          <datalist id="order-item-types">
            {itemTypeOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <datalist id="order-categories">
            {categoryOptions.map((orderCategory) => (
              <option key={orderCategory} value={orderCategory} />
            ))}
          </datalist>
          <datalist id="fabric-preset-names">
            {fabricOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <input
            value={fabricColor}
            onChange={(e) => setFabricColor(e.target.value)}
            placeholder="Couleur"
            className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
          <input
            value={fabricMeters}
            onChange={(e) => setFabricMeters(e.target.value)}
            placeholder="Métrage"
            className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Description"
            className="rounded-xl bg-black/30 p-3 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
          <textarea
            value={measurements}
            onChange={(e) => setMeasurements(e.target.value)}
            rows={5}
            placeholder="Mesures"
            className="rounded-xl bg-black/30 p-3 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="text-xs text-white/60">Pièces jointes</div>

        <div className="mt-3 grid gap-2">
          <input
            value={attachTitle}
            onChange={(e) => setAttachTitle(e.target.value)}
            placeholder="Titre du fichier"
            className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
          <input
            value={attachUrl}
            onChange={(e) => setAttachUrl(e.target.value)}
            placeholder="URL du fichier"
            className="rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none"
          />
          <button
            type="button"
            onClick={addUrlAttachment}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white"
          >
            Ajouter URL
          </button>

          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void addFileAttachment(file);
            }}
            className="text-sm text-white"
          />
        </div>

        <div className="mt-4 space-y-2">
          {attachments.map((a, idx) => (
            <div
              key={`${a.url}-${idx}`}
              className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-sm text-white/90"
            >
              <div className="truncate">{a.fileName || a.title || a.url}</div>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="ml-3 text-red-300"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {busy ? "Enregistrement..." : "Créer la commande"}
          </button>
        </div>
      </div>
    </div>
  );
}
