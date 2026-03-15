import Image from "next/image";
import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard";
import TopBar from "@/components/TopBar";

function formatMoney(amount: number, currency: "USD" | "CDF") {
  if (currency === "USD") return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `CDF ${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const kpis = [
    {
      label: "Commandes en cours",
      helper: "Commandes actuellement en production",
      value: stats.orders.inProgress,
      badge: "En cours",
    },
    {
      label: "Commandes terminées",
      helper: "Commandes finalisées et livrées",
      value: stats.orders.done,
      badge: "Terminé",
    },
    {
      label: "Chiffre d’affaires du jour",
      helper: `Encaissements aujourd’hui • ${stats.revenueToday.countPayments} paiement(s)`,
      value:
        stats.revenueToday.USD > 0
          ? formatMoney(stats.revenueToday.USD, "USD")
          : formatMoney(stats.revenueToday.CDF, "CDF"),
      badge: "Aujourd’hui",
    },
    {
      label: "Commandes en retard",
      helper: `EN_COURS depuis > ${stats.meta.lateThresholdDays} jours`,
      value: stats.orders.late,
      badge: "Urgent",
      danger: stats.orders.late > 0,
    },
  ] as const;

  const workflow = [
    { title: "Coupe", desc: "Découpe & préparation", value: `${stats.workflow.cut} commande(s)`, icon: "✂️" },
    { title: "Production", desc: "Couture & assemblage", value: `${stats.workflow.production} commande(s)`, icon: "🧵" },
    { title: "Qualité", desc: "Contrôle & validation", value: `${stats.workflow.quality} commande(s)`, icon: "✅" },
    { title: "Livraison", desc: "Sortie atelier & remise", value: `${stats.workflow.delivery} commande(s)`, icon: "🚚" },
  ] as const;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* ✅ TOPBAR PREMIUM */}
      <TopBar
        title="Tableau de bord opérationnel"
        subtitle="Statistiques réelles depuis la base de données (Prisma) • Pilotage temps réel"
        user={{ name: "SUPERADMIN", role: "SUPERADMIN" }}
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/atelier.jpg"
            alt="Atelier Mwinda"
            fill
            className="object-cover opacity-25"
            priority={false}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-zinc-950" />
          <div className="absolute -top-24 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{k.label}</p>
                    <p className="mt-1 text-xs text-zinc-300/80">{k.helper}</p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] ring-1",
                      (k as any).danger
                        ? "bg-red-500/15 text-red-200 ring-red-400/20"
                        : "bg-white/10 text-zinc-200 ring-white/10",
                    ].join(" ")}
                  >
                    {k.badge}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <p className={["text-3xl font-semibold", (k as any).danger ? "text-red-200" : ""].join(" ")}>
                    {k.value}
                  </p>
                  <div className="text-xs text-zinc-300/70">
                    Base: <span className="text-zinc-200">{stats.orders.total}</span> commandes
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 lg:col-span-2">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">État du workflow de production</h2>
                  <p className="mt-1 text-sm text-zinc-300/80">
                    Répartition des étapes EN_ATTENTE / EN_COURS (données réelles).
                  </p>
                </div>
                <Link
                  href="/dashboard/orders"
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
                >
                  Détails →
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {workflow.map((w) => (
                  <div key={w.title} className="rounded-2xl bg-zinc-950/40 p-5 ring-1 ring-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          <span className="mr-2">{w.icon}</span>
                          {w.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-300/80">{w.desc}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10">
                        {w.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold">Activité récente</h3>
              <p className="mt-1 text-sm text-zinc-300/80">Dernières commandes enregistrées.</p>

              <div className="mt-5 space-y-3">
                {stats.recentOrders.length === 0 ? (
                  <div className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                    <p className="text-sm font-medium">Aucune commande</p>
                    <p className="mt-1 text-xs text-zinc-300/80">
                      Crée une commande pour voir l’activité ici.
                    </p>
                  </div>
                ) : (
                  stats.recentOrders.map((o) => (
                    <div key={o.id} className="rounded-2xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{o.code}</p>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] ring-1 ring-white/10">
                          {o.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-300/80">{o.customer}</p>
                      <p className="mt-1 text-[11px] text-zinc-300/60">
                        {new Date(o.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
