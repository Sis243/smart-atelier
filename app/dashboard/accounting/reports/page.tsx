"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type IncomeStatement = {
  revenue: number;
  expense: number;
  netResult: number;
};

type Bilan = {
  assets: number;
  liabilities: number;
  equity: number;
};

type Summary = {
  totalDebit: number;
  totalCredit: number;
  invoiceIssued: number;
  invoicePaid: number;
  totalExpenses: number;
  totalPayments: number;
  netCash: number;
};

async function safeJson(res: Response) {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Réponse non JSON (${res.status}) : ${text.slice(0, 200)}`);
  }
}

export default function AccountingReportsPage() {
  const [income, setIncome] = useState<IncomeStatement | null>(null);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const exportQuery = new URLSearchParams();
  if (from) exportQuery.set("from", from);
  if (to) exportQuery.set("to", to);
  const exportSuffix = exportQuery.toString() ? `?${exportQuery.toString()}` : "";

  const load = useCallback(async () => {
    try {
      setErr(null);

      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);

      const [r1, r2, r3] = await Promise.all([
        fetch("/api/accounting/reports/income-statement", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/accounting/reports/bilan", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/accounting/reports/summary?${q.toString()}`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const d1 = await safeJson(r1);
      const d2 = await safeJson(r2);
      const d3 = await safeJson(r3);

      if (!r1.ok) throw new Error(d1?.error || "Erreur compte de résultat");
      if (!r2.ok) throw new Error(d2?.error || "Erreur bilan");
      if (!r3.ok) throw new Error(d3?.error || "Erreur synthèse");

      if (d1?.ok) setIncome(d1.report);
      if (d2?.ok) setBilan(d2.report);
      if (d3?.ok) setSummary(d3.summary);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  async function closePeriod(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch("/api/accounting/period-close", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ periodLabel }),
      });

      const data = await safeJson(res);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Clôture impossible");
      }

      setMsg(`Clôture enregistrée : ${data.closure.periodLabel}`);
      setPeriodLabel("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Rapports comptables premium</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Compte de résultat, bilan, synthèse et clôture.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/accounting/entries"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10"
            >
              Journal
            </Link>
            <Link
              href="/dashboard/accounting/balance"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10"
            >
              Balance
            </Link>
            <Link
              href="/dashboard/accounting/ledger"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10"
            >
              Grand livre
            </Link>
            <Link
              href="/dashboard/accounting/cashflow"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10"
            >
              Trésorerie
            </Link>
          </div>
        </div>

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
            onClick={load}
            className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950"
          >
            Actualiser
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/accounting/export/journal-xlsx${exportSuffix}`}
            className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Journal Excel
          </a>

          <a
            href={`/api/accounting/export/balance-xlsx${exportSuffix}`}
            className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Balance Excel
          </a>

          <a
            href="/dashboard/accounting/print"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10"
          >
            Version PDF / impression
          </a>
        </div>

        {err && (
          <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/20">
            {err}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Compte de résultat</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                Produits : <b>{Number(income?.revenue ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Charges : <b>{Number(income?.expense ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Résultat net :{" "}
                <b>{Number(income?.netResult ?? 0).toLocaleString("fr-FR")}</b>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Bilan simplifié</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                Actifs : <b>{Number(bilan?.assets ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Passifs :{" "}
                <b>{Number(bilan?.liabilities ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Capitaux propres :{" "}
                <b>{Number(bilan?.equity ?? 0).toLocaleString("fr-FR")}</b>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Synthèse financière</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                Débit total :{" "}
                <b>{Number(summary?.totalDebit ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Crédit total :{" "}
                <b>{Number(summary?.totalCredit ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Factures émises : <b>{summary?.invoiceIssued ?? 0}</b>
              </div>
              <div>
                Factures encaissées : <b>{summary?.invoicePaid ?? 0}</b>
              </div>
              <div>
                Dépenses :{" "}
                <b>{Number(summary?.totalExpenses ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Encaissements :{" "}
                <b>{Number(summary?.totalPayments ?? 0).toLocaleString("fr-FR")}</b>
              </div>
              <div>
                Trésorerie nette :{" "}
                <b>{Number(summary?.netCash ?? 0).toLocaleString("fr-FR")}</b>
              </div>
            </div>
          </section>
        </div>

        <form
          onSubmit={closePeriod}
          className="mt-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
        >
          <h2 className="text-lg font-semibold">Clôture comptable</h2>

          {msg && <div className="mt-4 text-emerald-300">{msg}</div>}
          {err && <div className="mt-4 text-red-300">{err}</div>}

          <div className="mt-4 flex gap-3">
            <input
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="Ex: Avril 2026"
              className="flex-1 rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10"
            />
            <button className="rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950">
              Clôturer
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
