import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const LATE_DAYS = 3; // coupe: exemple 3 jours

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

function isLate(sentToCuttingAt: Date | null, stepStatus: string) {
  if (!sentToCuttingAt) return false;
  if (stepStatus === "TERMINE") return false;
  const ageMs = Date.now() - sentToCuttingAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays >= LATE_DAYS;
}

function lateLabel(sentToCuttingAt: Date) {
  const ageMs = Date.now() - sentToCuttingAt.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  return `${ageDays} j`;
}

export default async function CutInboxPage() {
  const orders = await prisma.order.findMany({
    where: { sentToCuttingAt: { not: null } },
    orderBy: [{ sentToCuttingAt: "desc" }, { createdAt: "desc" }],
    include: { customer: true, cut: true },
    take: 80,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Coupe</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Inbox des commandes envoyées à la coupe (sans montants).
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
                <th className="px-4 py-3">Statut Coupe</th>
                <th className="px-4 py-3">Retard</th>
                <th className="px-4 py-3">Ouverture</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {orders.map((o) => {
                const step: StepStatus = (o.cut?.status as any) ?? "EN_ATTENTE";
                const late = isLate(o.sentToCuttingAt, step);

                return (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/cut/${o.id}`}
                        className="font-semibold text-amber-200 hover:underline"
                      >
                        {o.code}
                      </Link>
                      <div className="mt-1 text-[11px] text-zinc-300/70">
                        Envoyée :{" "}
                        {o.sentToCuttingAt ? new Date(o.sentToCuttingAt).toLocaleString("fr-FR") : "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customer.fullName}</div>
                      <div className="text-[12px] text-zinc-300/70">📞 {o.customer.phone ?? "—"}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={dotClass(step)} title={`✂️ Coupe : ${step}`} />
                        <span className="text-[12px] text-zinc-200/90">
                          {o.category ?? "—"} • {o.itemType ?? "—"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-300/70 line-clamp-2">
                        {o.description ?? "—"}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className={badgeStep(step)}>{step}</span>
                    </td>

                    <td className="px-4 py-3">
                      {o.sentToCuttingAt && late ? (
                        <span
                          className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] text-red-200 ring-1 ring-red-400/20"
                          title={`Commande envoyée à la coupe il y a ${lateLabel(new Date(o.sentToCuttingAt))}. Seuil: ${LATE_DAYS} jours.`}
                        >
                          ⚠️ {lateLabel(new Date(o.sentToCuttingAt))}
                        </span>
                      ) : (
                        <span className="text-zinc-300/60 text-[12px]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/cut/${o.id}`}
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
                    Aucune commande envoyée à la coupe.
                    <div className="mt-2 text-xs text-zinc-300/70">
                      Astuce: depuis <b>Commandes</b>, clique “Envoyer à la coupe”, ou active l’envoi automatique à la création.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-300/70">
          La coupe ne voit pas les montants. Retard = commande non terminée après {LATE_DAYS} jours depuis l’envoi à la coupe.
        </p>
      </div>
    </main>
  );
}
