import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductionPage() {
  const prismaAny = prisma as any;

  const rows = await prismaAny.productionStep.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      responsible: true,
      order: {
        include: {
          customer: true,
        },
      },
    },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Production</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Suivi des commandes envoyées en production.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Dernière mise à jour</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.order?.code ?? row.orderId}</td>
                  <td className="px-4 py-3">{row.order?.customer?.fullName ?? "—"}</td>
                  <td className="px-4 py-3">{row.status ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.responsible?.fullName ?? row.responsible?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.updatedAt
                      ? new Date(row.updatedAt).toLocaleString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/production/${row.id}`}
                      className="text-amber-300 hover:underline"
                    >
                      Ouvrir →
                    </Link>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    Aucune commande en production.
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