"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CustomerLite = { id: string; fullName: string; phone: string | null };

type UploadedAttachment = {
  title?: string | null;
  fileName?: string | null;
  type?: string | null; // "PDF" | "IMAGE" | "WORD" | "EXCEL" | "OTHER" (string côté front)
  url: string;
};

function toNum(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function calcTypeFromMime(mime: string, fileName: string) {
  const m = (mime || "").toLowerCase();
  const fn = (fileName || "").toLowerCase();

  const isImage = m.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(fn);
  if (isImage) return "IMAGE";

  if (m === "application/pdf" || fn.endsWith(".pdf")) return "PDF";
  if (
    m.includes("word") ||
    /\.(doc|docx)$/i.test(fn)
  )
    return "WORD";
  if (
    m.includes("excel") ||
    m.includes("spreadsheet") ||
    /\.(xls|xlsx|csv)$/i.test(fn)
  )
    return "EXCEL";

  return "OTHER";
}

async function apiJson(url: string, method: "POST" | "PATCH", data: any) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Erreur (${res.status})`);
  return json;
}

async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Upload impossible");
  return json as { ok: true; url: string; fileName: string; mimeType: string; fileSize: number };
}

export default function NewOrderClient({ customers }: { customers: CustomerLite[] }) {
  const router = useRouter();

  const [busy, setBusy] = useState(false);

  // champs
  const [customerId, setCustomerId] = useState(customers?.[0]?.id ?? "");
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

  // pièces jointes
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [attachTitle, setAttachTitle] = useState("");
  const [attachUrl, setAttachUrl] = useState("");

  const canSubmit = useMemo(() => !busy && customerId, [busy, customerId]);

  function addUrlAttachment() {
    const url = attachUrl.trim();
    if (!url) return alert("URL du fichier requis");
    if (!/^https?:\/\//i.test(url)) return alert("L’URL doit commencer par http:// ou https://");

    const title = attachTitle.trim() || null;
    const fileName = url.split("?")[0].split("#")[0].split("/").pop() || "fichier";
    const type = calcTypeFromMime("", fileName);

    setAttachments((prev) => [{ url, title, fileName, type }, ...prev]);
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
        },
        ...prev,
      ]);
    } catch (e: any) {
      alert(e?.message ?? "Upload error");
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

        // ✅ pièces jointes créées au moment de la commande
        attachments,
      };

      const created = await apiJson("/api/orders", "POST", payload);
      // created: { ok: true, id, code }
      router.push(`/dashboard/orders/${created.id}`);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Colonne 1 */}
      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <div className="text-xs text-white/60">Client</div>

        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} {c.phone ? `— ${c.phone}` : ""}
            </option>
          ))}
        </select>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-white/60">Devise</div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-white/60">Taux USD→CDF</div>
            <input
              value={fxRate}
              onChange={(e) => setFxRate(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
              placeholder="2900"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-white/60">Total</div>
            <input
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
              placeholder="0"
            />
          </div>
          <div>
            <div className="text-xs text-white/60">Avance</div>
            <input
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
              placeholder="0"
            />
          </div>
          <div>
            <div className="text-xs text-white/60">Remise</div>
            <input
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
              placeholder="0"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={isLot}
              onChange={(e) => setIsLot(e.target.checked)}
            />
            Commande par lot
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              value={lotLabel}
              onChange={(e) => setLotLabel(e.target.value)}
              disabled={!isLot}
              placeholder="Libellé lot"
              className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20 disabled:opacity-50"
            />
            <input
              value={lotQuantity}
              onChange={(e) => setLotQuantity(e.target.value)}
              disabled={!isLot}
              placeholder="Quantité"
              className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Colonne 2 */}
      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <div className="text-xs text-white/60">Article</div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            placeholder="Type article (ex: costume)"
            className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Catégorie (Homme/Femme/Enfant)"
            className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={fabricType}
            onChange={(e) => setFabricType(e.target.value)}
            placeholder="Tissu"
            className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
          />
          <input
            value={fabricColor}
            onChange={(e) => setFabricColor(e.target.value)}
            placeholder="Couleur"
            className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
          />
        </div>

        <div className="mt-2">
          <input
            value={fabricMeters}
            onChange={(e) => setFabricMeters(e.target.value)}
            placeholder="Métrage (ex: 3.5)"
            className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/90 ring-1 ring-white/10 outline-none focus:ring-white/20"
          />
        </div>

        <div className="mt-4">
          <div className="text-xs text-white/60">Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
            placeholder="Détails: modèle, consignes, urgence…"
          />
        </div>

        <div className="mt-4">
          <div className="text-xs text-white/60">Mesures</div>
          <textarea
            value={measurements}
            onChange={(e) => setMeasurements(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
            placeholder="Coller toutes les mesures ici…"
          />
        </div>
      </div>

      {/* Colonne 3 */}
      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <div className="text-xs text-white/60">Pièces jointes</div>
        <div className="mt-1 text-sm text-white/80">
          Ajoute dès maintenant : <b>PDF</b>, <b>JPG</b>, <b>PNG</b>, <b>WORD</b>, <b>EXCEL</b>.
        </div>

        {/* upload file */}
        <label className="mt-3 block rounded-xl bg-white/10 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 hover:bg-white/15 cursor-pointer">
          + Importer un fichier (PDF / IMAGE / WORD / EXCEL)
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addFileAttachment(f);
              e.currentTarget.value = "";
            }}
          />
        </label>

        {/* url */}
        <div className="mt-3 rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
          <div className="text-xs text-white/60">Ou ajouter un lien (URL)</div>
          <input
            value={attachTitle}
            onChange={(e) => setAttachTitle(e.target.value)}
            className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
            placeholder="Titre (optionnel)"
          />
          <input
            value={attachUrl}
            onChange={(e) => setAttachUrl(e.target.value)}
            className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
            placeholder="https://..."
          />
          <button
            type="button"
            disabled={busy}
            onClick={addUrlAttachment}
            className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 ring-1 ring-white/10 disabled:opacity-60"
          >
            + Ajouter URL
          </button>
        </div>

        {/* list */}
        <div className="mt-3 space-y-2">
          {attachments.length === 0 ? (
            <div className="text-sm text-zinc-300/70">Aucun fichier ajouté.</div>
          ) : (
            attachments.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10"
              >
                <a
                  href={a.url}
                  target="_blank"
                  className="min-w-0 flex-1 truncate text-sm text-white/85 hover:underline"
                  title={a.fileName || a.title || a.url}
                >
                  {a.fileName || a.title || a.url}{" "}
                  <span className="text-white/40">({a.type})</span>
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="rounded-lg bg-red-500/15 px-2 py-1 text-xs text-red-200 ring-1 ring-red-400/20 hover:bg-red-500/20"
                >
                  Retirer
                </button>
              </div>
            ))
          )}
        </div>

        {/* submit */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="mt-4 w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {busy ? "Création…" : "Créer la commande →"}
        </button>

        <p className="mt-3 text-xs text-zinc-300/70">
          La création génère automatiquement les étapes (Coupe/Production/Qualité/Livraison) et envoie la commande à la coupe.
        </p>
      </div>
    </div>
  );
}
