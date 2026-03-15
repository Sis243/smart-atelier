import Link from "next/link";
import { prisma } from "@/lib/db";
import OrderFilesClient from "./OrderFilesClient";

function money(amount: number, currency: string) {
  const v = Number(amount || 0);
  return `${currency} ${v.toLocaleString("fr-FR")}`;
}

function badge(status: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`;
  if (status === "EN_COURS") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (status === "TERMINE") return `${base} bg-green-500/15 text-green-200 ring-green-400/20`;
  return `${base} bg-red-500/15 text-red-200 ring-red-400/20`;
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      payments: { orderBy: { paidAt: "desc" } },
      cut: true,
      production: true,
      quality: true,
      delivery: true,
    },
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
        <div className="mx-auto max-w-6xl text-zinc-200">Commande introuvable.</div>
      </main>
    );
  }

  // ✅ ce que tu as demandé
  const attachments = await prisma.orderAttachment.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Commande — {order.code}</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Détails + paiements + pièces jointes (PDF/JPG/PNG/Word/Excel).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/orders"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 ring-1 ring-white/10"
            >
              ← Retour
            </Link>
            <span className={badge(order.status)}>{order.status}</span>
          </div>
        </div>

        {/* TOP CARDS */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Client */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Client</div>
            <div className="mt-1 text-lg font-semibold">{order.customer.fullName}</div>
            <div className="mt-2 text-sm text-white/70">📞 {order.customer.phone ?? "—"}</div>
            <div className="mt-1 text-sm text-white/70">📍 {order.customer.address ?? "—"}</div>
          </div>

          {/* Montants */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Paiement</div>
            <div className="mt-2 space-y-1 text-sm text-white/85">
              <div>
                Total : <b>{money(order.totalAmount, order.currency)}</b>
              </div>
              <div>
                Remise : <b>{money(order.discount, order.currency)}</b>
              </div>
              <div>
                Avance : <b>{money(order.depositAmount, order.currency)}</b>
              </div>
              <div>
                Solde : <b>{money(order.balanceAmount, order.currency)}</b>
              </div>
              <div className="pt-2 text-xs text-white/60">
                FX : {Number(order.fxRate || 1).toLocaleString("fr-FR")}
              </div>
            </div>
          </div>

          {/* ✅ Upload fichiers */}
          <OrderFilesClient
            orderId={order.id}
            initialAttachments={attachments.map((a) => ({
              id: a.id,
              title: a.title ?? "",
              fileName: a.fileName ?? "",
              type: String(a.type ?? ""),
              url: a.url,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        </div>

        {/* DETAILS */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Article</div>
            <div className="mt-2 text-sm text-white/80">
              <div>Catégorie : <b>{order.category ?? "—"}</b></div>
              <div>Type : <b>{order.itemType ?? "—"}</b></div>
              <div>Tissu : <b>{order.fabricType ?? "—"}</b></div>
              <div>Couleur : <b>{order.fabricColor ?? "—"}</b></div>
              <div>Mètres : <b>{order.fabricMeters ?? "—"}</b></div>
            </div>

            <div className="mt-4 text-xs text-white/60">Description</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-white/80">
              {order.description ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Mesures (réception)</div>
            <pre className="mt-2 rounded-xl bg-black/30 p-3 text-[12px] text-white/80 ring-1 ring-white/10 overflow-auto whitespace-pre-wrap">
              {order.measurements?.trim() ? order.measurements : "—"}
            </pre>

            <div className="mt-4 text-xs text-white/60">Dates / workflow</div>
            <div className="mt-2 text-sm text-white/80 space-y-1">
              <div>Créée : <b>{new Date(order.createdAt).toLocaleString("fr-FR")}</b></div>
              <div>Envoyée à la coupe : <b>{order.sentToCuttingAt ? new Date(order.sentToCuttingAt).toLocaleString("fr-FR") : "—"}</b></div>
              <div>Reçue coupe : <b>{order.cuttingReceivedAt ? new Date(order.cuttingReceivedAt).toLocaleString("fr-FR") : "—"}</b></div>
              <div className="pt-2 text-xs text-white/60">
                Coupe={order.cut?.status ?? "—"} • Prod={order.production?.status ?? "—"} • Qual={order.quality?.status ?? "—"} • Liv={order.delivery?.status ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Paiements */}
        <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5">
          <div className="px-4 py-3 text-sm font-semibold">Historique paiements</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Moyen</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {order.payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-zinc-300/80">{new Date(p.paidAt).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3">{money(p.amount, p.currency)}</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3 text-zinc-300/80">{p.note ?? "—"}</td>
                </tr>
              ))}

              {order.payments.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-300/80" colSpan={4}>
                    Aucun paiement enregistré.
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
