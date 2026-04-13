"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EmployeeItem = {
  id: string;
  fullName: string;
  position?: { name?: string | null } | null;
  department?: { name?: string | null } | null;
};

type Props = {
  orderId: string;
};

export default function ProductionAssignClient({ orderId }: Props) {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [assignedQuantity, setAssignedQuantity] = useState("1");
  const [priority, setPriority] = useState("NORMALE");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEmployees() {
      try {
        const res = await fetch("/api/production/employees", { cache: "no-store" });
        const data = await res.json();
        if (mounted && data?.ok) {
          setEmployees(data.employees || []);
          if (data.employees?.length) setEmployeeId(data.employees[0].id);
        }
      } catch {
      }
    }

    loadEmployees();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/production/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          employeeId,
          roleLabel,
          assignedQuantity: Number(assignedQuantity),
          priority,
          dueAt: dueAt || null,
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Affectation échouée");
      }

      setMsg("Affectation enregistrée.");
      setRoleLabel("");
      setAssignedQuantity("1");
      setPriority("NORMALE");
      setDueAt("");
      setNote("");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="text-xs text-white/60">Affectation production</div>
      <div className="mt-1 text-sm font-semibold text-white/90">
        Assigner un agent de production
      </div>

      {err && (
        <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {err}
        </div>
      )}

      {msg && (
        <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="text-sm text-white/80">Agent</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            required
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
                {emp.position?.name ? ` — ${emp.position.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-white/80">Rôle / tâche</label>
          <input
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            placeholder="Ex: Couture pantalon, assemblage chemise, finition..."
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-sm text-white/80">Quantité assignée</label>
            <input
              type="number"
              min="1"
              value={assignedQuantity}
              onChange={(e) => setAssignedQuantity(e.target.value)}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Priorité</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            >
              <option value="BASSE">BASSE</option>
              <option value="NORMALE">NORMALE</option>
              <option value="HAUTE">HAUTE</option>
              <option value="URGENTE">URGENTE</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-white/80">Échéance</label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-white/80">Note</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            placeholder="Instruction atelier, remarque, précision..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {loading ? "Affectation..." : "Affecter à la production"}
        </button>
      </form>
    </div>
  );
}