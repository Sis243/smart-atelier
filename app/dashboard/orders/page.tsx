import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LATE_DAYS = 7;

function badge(status: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`;
  if (status === "EN_COURS") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (status === "TERMINE") return `${base} bg-green-500/15 text-green-200 ring-green-400/20`;
  return `${base} bg-red-500/15 text-red-200 ring-red-400/20`;
}

function dotClass(status: string) {
  const base = "h-3.5 w-3.5 rounded-full ring-1 ring-white/15";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-400/80`;
  if (status === "EN_COURS") return `${base} bg-blue-400/80`;
  if (status === "TERMINE") return `${base} bg-green-400/80`;
  if (status === "REJETE") return `${base} bg-red-400/80`;
  return `${base} bg-zinc-400/40`;
}

function isLate(createdAt: Date, orderStatus: string) {
  if (orderStatus === "TERMINE") return false;
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays >= LATE_DAYS;
}

function lateLabel(createdAt: Date) {
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  return `${ageDays} j`;
}

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      cut: true,
      production: true,
      quality: true,
      delivery: true,
    },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Commandes</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Liste ERP (workflow compact + retard auto).
            </p>
          </div>

          <Link
            href="/dashboard/orders/nouvelle"
            className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            + Nouvelle commande
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Retard</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Avance</th>
                <th className="px-4 py-3">Solde</th>
                <th className="px-4 py-3">Créée</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {orders.map((o) => {
                const cut = o.cut?.status ?? "—";
                const prod = o.production?.status ?? "—";
                const qual = o.quality?.status ?? "—";
                const del = o.delivery?.status ?? "—";

                const late = isLate(new Date(o.createdAt), o.status);

                return (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="font-semibold text-amber-200 hover:underline"
                      >
                        {o.code}
                      </Link>
                    </td>

                    <td className="px-4 py-3">{o.customer.fullName}</td>

                    <td className="px-4 py-3">
                      <span className={badge(o.status)}>{o.status}</span>
                    </td>

                    <td className="px-4 py-3">
                      {late ? (
                        <span
                          className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] text-red-200 ring-1 ring-red-400/20"
                          title={`Commande créée il y a ${lateLabel(new Date(o.createdAt))}. Seuil: ${LATE_DAYS} jours.`}
                        >
                          ⚠️ {lateLabel(new Date(o.createdAt))}
                        </span>
                      ) : (
                        <span className="text-zinc-300/60 text-[12px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={dotClass(cut)} title={`✂️ Coupe : ${cut}`} />
                        <span className={dotClass(prod)} title={`🧵 Production : ${prod}`} />
                        <span className={dotClass(qual)} title={`✅ Qualité : ${qual}`} />
                        <span className={dotClass(del)} title={`🚚 Livraison : ${del}`} />
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-300/70">
                        ✂️ {cut} • 🧵 {prod} • ✅ {qual} • 🚚 {del}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      {o.currency} {Number(o.totalAmount ?? 0).toLocaleString("fr-FR")}
                    </td>

                    <td className="px-4 py-3">
                      {o.currency} {Number(o.depositAmount ?? 0).toLocaleString("fr-FR")}
                    </td>

                    <td className="px-4 py-3">
                      {o.currency} {Number(o.balanceAmount ?? 0).toLocaleString("fr-FR")}
                    </td>

                    <td className="px-4 py-3 text-zinc-300/80">
                      {new Date(o.createdAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-300/80" colSpan={9}>
                    Aucune commande. Clique sur <b>Nouvelle commande</b>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-300/70">
          Workflow compact : survole les points pour voir les statuts. Retard = commande non terminée après {LATE_DAYS} jours.
        </p>
      </div>
    </main>
  );
}