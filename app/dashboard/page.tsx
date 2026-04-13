"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/ui";
import AlertList from "@/components/dashboard/AlertList";
import RecentActivityList from "@/components/dashboard/RecentActivityList";
import LowStockList from "@/components/dashboard/LowStockList";
import ExecutiveRecentOrders from "@/components/dashboard/ExecutiveRecentOrders";

type ExecutiveData = {
  meta: {
    lateThresholdDays: number;
  };
  orders: {
    total: number;
    inProgress: number;
    done: number;
    late: number;
  };
  workflow: {
    cut: number;
    production: number;
    quality: number;
    delivery: number;
  };
  hr: {
    employeesCount: number;
    activeEmployeesCount: number;
    presentToday: number;
    lateToday: number;
    leavePending: number;
  };
  finance: {
    revenueIssued: number;
    revenuePaid: number;
    receivables: number;
    cashIn: number;
    cashOut: number;
    netCash: number;
  };
  stock: {
    lowCount: number;
    lowItems: Array<{
      id: string;
      name: string;
      quantity: number;
      minQuantity: number;
    }>;
  };
  recentOrders: Array<{
    id: string;
    code: string;
    customer: string;
    status: string;
    createdAt: string;
  }>;
  alerts: string[];
  recentActivities: Array<{
    id: string;
    action: string;
    entity?: string | null;
    createdAt: string;
  }>;
};

function money(v: number) {
  return Number(v || 0).toLocaleString("fr-FR");
}

export default function DashboardPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);

  async function loadData() {
    const res = await fetch("/api/dashboard/executive", { cache: "no-store" });
    const json = await res.json();
    if (json?.ok) setData(json.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Dashboard DG / Manager"
        subtitle="Pilotage global de l’atelier : opérations, RH, finance, stock et alertes."
        actions={[
          { label: "Commandes", href: "/dashboard/orders" },
          { label: "RH", href: "/dashboard/hr" },
          { label: "Comptabilité", href: "/dashboard/accounting" },
          { label: "Messagerie", href: "/dashboard/chat", variant: "primary" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Commandes en cours"
          value={data?.orders.inProgress ?? 0}
          helper="Dossiers opérationnels"
        />
        <StatCard
          label="Commandes terminées"
          value={data?.orders.done ?? 0}
          helper="Livrées / finalisées"
        />
        <StatCard
          label="Commandes en retard"
          value={data?.orders.late ?? 0}
          helper={`Seuil > ${data?.meta.lateThresholdDays ?? 7} jours`}
          danger={(data?.orders.late ?? 0) > 0}
        />
        <StatCard
          label="Trésorerie nette"
          value={money(data?.finance.netCash ?? 0)}
          helper="Encaissements - dépenses"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Alertes direction"
          subtitle="Points critiques à suivre immédiatement"
        >
          <AlertList alerts={data?.alerts ?? []} />
        </SectionCard>

        <SectionCard
          title="Commandes récentes"
          subtitle="Derniers dossiers créés"
        >
          <ExecutiveRecentOrders items={data?.recentOrders ?? []} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          label="Coupe"
          value={data?.workflow.cut ?? 0}
          helper="Dossiers à préparer"
        />
        <StatCard
          label="Production"
          value={data?.workflow.production ?? 0}
          helper="Travaux en cours"
        />
        <StatCard
          label="Qualité"
          value={data?.workflow.quality ?? 0}
          helper="Contrôles en attente"
        />
        <StatCard
          label="Livraison"
          value={data?.workflow.delivery ?? 0}
          helper="Commandes à remettre"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Synthèse RH"
          subtitle="Vue rapide ressources humaines"
        >
          <div className="space-y-2 text-sm text-zinc-300">
            <div>Total employés : <b className="text-white">{data?.hr.employeesCount ?? 0}</b></div>
            <div>Employés actifs : <b className="text-white">{data?.hr.activeEmployeesCount ?? 0}</b></div>
            <div>Présents : <b className="text-white">{data?.hr.presentToday ?? 0}</b></div>
            <div>Retards : <b className="text-white">{data?.hr.lateToday ?? 0}</b></div>
            <div>Congés en attente : <b className="text-white">{data?.hr.leavePending ?? 0}</b></div>
          </div>
        </SectionCard>

        <SectionCard
          title="Synthèse financière"
          subtitle="Vue DG / manager"
        >
          <div className="space-y-2 text-sm text-zinc-300">
            <div>Factures émises : <b className="text-white">{money(data?.finance.revenueIssued ?? 0)}</b></div>
            <div>Factures encaissées : <b className="text-white">{money(data?.finance.revenuePaid ?? 0)}</b></div>
            <div>Créances : <b className="text-white">{money(data?.finance.receivables ?? 0)}</b></div>
            <div>Encaissements : <b className="text-white">{money(data?.finance.cashIn ?? 0)}</b></div>
            <div>Dépenses : <b className="text-white">{money(data?.finance.cashOut ?? 0)}</b></div>
          </div>
        </SectionCard>

        <SectionCard
          title="Stock critique"
          subtitle="Articles au seuil minimum"
        >
          <LowStockList items={data?.stock.lowItems ?? []} />
        </SectionCard>
      </div>

      <SectionCard
        title="Activité récente"
        subtitle="Historique synthétique du système"
      >
        <RecentActivityList items={data?.recentActivities ?? []} />
      </SectionCard>
    </main>
  );
}