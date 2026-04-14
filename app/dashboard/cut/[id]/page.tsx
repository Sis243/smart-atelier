import Link from "next/link";
import { prisma } from "@/lib/db";
import CutDetailClient from "./CutDetailClient";

export const dynamic = "force-dynamic";

function badgeStep(status: string) {
  const base = "px-2 py-1 text-[11px] rounded-full ring-1";
  if (status === "EN_ATTENTE") return `${base} bg-yellow-500/15 text-yellow-200 ring-yellow-400/20`;
  if (status === "EN_COURS") return `${base} bg-blue-500/15 text-blue-200 ring-blue-400/20`;
  if (status === "TERMINE") return `${base} bg-green-500/15 text-green-200 ring-green-400/20`;
  if (status === "REJETE") return `${base} bg-red-500/15 text-red-200 ring-red-400/20`;
  return `${base} bg-zinc-500/15 text-zinc-200 ring-white/10`;
}

type AttachmentVM = {
  id: string;
  title: string;
  fileName: string;
  type: string;
  url: string;
  createdAt: string;
};

export default async function CutDetailPage({ params }: { params: { id: string } }) {
  // 1) Order (sans include)
  const order = await prisma.order.findUnique({
    where: { id: params.id },
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
        <div className="mx-auto max-w-6xl text-zinc-200">Commande introuvable.</div>
      </main>
    );
  }

  // 2) Customer (via customerId)
  const customer = await prisma.customer.findUnique({
    where: { id: order.customerId },
  });

  // 3) CutStep (via orderId)
  const cut = await prisma.cutStep.findUnique({
    where: { orderId: order.id },
  });

  // 4) Attachments (modèle: orderAttachment)
  const attachmentsDb = await prisma.orderAttachment.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  // 5) Measurements coupe (modèle: orderMeasurements)
  //    (chez toi Prisma suggérait "orderMeasurements" comme modèle)
  const coupeMeasurements = await prisma.orderMeasurements.findUnique({
    where: { orderId: order.id },
  });

  const step = cut?.status ?? "EN_ATTENTE";

  const attachments: AttachmentVM[] = attachmentsDb.map((a: any) => ({
    id: a.id,
    title: a.title ?? "",
    fileName: a.fileName ?? "",
    type: String(a.type ?? ""),
    url: a.url,
    createdAt: new Date(a.createdAt).toISOString(),
  }));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Coupe — {order.code}</h1>
            <p className="mt-1 text-sm text-zinc-300/80">
              Voir détails + compléter (mesures / note / fichiers) + changer statut.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/cut"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 ring-1 ring-white/10"
            >
              ← Inbox Coupe
            </Link>
            <span className={badgeStep(step)}>{step}</span>
          </div>
        </div>

        {/* TOP CARDS */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Client */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Client</div>
            <div className="mt-1 text-lg font-semibold">{customer?.fullName ?? "—"}</div>
            <div className="mt-2 text-sm text-white/70">📞 {customer?.phone ?? "—"}</div>
            <div className="mt-1 text-sm text-white/70">📍 {customer?.address ?? "—"}</div>
          </div>

          {/* Article */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Article</div>
            <div className="mt-2 text-sm text-white/80">
              <div>Catégorie : <b>{order.category ?? "—"}</b></div>
              <div>Type : <b>{order.itemType ?? "—"}</b></div>
              <div>Tissu : <b>{order.fabricType ?? "—"}</b></div>
              <div>Couleur : <b>{order.fabricColor ?? "—"}</b></div>
              <div>Mètres : <b>{order.fabricMeters ?? "—"}</b></div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Actions Coupe</div>

            <CutDetailClient
              orderId={order.id}
              initialStatus={(cut?.status as any) ?? "EN_ATTENTE"}
              initialNote={cut?.note ?? ""}
              initialReceptionMeasurements={order.measurements ?? ""}
              initialCoupeMeasurements={coupeMeasurements?.dataJson ?? ""}
              attachments={attachments}
            />
          </div>
        </div>

        {/* Description + rappel */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Description</div>
            <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">
              {order.description ?? "—"}
            </div>

            <div className="mt-4 text-xs text-white/60">Mesures (réception)</div>
            <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">
              {order.measurements ?? "—"}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="text-xs text-white/60">Rappel</div>
            <div className="mt-2 text-sm text-white/80">
              La coupe ne voit pas les montants :
              <ul className="mt-2 list-disc pl-5 text-white/75">
                <li>Bon de commande</li>
                <li>Mesures</li>
                <li>Fichiers</li>
                <li>Statut coupe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
