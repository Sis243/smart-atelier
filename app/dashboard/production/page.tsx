import Link from "next/link";
import { prisma } from "@/lib/db";

const LATE_DAYS = 5; // Production: seuil retard (change ici)

type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

function badgeStep(status: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`;
  if (status === "EN_COURS") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (status === "TERMINE") return `${base} bg-green-500/15 text-green-200 ring-green-400/20`;
  if (status === "REJETE") return `${base} bg-red-500/15 text-red-200 ring-red-400/20`;
  return `${base} bg-zinc-500/15 text-zinc-200 ring-white/10`;
}

function dotClass(status: string) {
  const base = "h-3.5 w-3.5 rounded-full ring-1 ring-white/15";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-400/80`;
  if (status === "EN_COURS") return `${base} bg-blue-400/80`;
  if (status === "TERMINE") return `${base} bg-green-400/80`;
  if (status === "REJETE") return `${base} bg-red-400/80`;
  return `${base} bg-zinc-400/40`;
}

function isLate(referenceAt: Date | null, stepStatus: string) {
  if (!referenceAt) return false;
  if (stepStatus === "TERMINE") return false;
  const ageMs = Date.now() - referenceAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays >= LATE_DAYS;
}

function lateLabel(referenceAt: Date) {
  const ageMs = Date.now() - referenceAt.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  return `${ageDays} j`;
}

export default async function ProductionInboxPage() {
  // ✅ Règle: Production voit les commandes dont la COUPE est TERMINE
  // (et production pas terminée, sinon ça surcharge)
  const orders = await prisma.order.findMany({
    where: {
      cut: { is: { status: "TERMINE" } },
      production: {
        is: {
          status: { not: "TERMINE" },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    include: { customer: true, cut: true, production: true },
    take: 80,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Production</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Inbox des commandes prêtes (Coupe terminée → Production).
            </p>
          </div>

          <Link
            href="/dashboard/orders"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 ring-1 ring-white/10"
          >
            ← Retour Commandes
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Détails</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Retard</th>
                <th className="px-4 py-3">Ouverture</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {orders.map((o) => {
                const step: StepStatus = (o.production?.status as any) ?? "EN_ATTENTE";

                // ✅ Base retard: date de création (simple, stable)
                const late = isLate(o.createdAt ? new Date(o.createdAt) : null, step);

                return (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/production/${o.id}`}
                        className="font-semibold text-amber-200 hover:underline"
                      >
                        {o.code}
                      </Link>

                      <div className="mt-1 text-[11px] text-zinc-300/70">
                        Créée : {new Date(o.createdAt).toLocaleString("fr-FR")}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customer.fullName}</div>
                      <div className="text-[12px] text-zinc-300/70">📞 {o.customer.phone ?? "—"}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={dotClass(step)} title={`🧵 Production : ${step}`} />
                        <span className="text-[12px] text-zinc-200/90">
                          {o.category ?? "—"} • {o.itemType ?? "—"}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-zinc-300/70 line-clamp-2">
                        {o.description ?? "—"}
                      </p>

                      <p className="mt-1 text-[11px] text-zinc-300/70">
                        ✂️ Coupe : <span className={badgeStep(o.cut?.status ?? "—")}>{o.cut?.status ?? "—"}</span>
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className={badgeStep(step)}>{step}</span>
                    </td>

                    <td className="px-4 py-3">
                      {late ? (
                        <span
                          className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] text-red-200 ring-1 ring-red-400/20"
                          title={`Commande en attente de production depuis ${lateLabel(new Date(o.createdAt))}. Seuil: ${LATE_DAYS} jours.`}
                        >
                          ⚠️ {lateLabel(new Date(o.createdAt))}
                        </span>
                      ) : (
                        <span className="text-zinc-300/60 text-[12px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/production/${o.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-amber-400/90 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
                      >
                        Ouvrir →
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-300/80" colSpan={6}>
                    Aucune commande en production.
                    <div className="mt-2 text-xs text-zinc-300/70">
                      Astuce: mets la <b>Coupe</b> sur <b>TERMINE</b> pour que la commande arrive ici.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-300/70">
          Production reçoit automatiquement les commandes dont la <b>Coupe</b> est <b>TERMINE</b>.
        </p>
      </div>
    </main>
  );
}
