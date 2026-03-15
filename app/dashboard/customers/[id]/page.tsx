import Link from "next/link";
import { prisma } from "@/lib/db";

function typeBadge(t: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (t === "VIP") return `${base} bg-amber-500/15 text-amber-200 ring-amber-400/20`;
  return `${base} bg-white/10 text-zinc-100 ring-white/10`;
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
  });

  if (!customer) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
        <p>Client introuvable.</p>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { payments: true },
    take: 100,
  });

  const totalOrders = orders.length;

  const totalUsd = orders
    .filter((o) => o.currency === "USD")
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  const totalCdf = orders
    .filter((o) => o.currency === "CDF")
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  const paidUsd = orders
    .flatMap((o) => o.payments)
    .filter((p) => p.currency === "USD")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const paidCdf = orders
    .flatMap((o) => o.payments)
    .filter((p) => p.currency === "CDF")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              <span className={typeBadge(customer.type)}>{customer.type}</span>
            </p>

            <p className="mt-3 text-sm text-zinc-300/80">
              📞 {customer.phone ?? "—"} &nbsp; • &nbsp; ✉️ {customer.email ?? "—"} <br />
              📍 {customer.address ?? "—"}
            </p>

            {customer.note && (
              <p className="mt-3 text-sm text-zinc-300/80 whitespace-pre-wrap">
                📝 {customer.note}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
  <Link
    href="/dashboard/customers"
    className="rounded-xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/10"
  >
    ← Retour
  </Link>

  <Link
    href={`/dashboard/customers/${customer.id}/edit`}
    className="rounded-xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/10"
  >
    ✏️ Modifier
  </Link>

 <Link
  href={`/dashboard/orders/nouvelle?customerId=${customer.id}`}
  className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
>
  + Nouvelle commande
</Link>
</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-xs text-zinc-300/70">Commandes</p>
            <p className="mt-1 text-xl font-semibold">{totalOrders}</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-xs text-zinc-300/70">Total (USD)</p>
            <p className="mt-1 text-xl font-semibold">${totalUsd.toLocaleString("fr-FR")}</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-xs text-zinc-300/70">Payé (USD)</p>
            <p className="mt-1 text-xl font-semibold">${paidUsd.toLocaleString("fr-FR")}</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-xs text-zinc-300/70">Total (CDF)</p>
            <p className="mt-1 text-xl font-semibold">{totalCdf.toLocaleString("fr-FR")} CDF</p>
            <p className="mt-1 text-xs text-zinc-300/70">
              Payé: {paidCdf.toLocaleString("fr-FR")} CDF
            </p>
          </div>
        </div>

        {/* Historique */}
        <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5">
            <h2 className="text-sm font-semibold">Historique des commandes</h2>
            <p className="text-xs text-zinc-300/70">{orders.length} lignes</p>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Avance</th>
                <th className="px-4 py-3">Solde</th>
                <th className="px-4 py-3">Créée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-semibold text-amber-200 hover:underline"
                    >
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">
                    {o.currency} {o.totalAmount.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    {o.currency} {o.depositAmount.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    {o.currency} {o.balanceAmount.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-zinc-300/80">
                    {new Date(o.createdAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-300/80" colSpan={6}>
                    Aucune commande pour ce client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-zinc-300/70">
          Amélioration prochaine : “Nouvelle commande” pré-sélectionne automatiquement ce client.
        </p>
      </div>
    </main>
  );
}
