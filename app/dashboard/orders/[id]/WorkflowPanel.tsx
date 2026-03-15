"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

function pillClass(status: StepStatus) {
  const base = "rounded-full px-2.5 py-1 text-[11px] ring-1";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`;
  if (status === "EN_COURS") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (status === "TERMINE") return `${base} bg-green-500/15 text-green-200 ring-green-400/20`;
  return `${base} bg-red-500/15 text-red-200 ring-red-400/20`;
}

async function updateWorkflow(orderId: string, step: "CUT"|"PRODUCTION"|"QUALITY"|"DELIVERY", status: StepStatus) {
  const res = await fetch(`/api/orders/${orderId}/workflow`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, status }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || "Erreur workflow");
}

export default function WorkflowPanel(props: {
  orderId: string;
  cutStatus: StepStatus;
  productionStatus: StepStatus;
  qualityStatus: StepStatus;
  deliveryStatus: StepStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(key: string, fn: () => Promise<void>) {
    setError(null);
    setLoading(key);
    try {
      await fn();
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Erreur");
    } finally {
      setLoading(null);
    }
  }

  const steps = [
    {
      title: "Coupe",
      icon: "✂️",
      status: props.cutStatus,
      actions: [
        { label: "Démarrer", show: props.cutStatus === "EN_ATTENTE", run: () => updateWorkflow(props.orderId, "CUT", "EN_COURS") },
        { label: "Terminer", show: props.cutStatus === "EN_COURS", run: () => updateWorkflow(props.orderId, "CUT", "TERMINE") },
      ],
    },
    {
      title: "Production",
      icon: "🧵",
      status: props.productionStatus,
      actions: [
        { label: "Démarrer", show: props.productionStatus === "EN_ATTENTE", run: () => updateWorkflow(props.orderId, "PRODUCTION", "EN_COURS") },
        { label: "Terminer", show: props.productionStatus === "EN_COURS", run: () => updateWorkflow(props.orderId, "PRODUCTION", "TERMINE") },
      ],
    },
    {
      title: "Qualité",
      icon: "✅",
      status: props.qualityStatus,
      actions: [
        { label: "Démarrer", show: props.qualityStatus === "EN_ATTENTE", run: () => updateWorkflow(props.orderId, "QUALITY", "EN_COURS") },
        { label: "Valider", show: props.qualityStatus === "EN_COURS", run: () => updateWorkflow(props.orderId, "QUALITY", "TERMINE") },
        { label: "Rejeter", show: props.qualityStatus === "EN_COURS", run: () => updateWorkflow(props.orderId, "QUALITY", "REJETE") },
      ],
    },
    {
      title: "Livraison",
      icon: "🚚",
      status: props.deliveryStatus,
      actions: [
        { label: "Démarrer", show: props.deliveryStatus === "EN_ATTENTE", run: () => updateWorkflow(props.orderId, "DELIVERY", "EN_COURS") },
        { label: "Confirmer", show: props.deliveryStatus === "EN_COURS", run: () => updateWorkflow(props.orderId, "DELIVERY", "TERMINE") },
      ],
    },
  ] as const;

  return (
    <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Workflow Atelier</h2>
          <p className="mt-1 text-sm text-zinc-300/80">
            Coupe → Production → Qualité → Livraison (règles strictes, pas de saut).
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {steps.map((s) => (
          <div key={s.title} className="rounded-2xl bg-zinc-950/40 p-5 ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  <span className="mr-2">{s.icon}</span>
                  {s.title}
                </p>
                <p className="mt-1 text-xs text-zinc-300/70">Statut actuel</p>
              </div>
              <span className={pillClass(s.status)}>{s.status}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {s.actions.filter(a => a.show).length === 0 ? (
                <span className="text-xs text-zinc-300/70">Aucune action disponible.</span>
              ) : (
                s.actions.filter(a => a.show).map((a) => {
                  const key = `${s.title}:${a.label}`;
                  const isBusy = loading === key;
                  return (
                    <button
                      key={a.label}
                      onClick={() => act(key, a.run)}
                      disabled={!!loading}
                      className={[
                        "rounded-xl px-3 py-2 text-sm ring-1 ring-white/10",
                        "bg-white/10 hover:bg-white/15 disabled:opacity-60",
                        a.label === "Rejeter" ? "text-red-200" : "text-zinc-100",
                      ].join(" ")}
                    >
                      {isBusy ? "..." : a.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-zinc-300/70">
        ✅ Quand la Livraison est confirmée, la commande passe automatiquement à <b>TERMINE</b>.
      </p>
    </div>
  );
}
