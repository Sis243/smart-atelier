import { prisma } from "@/lib/prisma";

function money(amount: number, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString("fr-FR")}`;
}

export default async function OrderPrintPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      payments: { orderBy: { paidAt: "desc" } },
      cut: true,
      production: true,
      quality: true,
      delivery: true,
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    return <main className="p-8">Commande introuvable.</main>;
  }

  return (
    <main className="min-h-screen bg-white p-8 text-black">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fiche Commande</h1>
            <p className="mt-2 text-sm text-zinc-600">Smart Atelier • Mwinda Industrie</p>
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
            <div className="text-sm text-zinc-500">Code</div>
            <div className="mt-1 font-semibold">{order.code}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Statut</div>
            <div className="mt-1 font-semibold">{order.status}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Client</div>
            <div className="mt-1 font-semibold">{order.customer.fullName}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-zinc-500">Créée le</div>
            <div className="mt-1 font-semibold">{new Date(order.createdAt).toLocaleString("fr-FR")}</div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Article</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>Type : <b>{order.itemType ?? "—"}</b></div>
            <div>Catégorie : <b>{order.category ?? "—"}</b></div>
            <div>Tissu : <b>{order.fabricType ?? "—"}</b></div>
            <div>Couleur : <b>{order.fabricColor ?? "—"}</b></div>
            <div>Métrage : <b>{order.fabricMeters ?? "—"}</b></div>
            <div>Lot : <b>{order.isLot ? `Oui (${order.lotQuantity})` : "Non"}</b></div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Description</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm">{order.description ?? "—"}</div>
        </div>

        <div className="mt-6 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Mesures</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm">{order.measurements ?? "—"}</div>
        </div>

        <div className="mt-6 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Paiement</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>Total : <b>{money(order.totalAmount, order.currency)}</b></div>
            <div>Remise : <b>{money(order.discount, order.currency)}</b></div>
            <div>Avance : <b>{money(order.depositAmount, order.currency)}</b></div>
            <div>Solde : <b>{money(order.balanceAmount, order.currency)}</b></div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border p-4">
          <h2 className="text-lg font-semibold">Workflow</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>Coupe : <b>{order.cut?.status ?? "—"}</b></div>
            <div>Production : <b>{order.production?.status ?? "—"}</b></div>
            <div>Qualité : <b>{order.quality?.status ?? "—"}</b></div>
            <div>Livraison : <b>{order.delivery?.status ?? "—"}</b></div>
          </div>
        </div>

        <div className="mt-10 text-xs text-zinc-500">
          Document généré depuis Smart Atelier.
        </div>
      </div>
    </main>
  );
}