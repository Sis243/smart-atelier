"use client";

import { useMemo, useState } from "react";

type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

type Attachment = {
  id: string;
  title: string;
  fileName: string;
  type: string; // string côté front
  url: string;
  createdAt: string;
};

function badgeStep(status: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`;
  if (status === "EN_COURS") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (status === "TERMINE") return `${base} bg-green-500/15 text-green-200 ring-green-400/20`;
  if (status === "REJETE") return `${base} bg-red-500/15 text-red-200 ring-red-400/20`;
  return `${base} bg-zinc-500/15 text-zinc-200 ring-white/10`;
}

export default function ProductionDetailClient(props: {
  orderId: string;

  initialStatus: StepStatus;
  initialNote: string;

  initialCutStatus: StepStatus;
  initialCutNote: string;

  initialReceptionMeasurements: string;
  initialCoupeMeasurements: string;

  attachments: Attachment[];
}) {
  const [status, setStatus] = useState<StepStatus>(props.initialStatus);
  const [note, setNote] = useState<string>(props.initialNote ?? "");
  const [busy, setBusy] = useState(false);

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
      await apiPatch(`/api/production/${props.orderId}/status`, { status: next });
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
      await apiPatch(`/api/production/${props.orderId}/note`, { note });
      alert("Note production enregistrée ✅");
    } catch (e: any) {
      alert(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      {/* STATUT PRODUCTION */}
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

      {/* RAPPEL COUPE */}
      <div className="mt-4 rounded-2xl bg-black/20 ring-1 ring-white/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-white/60">Infos Coupe</div>
          <span className={badgeStep(props.initialCutStatus)}>{props.initialCutStatus}</span>
        </div>

        <div className="mt-2 text-xs text-white/60">Note Coupe</div>
        <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap">
          {props.initialCutNote?.trim() ? props.initialCutNote : "—"}
        </div>
      </div>

      {/* MESURES RECEPTION */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Mesures (réception) — lecture seule</div>
        <pre className="mt-2 rounded-xl bg-black/30 p-3 text-[12px] text-white/80 ring-1 ring-white/10 overflow-auto whitespace-pre-wrap">
          {props.initialReceptionMeasurements?.trim() ? props.initialReceptionMeasurements : "—"}
        </pre>
      </div>

      {/* MESURES COUPE */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Mesures Coupe — lecture seule</div>
        <pre className="mt-2 rounded-xl bg-black/30 p-3 text-[12px] text-white/80 ring-1 ring-white/10 overflow-auto whitespace-pre-wrap">
          {props.initialCoupeMeasurements?.trim() ? props.initialCoupeMeasurements : "—"}
        </pre>
      </div>

      {/* NOTE PRODUCTION */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Note Production</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Ex: montage en cours, retouche à prévoir..."
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

      {/* FICHIERS (lecture) */}
      <div className="mt-4">
        <div className="text-xs text-white/60">Fichiers joints</div>
        <div className="mt-2 space-y-2">
          {props.attachments?.length ? (
            props.attachments.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                className="block rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/15 ring-1 ring-white/10"
              >
                {f.fileName || f.title || "Fichier"}{" "}
                <span className="text-white/40">({f.type})</span>
              </a>
            ))
          ) : (
            <div className="text-zinc-300/70 text-sm">—</div>
          )}
        </div>
      </div>
    </div>
  );
}
