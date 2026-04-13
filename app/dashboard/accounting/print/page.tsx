"use client";

import { useEffect, useState } from "react";

type Summary = {
  totalDebit: number;
  totalCredit: number;
  invoiceIssued: number;
  invoicePaid: number;
  totalExpenses: number;
  totalPayments: number;
  netCash: number;
};

export default function AccountingPrintPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const res = await fetch("/api/accounting/reports/summary", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (mounted && data?.ok) setSummary(data.summary);
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-white p-8 text-black">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rapport Comptable</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Synthèse financière imprimable
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Imprimer / PDF
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Débit total</div>
            <div className="mt-2 text-2xl font-semibold">{summary?.totalDebit ?? 0}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Crédit total</div>
            <div className="mt-2 text-2xl font-semibold">{summary?.totalCredit ?? 0}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Factures émises</div>
            <div className="mt-2 text-2xl font-semibold">{summary?.invoiceIssued ?? 0}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Factures encaissées</div>
            <div className="mt-2 text-2xl font-semibold">{summary?.invoicePaid ?? 0}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Dépenses</div>
            <div className="mt-2 text-2xl font-semibold">{summary?.totalExpenses ?? 0}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Trésorerie nette</div>
            <div className="mt-2 text-2xl font-semibold">{summary?.netCash ?? 0}</div>
          </div>
        </div>

        <div className="mt-10 text-xs text-zinc-500">
          Document généré depuis Smart Atelier.
        </div>
      </div>
    </main>
  );
}
