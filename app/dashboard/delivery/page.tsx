import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function statusTone(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "TERMINE") return "bg-emerald-500/10 text-emerald-200 ring-emerald-400/20";
  if (s === "EN_COURS") return "bg-cyan-500/10 text-cyan-200 ring-cyan-400/20";
  if (s === "REJETE") return "bg-red-500/10 text-red-200 ring-red-400/20";
  return "bg-yellow-500/10 text-yellow-200 ring-yellow-400/20";
}

export default async function DeliveryPage() {
  const prismaAny = prisma as any;

  const rows = await prismaAny.deliveryStep.findMany({
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
            <h1 className="text-2xl font-bold">Livraison</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Commandes prêtes à être remises au client.
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
                <tr key={row.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">
                    {row.order?.code ?? row.orderId}
                  </td>
                  <td className="px-4 py-3">{row.order?.customer?.fullName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs ring-1 ${statusTone(
                        row.status
                      )}`}
                    >
                      {row.status ?? "—"}
                    </span>
                  </td>
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
                      href={`/dashboard/delivery/${row.id}`}
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
                    Aucune commande en livraison.
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