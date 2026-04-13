"use client";

import { useCallback, useEffect, useState } from "react";

type Account = {
  id: string;
  code: string;
  name: string;
};

type Entry = {
  id: string;
  date: string;
  label: string;
  debit: number;
  credit: number;
  currency: string;
  account: Account;
};

export default function EntriesPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);

  const [accountId, setAccountId] = useState("");
  const [label, setLabel] = useState("");
  const [debit, setDebit] = useState("0");
  const [credit, setCredit] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [fxRate, setFxRate] = useState("1");
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [accRes, entRes] = await Promise.all([
      fetch("/api/accounting/accounts", { cache: "no-store", credentials: "include" }),
      fetch("/api/accounting/entries", { cache: "no-store", credentials: "include" }),
    ]);

    const accData = await accRes.json();
    const entData = await entRes.json();

    if (accData?.ok) {
      setAccounts(accData.accounts || []);
      if (accData.accounts?.length) {
        setAccountId((current) => current || accData.accounts[0].id);
      }
    }

    if (entData?.ok) {
      setEntries(entData.entries || []);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const res = await fetch("/api/accounting/entries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, label, debit: Number(debit), credit: Number(credit), currency, fxRate: Number(fxRate) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Création échouée");

      setLabel("");
      setDebit("0");
      setCredit("0");
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Erreur inconnue");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">Écritures comptables</h1>

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 md:grid-cols-3">
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
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Libellé"
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

          <input
            value={debit}
            onChange={(e) => setDebit(e.target.value)}
            type="number"
            placeholder="Débit"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <input
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            type="number"
            placeholder="Crédit"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <input
            value={fxRate}
            onChange={(e) => setFxRate(e.target.value)}
            type="number"
            placeholder="Taux"
            className="rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
          />

          <button className="md:col-span-3 rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
            Enregistrer l’écriture
          </button>
        </form>

        {err && <div className="mt-4 text-red-300">{err}</div>}

        <div className="mt-6 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Débit</th>
                <th className="px-4 py-3">Crédit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">{new Date(e.date).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3">{e.account.code} - {e.account.name}</td>
                  <td className="px-4 py-3">{e.label}</td>
                  <td className="px-4 py-3">{e.debit}</td>
                  <td className="px-4 py-3">{e.credit}</td>
                </tr>
              ))}

              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                    Aucune écriture comptable.
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
