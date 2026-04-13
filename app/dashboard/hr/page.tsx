"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  leavePending: number;
  leaveApproved: number;
  payrollCount: number;
  productionAssignments: number;
  cutAssignments: number;
};

export default function HrDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const res = await fetch("/api/hr/stats", { cache: "no-store" });
        const data = await res.json();
        if (mounted && data?.ok) {
          setStats(data.stats);
        }
      } catch {}
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { label: "Total employés", value: stats?.totalEmployees ?? 0 },
    { label: "Actifs", value: stats?.activeEmployees ?? 0 },
    { label: "Présents aujourd’hui", value: stats?.presentToday ?? 0 },
    { label: "Retards aujourd’hui", value: stats?.lateToday ?? 0 },
    { label: "Absents aujourd’hui", value: stats?.absentToday ?? 0 },
    { label: "Congés en attente", value: stats?.leavePending ?? 0 },
    { label: "Congés approuvés", value: stats?.leaveApproved ?? 0 },
    { label: "Fiches de paie", value: stats?.payrollCount ?? 0 },
    { label: "Affectations production", value: stats?.productionAssignments ?? 0 },
    { label: "Affectations coupe", value: stats?.cutAssignments ?? 0 },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Ressources Humaines</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Tableau de bord RH niveau entreprise.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/hr/employees" className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
              Employés
            </Link>
            <Link href="/dashboard/hr/attendance" className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
              Présences
            </Link>
            <Link href="/dashboard/hr/leaves" className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
              Congés
            </Link>
            <a href="/api/hr/export/employees" className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950">
              Export employés CSV
            </a>
            <a href="/api/hr/export/attendance" className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950">
              Export présences CSV
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <div className="text-sm text-zinc-300">{c.label}</div>
              <div className="mt-3 text-3xl font-semibold">{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}