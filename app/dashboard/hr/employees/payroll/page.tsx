"use client";

import { useCallback, useEffect, useState } from "react";

type EmployeeItem = {
  id: string;
  fullName: string;
  baseSalary: number;
  currency: string;
};

type PayslipItem = {
  id: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  generatedAt: string;
  employee: {
    fullName: string;
  };
  payrollRun?: {
    periodLabel: string;
  } | null;
};

export default function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [baseSalary, setBaseSalary] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [empRes, payrollRes] = await Promise.all([
      fetch("/api/hr/employees", { cache: "no-store", credentials: "include" }),
      fetch("/api/hr/payroll", { cache: "no-store", credentials: "include" }),
    ]);

    const empData = await empRes.json();
    const payrollData = await payrollRes.json();

    if (empData?.ok) {
      setEmployees(empData.employees || []);
      if (empData.employees?.length) {
        setEmployeeId((current) => current || empData.employees[0].id);
      }
    }

    if (payrollData?.ok) {
      setPayslips(payrollData.payslips || []);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const found = employees.find((e) => e.id === employeeId);
    if (found) {
      setBaseSalary(String(found.baseSalary ?? 0));
      setCurrency(found.currency ?? "USD");
    }
  }, [employeeId, employees]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          periodLabel,
          baseSalary: Number(baseSalary),
          bonus: Number(bonus),
          deductions: Number(deductions),
          currency,
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Création fiche de paie échouée");
      }

      setBonus("0");
      setDeductions("0");
      setNote("");
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
        <h1 className="text-2xl font-bold">Paie</h1>

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 md:grid-cols-3">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>

          <input
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            placeholder="Période : Avril 2026"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <input
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            type="number"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <input
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
            type="number"
            placeholder="Bonus"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <input
            value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
            type="number"
            placeholder="Retenues"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </select>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="md:col-span-3 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <button
            disabled={loading}
            className="md:col-span-3 rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950"
          >
            {loading ? "..." : "Générer la fiche de paie"}
          </button>
        </form>

        {err && <div className="mt-4 text-red-300">{err}</div>}

        <div className="mt-6 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Retenues</th>
                <th className="px-4 py-3">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {payslips.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.employee.fullName}</td>
                  <td className="px-4 py-3">{p.payrollRun?.periodLabel ?? "—"}</td>
                  <td className="px-4 py-3">{p.baseSalary}</td>
                  <td className="px-4 py-3">{p.bonus}</td>
                  <td className="px-4 py-3">{p.deductions}</td>
                  <td className="px-4 py-3 font-semibold">{p.netSalary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
