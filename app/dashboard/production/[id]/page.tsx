import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductionAssignClient from "./ProductionDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const prismaAny = prisma as any;

  const step = await prismaAny.productionStep.findUnique({
    where: { id: params.id },
    include: {
      responsible: true,
      order: {
        include: {
          customer: true,
          attachments: true,
          coupeMeasurements: true,
        },
      },
      assignments: {
        include: {
          employee: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!step) {
    notFound();
  }

  const order = step.order;
  const attachments = Array.isArray(order?.attachments) ? order.attachments : [];
  const assignments = Array.isArray(step.assignments) ? step.assignments : [];

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dossier production</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Commande {order?.code ?? "—"} • {order?.customer?.fullName ?? "—"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/production"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            >
              Retour
            </Link>
            <Link
              href={`/dashboard/orders/${order?.id}`}
              className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
            >
              Voir commande
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 lg:col-span-2">
            <h2 className="text-lg font-semibold">Informations utiles</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-zinc-300">
              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Commande</div>
                <div className="mt-1 font-medium">{order?.code ?? "—"}</div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Client</div>
                <div className="mt-1 font-medium">{order?.customer?.fullName ?? "—"}</div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Type article</div>
                <div className="mt-1 font-medium">{order?.itemType ?? "—"}</div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Catégorie</div>
                <div className="mt-1 font-medium">{order?.category ?? "—"}</div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Tissu</div>
                <div className="mt-1 font-medium">
                  {order?.fabricType ?? "—"} {order?.fabricColor ? `• ${order.fabricColor}` : ""}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Lot</div>
                <div className="mt-1 font-medium">
                  {order?.isLot ? `Oui (${order?.lotQuantity ?? 0})` : "Non"}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <div className="text-sm text-zinc-400">Description</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                {order?.description ?? "Aucune description"}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <div className="text-sm text-zinc-400">Mesures</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                {order?.measurements ??
                  step?.order?.coupeMeasurements?.[0]?.data
                    ? JSON.stringify(step.order.coupeMeasurements[0].data, null, 2)
                    : "Aucune mesure"}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Workflow production</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Statut</div>
                <div className="mt-1 font-medium text-zinc-100">{step.status ?? "—"}</div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Responsable</div>
                <div className="mt-1 font-medium text-zinc-100">
                  {step.responsible?.fullName ?? step.responsible?.email ?? "—"}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Début</div>
                <div className="mt-1 font-medium text-zinc-100">
                  {step.startedAt
                    ? new Date(step.startedAt).toLocaleString("fr-FR")
                    : "—"}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
                <div className="text-zinc-400">Fin</div>
                <div className="mt-1 font-medium text-zinc-100">
                  {step.finishedAt
                    ? new Date(step.finishedAt).toLocaleString("fr-FR")
                    : "—"}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 lg:col-span-2">
            <h2 className="text-lg font-semibold">Affectations couturiers</h2>

            <div className="mt-4">
              <ProductionAssignClient
                productionStepId={step.id}
                orderId={order?.id}
                isLot={!!order?.isLot}
                lotQuantity={Number(order?.lotQuantity ?? 1)}
                assignments={assignments.map((a: any) => ({
                  id: a.id,
                  employeeId: a.employeeId,
                  employeeName: a.employee?.fullName ?? "—",
                  quantityAssigned: Number(a.assignedQuantity ?? 0),
                  quantityDone: Number(a.completedQuantity ?? 0),
                  status: a.status ?? "EN_ATTENTE",
                }))}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Pièces jointes / modèle</h2>

            <div className="mt-4 space-y-2">
              {attachments.length > 0 ? (
                attachments.map((file: any) => (
                  <a
                    key={file.id}
                    href={file.url ?? file.filePath ?? "#"}
                    className="block rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10 hover:bg-white/10"
                  >
                    {file.title ?? file.fileName ?? "Pièce jointe"}
                  </a>
                ))
              ) : (
                <div className="text-sm text-zinc-400">Aucune pièce jointe.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
