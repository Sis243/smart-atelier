import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QualityControlClient from "./QualityControlClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

export default async function QualityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const prismaAny = prisma as any;

  const step = await prismaAny.qualityStep.findUnique({
    where: { id: params.id },
    include: {
      responsible: true,
      order: {
        include: {
          customer: true,
          attachments: true,
          production: true,
          coupeMeasurements: true,
        },
      },
    },
  });

  if (!step) {
    notFound();
  }

  const order = step.order;
  const attachments = Array.isArray(order?.attachments) ? order.attachments : [];

  const measurementsText =
    order?.measurements && String(order.measurements).trim().length > 0
      ? String(order.measurements)
      : Array.isArray(order?.coupeMeasurements) && order.coupeMeasurements.length > 0
      ? JSON.stringify(order.coupeMeasurements[0]?.data ?? {}, null, 2)
      : "Aucune mesure";

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Contrôle qualité</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Commande {order?.code ?? "—"} • {order?.customer?.fullName ?? "—"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/quality"
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
            <h2 className="text-lg font-semibold">Informations de contrôle</h2>

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
            </div>

            <div className="mt-4 rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <div className="text-sm text-zinc-400">Description</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                {order?.description ?? "Aucune description"}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-zinc-950/40 p-4 ring-1 ring-white/10">
              <div className="text-sm text-zinc-400">Mesures</div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                {measurementsText}
              </pre>
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="text-lg font-semibold">Statut qualité</h2>

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
                <div className="text-zinc-400">Date contrôle</div>
                <div className="mt-1 font-medium text-zinc-100">
                  {formatDateTime(step.checkedAt)}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 lg:col-span-2">
            <h2 className="text-lg font-semibold">Contrôle final</h2>

            <div className="mt-4">
              <QualityControlClient
                qualityStepId={step.id}
                orderId={order?.id}
                currentStatus={step.status ?? "EN_ATTENTE"}
                currentNote={step.note ?? ""}
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
