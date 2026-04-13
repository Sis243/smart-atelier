"use client";

import { useCallback, useEffect, useState } from "react";

type Account = {
  id: string;
  code: string;
  name: string;
};

type LedgerRow = {
  id: string;
  date: string;
  label: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
};

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadAccounts = useCallback(async () => {
    const res = await fetch("/api/accounting/accounts", {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    if (data?.ok) {
      setAccounts(data.accounts || []);
      if (data.accounts?.length) {
        setAccountId((current) => current || data.accounts[0].id);
      }
    }
  }, []);

  const loadLedger = useCallback(async (id: string) => {
    if (!id) return;

    const q = new URLSearchParams({ accountId: id });
    if (from) q.set("from", from);
    if (to) q.set("to", to);

    const res = await fetch(`/api/accounting/reports/ledger?${q.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json();
    if (data?.ok) setRows(data.rows || []);
  }, [from, to]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (accountId) loadLedger(accountId);
  }, [accountId, loadLedger]);

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold">Grand livre</h1>

        <div className="mt-6 flex flex-wrap gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.name}
              </option>
            ))}
          </select>

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
            onClick={() => loadLedger(accountId)}
            className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950"
          >
            Charger
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Débit</th>
                <th className="px-4 py-3">Crédit</th>
                <th className="px-4 py-3">Solde cumulé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{new Date(r.date).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3">{r.label}</td>
                  <td className="px-4 py-3">{r.debit}</td>
                  <td className="px-4 py-3">{r.credit}</td>
                  <td className="px-4 py-3 font-semibold">{r.balance}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                    Aucune donnée.
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
