"use client";

import { useEffect, useMemo, useState } from "react";

type AssignmentRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  quantityAssigned: number;
  quantityDone: number;
  status: string;
};

type EmployeeItem = {
  id: string;
  fullName: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inconnue";
}

export default function ProductionAssignClient({
  productionStepId,
  orderId,
  isLot,
  lotQuantity,
  assignments,
}: {
  productionStepId: string;
  orderId: string;
  isLot: boolean;
  lotQuantity: number;
  assignments: AssignmentRow[];
}) {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [quantityAssigned, setQuantityAssigned] = useState("1");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [rows, setRows] = useState<AssignmentRow[]>(assignments);

  useEffect(() => {
    setRows(assignments);
  }, [assignments]);

  useEffect(() => {
    let mounted = true;

    async function loadEmployees() {
      try {
        const res = await fetch("/api/production/employees", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!mounted || !data?.ok) return;
        setEmployees(data.employees || []);
        if (data.employees?.length) setEmployeeId(data.employees[0].id);
      } catch {}
    }

    loadEmployees();
    return () => {
      mounted = false;
    };
  }, []);

  const targetTotal = isLot ? Math.max(1, Number(lotQuantity || 1)) : 1;

  const assignedTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.quantityAssigned || 0), 0);
  }, [rows]);

  const doneTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.quantityDone || 0), 0);
  }, [rows]);

  const remaining = Math.max(0, targetTotal - assignedTotal);
  const canClose = rows.length > 0 && doneTotal >= targetTotal;

  async function reloadRows() {
    const res = await fetch(`/api/production/${productionStepId}/assignments`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) {
      setRows(data.rows || []);
    }
  }

  async function createAssignment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      const qty = Number(quantityAssigned || 0);

      const res = await fetch(`/api/production/${productionStepId}/assignments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          employeeId,
          quantityAssigned: qty,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Affectation impossible");
      }

      setMsg("Affectation enregistrée.");
      setQuantityAssigned("1");
      await reloadRows();
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function updateAssignment(
    id: string,
    patch: Partial<{ quantityDone: number; status: string }>
  ) {
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/production/${productionStepId}/assignments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Mise à jour impossible");
      }

      setMsg("Affectation mise à jour.");
      await reloadRows();
    } catch (error) {
      setErr(errorMessage(error));
    }
  }

  async function finishProduction() {
    setErr(null);
    setMsg(null);
    setClosing(true);

    try {
      const res = await fetch(`/api/production/${productionStepId}/finish`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Clôture impossible");
      }

      setMsg("Production terminée et envoyée en qualité.");
      await reloadRows();
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setClosing(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-xs text-zinc-400">Quantité totale</div>
          <div className="mt-1 text-xl font-semibold">{targetTotal}</div>
        </div>
        <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-xs text-zinc-400">Affecté</div>
          <div className="mt-1 text-xl font-semibold">{assignedTotal}</div>
        </div>
        <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-xs text-zinc-400">Reste à affecter</div>
          <div className="mt-1 text-xl font-semibold">{remaining}</div>
        </div>
        <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
          <div className="text-xs text-zinc-400">Réalisé</div>
          <div className="mt-1 text-xl font-semibold">{doneTotal}</div>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
          {err}
        </div>
      )}

      {msg && (
        <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
          {msg}
        </div>
      )}

      <form
        onSubmit={createAssignment}
        className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10 md:grid-cols-4"
      >
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
        >
          <option value="">Choisir un couturier</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.fullName}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          max={remaining || targetTotal}
          value={quantityAssigned}
          onChange={(e) => setQuantityAssigned(e.target.value)}
          className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          placeholder="Quantité"
        />

        <button
          type="button"
          onClick={() => setQuantityAssigned(String(Math.max(1, remaining)))}
          disabled={remaining <= 0}
          className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mettre le reste
        </button>

        <button
          disabled={loading || !employeeId || remaining <= 0}
          className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Affecter"}
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl bg-zinc-950/40 ring-1 ring-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3">Couturier</th>
              <th className="px-4 py-3">Attribué</th>
              <th className="px-4 py-3">Réalisé</th>
              <th className="px-4 py-3">Progression</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => {
              const percent =
                row.quantityAssigned > 0
                  ? Math.min(100, Math.round((row.quantityDone / row.quantityAssigned) * 100))
                  : 0;

              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.employeeName}</td>
                  <td className="px-4 py-3">{row.quantityAssigned}</td>
                  <td className="px-4 py-3">{row.quantityDone}</td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-emerald-400" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">{percent}%</div>
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateAssignment(row.id, {
                            quantityDone: Math.min(row.quantityAssigned, row.quantityDone + 1),
                            status:
                              row.quantityDone + 1 >= row.quantityAssigned
                                ? "TERMINE"
                                : "EN_COURS",
                          })
                        }
                        className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white"
                      >
                        +1 réalisé
                      </button>

                      <button
                        type="button"
                        onClick={() => updateAssignment(row.id, { status: "EN_COURS" })}
                        className="rounded-lg bg-cyan-500/20 px-3 py-1 text-xs text-cyan-200"
                      >
                        Débuter
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateAssignment(row.id, {
                            quantityDone: row.quantityAssigned,
                            status: "TERMINE",
                          })
                        }
                        className="rounded-lg bg-green-600/20 px-3 py-1 text-xs text-green-200"
                      >
                        Terminer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Aucune affectation. Éclate la commande par couturier avant de clôturer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col items-end gap-2">
        {!canClose ? (
          <div className="text-right text-xs text-zinc-400">
            Pour clôturer: {doneTotal}/{targetTotal} pièce(s) réalisées.
          </div>
        ) : null}

        <button
          type="button"
          onClick={finishProduction}
          disabled={closing || !canClose}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {closing ? "Clôture..." : "Clôturer la production et envoyer en qualité"}
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-950/40 p-4 text-sm text-zinc-300 ring-1 ring-white/10">
        Progression globale : <b>{doneTotal}</b> / <b>{targetTotal}</b>
      </div>
    </div>
  );
}
