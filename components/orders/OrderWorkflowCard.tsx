import StatusBadge from "@/components/ui/StatusBadge";

type StepInfo = {
  title: string;
  status?: string | null;
  responsible?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  dueAt?: string | null;
  note?: string | null;
};

type Props = {
  steps: StepInfo[];
};

export default function OrderWorkflowCard({ steps }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {steps.map((step) => (
        <div key={step.title} className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">{step.title}</div>
            <StatusBadge status={step.status || "EN_ATTENTE"} />
          </div>

          <div className="mt-3 space-y-1 text-sm text-zinc-300">
            <div>Responsable : <b>{step.responsible || "—"}</b></div>
            <div>Début : <b>{step.startedAt || "—"}</b></div>
            <div>Fin : <b>{step.finishedAt || "—"}</b></div>
            <div>Échéance : <b>{step.dueAt || "—"}</b></div>
          </div>

          {step.note ? (
            <div className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-zinc-400 ring-1 ring-white/10">
              {step.note}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}