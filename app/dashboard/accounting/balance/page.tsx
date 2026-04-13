 "use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

type Totals = {
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

export default function BalancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadData = useCallback(async () => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);

    const res = await fetch(`/api/accounting/reports/balance?${q.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    if (data?.ok) {
      setRows(data.rows || []);
      setTotals(data.totals || null);
    }
  }, [from, to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold">Balance comptable</h1>

        <div className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />
          <button
            onClick={loadData}
            className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950"
          >
            Filtrer
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Débit</th>
                <th className="px-4 py-3">Crédit</th>
                <th className="px-4 py-3">Solde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((r) => (
                <tr key={r.accountId}>
                  <td className="px-4 py-3">{r.code}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">{r.totalDebit}</td>
                  <td className="px-4 py-3">{r.totalCredit}</td>
                  <td className="px-4 py-3 font-semibold">{r.balance}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    Aucune donnée.
                  </td>
                </tr>
              )}
            </tbody>
            {totals && (
              <tfoot className="bg-white/5">
                <tr>
                  <td className="px-4 py-3 font-semibold" colSpan={3}>Totaux</td>
                  <td className="px-4 py-3 font-semibold">{totals.totalDebit}</td>
                  <td className="px-4 py-3 font-semibold">{totals.totalCredit}</td>
                  <td className="px-4 py-3 font-semibold">{totals.balance}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </main>
  );
}
