"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function HrReportsPage() {
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

  const attendanceRate = useMemo(() => {
    if (!stats || stats.activeEmployees === 0) return 0;
    return Math.round((stats.presentToday / stats.activeEmployees) * 100);
  }, [stats]);

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold">Rapports RH</h1>
        <p className="mt-1 text-sm text-zinc-300/80">
          Indicateurs analytiques RH.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="text-sm text-zinc-300">Taux de présence</div>
            <div className="mt-3 text-3xl font-semibold">{attendanceRate}%</div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="text-sm text-zinc-300">Retards du jour</div>
            <div className="mt-3 text-3xl font-semibold">{stats?.lateToday ?? 0}</div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="text-sm text-zinc-300">Congés approuvés</div>
            <div className="mt-3 text-3xl font-semibold">{stats?.leaveApproved ?? 0}</div>
          </div>

          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="text-sm text-zinc-300">Volume activités atelier</div>
            <div className="mt-3 text-3xl font-semibold">
              {(stats?.productionAssignments ?? 0) + (stats?.cutAssignments ?? 0)}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <h2 className="text-lg font-semibold">Synthèse RH</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
            <div>Total employés : <b>{stats?.totalEmployees ?? 0}</b></div>
            <div>Employés actifs : <b>{stats?.activeEmployees ?? 0}</b></div>
            <div>Présents aujourd’hui : <b>{stats?.presentToday ?? 0}</b></div>
            <div>Absents aujourd’hui : <b>{stats?.absentToday ?? 0}</b></div>
            <div>Congés en attente : <b>{stats?.leavePending ?? 0}</b></div>
            <div>Fiches de paie générées : <b>{stats?.payrollCount ?? 0}</b></div>
          </div>
        </div>
      </div>
    </main>
  );
}