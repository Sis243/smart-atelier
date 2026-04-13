"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Entry = {
  id: string;
  date: string;
  label: string;
  debit: number;
  credit: number;
  currency: string;
  account?: {
    code: string;
    name: string;
  } | null;
};

type Stats = {
  accountsCount: number;
  entriesCount: number;
  invoicesCount: number;
  expensesCount: number;
  totalInvoicePaid: number;
  totalInvoiceIssued: number;
  totalExpenses: number;
};

function money(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `${value || 0} ${currency}`;
  }
}

function Card({
  title,
  value,
  subtitle,
  tone = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-200"
      : tone === "warn"
        ? "text-amber-200"
        : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
      <p className="text-sm text-neutral-400">{title}</p>
      <h3 className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</h3>
      {subtitle ? <p className="mt-1 text-xs text-neutral-500">{subtitle}</p> : null}
    </div>
  );
}

export default function AccountingDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [latestEntries, setLatestEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const remainingInvoices = Math.max(
    0,
    Number(stats?.totalInvoiceIssued ?? 0) - Number(stats?.totalInvoicePaid ?? 0)
  );
  const netPosition = Number(stats?.totalInvoicePaid ?? 0) - Number(stats?.totalExpenses ?? 0);

  const cards = useMemo(
    () => [
      {
        title: "Comptes",
        value: String(stats?.accountsCount ?? 0),
        subtitle: "Plan comptable disponible",
      },
      {
        title: "Écritures",
        value: String(stats?.entriesCount ?? 0),
        subtitle: "Lignes comptables enregistrées",
      },
      {
        title: "Encaissements",
        value: money(stats?.totalInvoicePaid ?? 0, "USD"),
        subtitle: "Factures payées",
        tone: "good" as const,
      },
      {
        title: "Charges",
        value: money(stats?.totalExpenses ?? 0, "USD"),
        subtitle: "Dépenses enregistrées",
        tone: "warn" as const,
      },
      {
        title: "Reste à encaisser",
        value: money(remainingInvoices, "USD"),
        subtitle: "Factures émises moins payées",
      },
      {
        title: "Position nette",
        value: money(netPosition, "USD"),
        subtitle: "Encaissements moins charges",
        tone: netPosition >= 0 ? ("good" as const) : ("warn" as const),
      },
    ],
    [netPosition, remainingInvoices, stats]
  );

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [statsRes, entriesRes] = await Promise.all([
          fetch("/api/accounting/dashboard", { cache: "no-store", credentials: "include" }),
          fetch("/api/accounting/entries?limit=8", { cache: "no-store", credentials: "include" }),
        ]);

        const statsJson = await statsRes.json().catch(() => ({}));
        const entriesJson = await entriesRes.json().catch(() => ({}));

        if (!statsRes.ok || !statsJson?.ok) {
          throw new Error(statsJson?.error || "Impossible de charger les statistiques comptables.");
        }

        if (!entriesRes.ok || !entriesJson?.ok) {
          throw new Error(entriesJson?.error || "Impossible de charger les dernières écritures.");
        }

        if (!mounted) return;

        setStats(statsJson.stats ?? null);
        setLatestEntries(Array.isArray(entriesJson.entries) ? entriesJson.entries : []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Comptabilité</p>
            <h1 className="text-3xl font-extrabold">Tableau de bord comptable</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Suivi des comptes, écritures, encaissements, charges et rapports.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/accounting/entries" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20">
              Saisir une écriture
            </Link>
            <Link href="/dashboard/accounting/accounts" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              Plan comptable
            </Link>
            <Link href="/dashboard/accounting/reports" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20">
              Rapports
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-neutral-300">
            Chargement des données comptables...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <Card key={card.title} {...card} />
              ))}
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-3">
              <Link href="/dashboard/accounting/balance" className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                <div className="text-sm text-neutral-400">Balance</div>
                <div className="mt-2 text-lg font-semibold">Contrôler les soldes</div>
              </Link>
              <Link href="/dashboard/accounting/ledger" className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                <div className="text-sm text-neutral-400">Grand livre</div>
                <div className="mt-2 text-lg font-semibold">Analyser un compte</div>
              </Link>
              <Link href="/dashboard/accounting/cashflow" className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                <div className="text-sm text-neutral-400">Trésorerie</div>
                <div className="mt-2 text-lg font-semibold">Entrées et sorties</div>
              </Link>
            </section>

            <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Dernières écritures</h2>
                  <p className="text-sm text-neutral-400">Opérations les plus récentes.</p>
                </div>
                <Link href="/dashboard/accounting/entries" className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
                  Tout ouvrir
                </Link>
              </div>

              {latestEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-neutral-400">
                  Aucune écriture disponible.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-neutral-400">
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Libellé</th>
                        <th className="px-3 py-3">Compte</th>
                        <th className="px-3 py-3">Débit</th>
                        <th className="px-3 py-3">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/5 text-neutral-100">
                          <td className="px-3 py-3">
                            {entry.date ? new Date(entry.date).toLocaleDateString("fr-FR") : "-"}
                          </td>
                          <td className="px-3 py-3">{entry.label || "-"}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium">{entry.account?.name || "-"}</div>
                            <div className="text-xs text-neutral-400">{entry.account?.code || ""}</div>
                          </td>
                          <td className="px-3 py-3">{money(entry.debit ?? 0, entry.currency || "USD")}</td>
                          <td className="px-3 py-3">{money(entry.credit ?? 0, entry.currency || "USD")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}