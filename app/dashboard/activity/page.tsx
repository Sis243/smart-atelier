"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  SectionCard,
  DataTable,
  EmptyState,
} from "@/components/ui";

type Row = {
  id: string;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  metaJson?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  } | null;
};

export default function ActivityPage() {
  const [rows, setRows] = useState<Row[]>([]);

  async function loadData() {
    const res = await fetch("/api/activity", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) setRows(data.rows || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Journal d’activité"
        subtitle="Historique global des actions système."
        actions={[{ label: "Dashboard", href: "/dashboard" }]}
      />

      <SectionCard title="Activités récentes">
        <DataTable
          headers={["Date", "Utilisateur", "Action", "Entité", "Détails"]}
          empty={
            <EmptyState
              title="Aucune activité"
              description="Les actions système apparaîtront ici."
            />
          }
          colSpan={5}
        >
          {rows.length > 0
            ? rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-zinc-300">
                    {new Date(row.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {row.user?.fullName ?? "Système"}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{row.action}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {row.entity ?? "—"} {row.entityId ? `(${row.entityId})` : ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {row.metaJson ? (
                      <pre className="max-w-[320px] overflow-auto whitespace-pre-wrap text-xs">
                        {row.metaJson}
                      </pre>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            : null}
        </DataTable>
      </SectionCard>
    </main>
  );
}