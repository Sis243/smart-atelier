"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inconnue";
}

export default function QualityControlClient({
  qualityStepId,
  orderId,
  currentStatus,
  currentNote,
}: {
  qualityStepId: string;
  orderId: string;
  currentStatus: string;
  currentNote: string;
}) {
  const router = useRouter();

  const [note, setNote] = useState(currentNote || "");
  const [status, setStatus] = useState(currentStatus || "EN_ATTENTE");
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveStatus(nextStatus: string) {
    setLoading(nextStatus);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/quality/${qualityStepId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: nextStatus,
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Mise à jour impossible");
      }

      setStatus(nextStatus);

      if (nextStatus === "TERMINE") {
        setMsg("Qualité validée. Commande envoyée en livraison.");
      } else if (nextStatus === "REJETE") {
        setMsg("Commande rejetée et renvoyée en production.");
      } else {
        setMsg("Qualité marquée en cours.");
      }

      router.refresh();
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {err && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {err}
        </div>
      )}

      {msg && (
        <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
          {msg}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-sm text-zinc-400">Statut actuel</div>
          <div className="mt-2 text-base font-semibold text-zinc-100">{status}</div>
        </div>

        <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-sm text-zinc-400">Décision métier</div>
          <div className="mt-2 text-sm text-zinc-300">
            Valider si conforme, rejeter si correction nécessaire.
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
        <label className="text-sm text-zinc-300">Commentaire qualité</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={6}
          placeholder="Ex: bouton manquant, poche mal finie, couture à corriger..."
          className="mt-3 w-full rounded-xl bg-zinc-950/40 p-3 text-sm text-white ring-1 ring-white/10 outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => saveStatus("EN_COURS")}
          className="rounded-xl bg-cyan-500/20 px-4 py-3 text-sm font-medium text-cyan-200 ring-1 ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "EN_COURS" ? "..." : "Marquer en cours"}
        </button>

        <button
          type="button"
          disabled={!!loading}
          onClick={() => saveStatus("TERMINE")}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "TERMINE" ? "..." : "Valider la qualité"}
        </button>

        <button
          type="button"
          disabled={!!loading}
          onClick={() => saveStatus("REJETE")}
          className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "REJETE" ? "..." : "Rejeter et renvoyer en production"}
        </button>
      </div>
    </div>
  );
}
