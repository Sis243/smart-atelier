"use client";

import { useCallback, useEffect, useState } from "react";

type EmployeeItem = {
  id: string;
  fullName: string;
};

type AttendanceItem = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "RETARD" | "CONGE";
  note?: string | null;
  notes?: string | null;
  employee: {
    id: string;
    fullName: string;
  };
};

export default function AttendancePage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [rows, setRows] = useState<AttendanceItem[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"PRESENT" | "ABSENT" | "RETARD" | "CONGE">("PRESENT");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [empRes, attRes] = await Promise.all([
      fetch("/api/hr/employees", { cache: "no-store", credentials: "include" }),
      fetch("/api/hr/attendance", { cache: "no-store", credentials: "include" }),
    ]);

    const empData = await empRes.json().catch(() => ({}));
    const attData = await attRes.json().catch(() => ({}));

    if (empData?.ok) {
      setEmployees(empData.employees || []);
      if (empData.employees?.length) {
        setEmployeeId((current) => current || empData.employees[0].id);
      }
    }

    if (attData?.ok) {
      setRows(attData.rows || []);
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
      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          date,
          status,
          notes,
          note: notes,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Enregistrement impossible");
      }

      setMsg("PrÃ©sence enregistrÃ©e avec succÃ¨s.");
      setNotes("");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">PrÃ©sence</h1>
        <p className="mt-1 text-sm text-zinc-300/80">
          Enregistrement des prÃ©sences, absences et retards.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 md:grid-cols-5"
        >
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            <option value="">Choisir un employÃ©</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            <option value="PRESENT">PrÃ©sent</option>
            <option value="ABSENT">Absent</option>
            <option value="RETARD">Retard</option>
            <option value="CONGE">CongÃ©</option>
          </select>

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observation"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10 md:col-span-2"
          />

          <button
            disabled={loading}
            className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950 md:col-span-5"
          >
            {loading ? "Enregistrement..." : "Enregistrer la prÃ©sence"}
          </button>
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
                <th className="px-4 py-3">EmployÃ©</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.employee.fullName}</td>
                  <td className="px-4 py-3">
                    {new Date(row.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.note ?? row.notes ?? "-"}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                    Aucune prÃ©sence enregistrÃ©e.
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
