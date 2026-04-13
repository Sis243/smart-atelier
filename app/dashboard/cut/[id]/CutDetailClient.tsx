"use client";

import { useMemo, useState } from "react";

type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

function badgeStep(status: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`;
  if (status === "EN_COURS") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (status === "TERMINE") return `${base} bg-green-500/15 text-green-200 ring-green-400/20`;
  if (status === "REJETE") return `${base} bg-red-500/15 text-red-200 ring-red-400/20`;
  return `${base} bg-zinc-500/15 text-zinc-200 ring-white/10`;
}

type Attachment = {
  id: string;
  title: string;
  fileName: string;
  type: string; // string pour éviter conflit enum côté front
  url: string;
  createdAt: string;
};

export default function CutDetailClient(props: {
  orderId: string;
  initialStatus: StepStatus;
  initialNote: string;
  initialReceptionMeasurements?: string;
  initialCoupeMeasurements: string;
  attachments: Attachment[];
}) {
  const [status, setStatus] = useState<StepStatus>(props.initialStatus);
  const [note, setNote] = useState<string>(props.initialNote ?? "");
  const [coupeMeasurements, setCoupeMeasurements] = useState<string>(
    props.initialCoupeMeasurements ?? ""
  );
  const [busy, setBusy] = useState(false);

  const [attUrl, setAttUrl] = useState("");
  const [attName, setAttName] = useState("");
  const [attType, setAttType] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>(props.attachments ?? []);

  const canSave = useMemo(() => !busy, [busy]);

  async function apiPatch(path: string, data: any) {
    const res = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Erreur (${res.status})`);
    return json;
  }

  async function changeStatus(next: StepStatus) {
    try {
      setBusy(true);
      await apiPatch(`/api/coupe/${props.orderId}/status`, { status: next });
      setStatus(next);
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    try {
      setBusy(true);
      await apiPatch(`/api/coupe/${props.orderId}/note`, { note });
      alert("Note enregistrée ✅");
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function saveMeasurements() {
    try {
      setBusy(true);
      await apiPatch(`/api/coupe/${props.orderId}/measurements`, { dataJson: coupeMeasurements });
      alert("Mesures coupe enregistrées ✅");
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function addAttachment() {
    const url = attUrl.trim();
    if (!url) return alert("URL du fichier requis");
    if (!/^https?:\/\//i.test(url)) return alert("L’URL doit commencer par http:// ou https://");

    try {
      setBusy(true);

      const json = await apiPatch(`/api/coupe/${props.orderId}/attachments`, {
        url,
        fileName: attName.trim() || null,
        type: attType.trim() || null,
        title: null,
      });

      if (json?.attachment) setAttachments((prev) => [json.attachment, ...prev]);

      setAttUrl("");
      setAttName("");
      setAttType("");
      alert("Fichier ajouté ✅");
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      {/* STATUT */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!canSave}
          onClick={() => changeStatus("EN_ATTENTE")}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 ring-1 ring-white/10 disabled:opacity-60"
        >
          EN_ATTENTE
        </button>
        <button
          disabled={!canSave}
          onClick={() => changeStatus("EN_COURS")}
          className="rounded-xl bg-blue-400/90 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-blue-400 disabled:opacity-60"
        >
          EN_COURS
        </button>
        <button
          disabled={!canSave}
          onClick={() => changeStatus("TERMINE")}
          className="rounded-xl bg-green-400/90 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-green-400 disabled:opacity-60"
        >
          TERMINE
        </button>
        <button
          disabled={!canSave}
          onClick={() => changeStatus("REJETE")}
          className="rounded-xl bg-red-400/90 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-red-400 disabled:opacity-60"
        >
          REJETE
        </button>

        <span className={badgeStep(status)}>{status}</span>
      </div>

      {/* MESURES RECEPTION (lecture seule) */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Mesures (réception) — lecture seule</div>
        <pre className="mt-2 rounded-xl bg-black/30 p-3 text-[12px] text-white/80 ring-1 ring-white/10 overflow-auto whitespace-pre-wrap">
          {props.initialReceptionMeasurements?.trim() ? props.initialReceptionMeasurements : "—"}
        </pre>
      </div>

      {/* NOTE */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Note Coupe</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Ex: remarque, consignes, tissu difficile..."
          className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
        />
        <div className="mt-2">
          <button
            disabled={!canSave}
            onClick={saveNote}
            className="rounded-xl bg-amber-400/90 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            Enregistrer la note
          </button>
        </div>
      </div>

      {/* MESURES COUPE */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Mesures Coupe</div>
        <textarea
          value={coupeMeasurements}
          onChange={(e) => setCoupeMeasurements(e.target.value)}
          rows={8}
          className="mt-2 w-full rounded-xl bg-black/30 p-3 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
        />
        <div className="mt-2">
          <button
            disabled={!canSave}
            onClick={saveMeasurements}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 ring-1 ring-white/10 disabled:opacity-60"
          >
            Enregistrer mesures coupe
          </button>
        </div>
      </div>

      {/* FICHIERS */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Fichiers joints (URL)</div>
        <input
          value={attUrl}
          onChange={(e) => setAttUrl(e.target.value)}
          placeholder="https://..."
          className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
        />
        <div className="mt-2 flex gap-2">
          <input
            value={attName}
            onChange={(e) => setAttName(e.target.value)}
            placeholder="Nom (optionnel)"
            className="flex-1 rounded-xl bg-black/30 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
          />
          <input
            value={attType}
            onChange={(e) => setAttType(e.target.value)}
            placeholder="Type (optionnel)"
            className="w-40 rounded-xl bg-black/30 px-3 py-2 text-sm text-white/85 ring-1 ring-white/10 outline-none focus:ring-white/20"
          />
        </div>
        <button
          disabled={!canSave}
          onClick={addAttachment}
          className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 ring-1 ring-white/10 disabled:opacity-60"
        >
          + Ajouter fichier
        </button>

        <div className="mt-3 space-y-2">
          {attachments.length === 0 ? (
            <div className="text-zinc-300/70 text-sm">—</div>
          ) : (
            attachments.map((f) => (
              <a
                key={f.id}
                href={f.url}
                className="block rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/15 ring-1 ring-white/10"
              >
                {f.fileName || f.title || "Fichier"} <span className="text-white/40">({f.type})</span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
