"use client";

import { useCallback, useEffect, useState } from "react";

type EmployeeItem = {
  id: string;
  fullName: string;
};

type LeaveItem = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: string;
  employee: {
    fullName: string;
  };
};

export default function LeavePage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [empRes, leaveRes] = await Promise.all([
      fetch("/api/hr/employees", { cache: "no-store", credentials: "include" }),
      fetch("/api/hr/leaves", { cache: "no-store", credentials: "include" }),
    ]);

    const empData = await empRes.json().catch(() => ({}));
    const leaveData = await leaveRes.json().catch(() => ({}));

    if (empData?.ok) {
      setEmployees(empData.employees || []);
      if (empData.employees?.length) {
        setEmployeeId((current) => current || empData.employees[0].id);
      }
    }

    if (leaveData?.ok) {
      setLeaves(leaveData.leaves || []);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          startDate,
          endDate,
          reason,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Création échouée");
      }

      setReason("");
      setStartDate("");
      setEndDate("");
      setMsg("Demande de congé enregistrée.");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function updateLeave(id: string, status: "APPROUVE" | "REJETE") {
    try {
      setErr(null);
      setMsg(null);

      const res = await fetch(`/api/hr/leaves/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Mise à jour échouée");
      }

      setMsg(`Demande ${status === "APPROUVE" ? "approuvée" : "rejetée"}.`);
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">Congés</h1>

        <form
          onSubmit={onSubmit}
          className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 md:grid-cols-4"
        >
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            <option value="">Choisir un employé</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <button
            disabled={loading}
            className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950"
          >
            {loading ? "..." : "Demander"}
          </button>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif"
            className="md:col-span-4 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />
        </form>

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

        <div className="mt-6 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">{l.employee.fullName}</td>
                  <td className="px-4 py-3">
                    {new Date(l.startDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(l.endDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">{l.status}</td>
                  <td className="px-4 py-3">{l.reason ?? "—"}</td>
                  <td className="px-4 py-3">
                    {l.status === "EN_ATTENTE" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateLeave(l.id, "APPROUVE")}
                          className="rounded-lg bg-green-600 px-3 py-1 text-white"
                        >
                          Approuver
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLeave(l.id, "REJETE")}
                          className="rounded-lg bg-red-600 px-3 py-1 text-white"
                        >
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}

              {leaves.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    Aucune demande de congé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
