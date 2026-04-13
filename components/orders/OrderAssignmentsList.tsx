import StatusBadge from "@/components/ui/StatusBadge";

type Assignment = {
  id: string;
  employeeName: string;
  roleLabel?: string | null;
  assignedQuantity?: number;
  completedQuantity?: number;
  priority?: string | null;
  status?: string | null;
  dueAt?: string | null;
};

type Props = {
  title: string;
  items: Assignment[];
};

export default function OrderAssignmentsList({ title, items }: Props) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10">
          {items.length} affectation(s)
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-zinc-950/40 p-4 text-sm text-zinc-400 ring-1 ring-white/10">
          Aucune affectation.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{item.employeeName}</div>
                  <div className="mt-1 text-xs text-zinc-400">{item.roleLabel || "Tâche non précisée"}</div>
                </div>

                <StatusBadge status={item.status || "EN_ATTENTE"} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-300 md:grid-cols-4">
                <div>Qté assignée : <b>{item.assignedQuantity ?? 0}</b></div>
                <div>Qté faite : <b>{item.completedQuantity ?? 0}</b></div>
                <div>Priorité : <b>{item.priority ?? "—"}</b></div>
                <div>Échéance : <b>{item.dueAt ?? "—"}</b></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}