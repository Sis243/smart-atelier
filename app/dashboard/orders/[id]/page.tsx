import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CutAssignClient from "./CutAssignClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LooseUser = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
};

type LooseStep = {
  id: string;
  status?: string | null;
  responsibleId?: string | null;
  responsible?: LooseUser | null;
  startedAt?: Date | string | null;
  finishedAt?: Date | string | null;
  completedAt?: Date | string | null;
  checkedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  note?: string | null;
};

type LoosePayment = {
  id: string;
  amount?: number | string | null;
  currency?: string | null;
  method?: string | null;
  note?: string | null;
  paidAt?: Date | string | null;
};

type LooseAttachment = {
  id: string;
  title?: string | null;
  fileName?: string | null;
  originalName?: string | null;
  type?: string | null;
  fileType?: string | null;
  url?: string | null;
  createdAt?: Date | string | null;
};

type LooseCustomer = {
  id: string;
  fullName?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

function money(value: unknown, currency = "USD") {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR");
}

function statusTone(status?: string | null) {
  const s = String(status ?? "").toUpperCase();
  if (s === "TERMINE") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (s === "EN_COURS") return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  if (s === "REJETE" || s === "ANNULE") return "border-red-500/20 bg-red-500/10 text-red-200";
  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-200";
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
      {children}
    </span>
  );
}

async function safeFindFirst<T = any>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

async function safeFindMany<T = any>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const prismaAny = prisma as any;

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    notFound();
  }

  const customer = order.customerId
    ? await safeFindFirst<LooseCustomer>(() =>
        prismaAny.customer.findUnique({
          where: { id: order.customerId },
        })
      )
    : null;

  const createdBy =
    (order as any).createdById
      ? await safeFindFirst<LooseUser>(() =>
          prismaAny.user.findUnique({
            where: { id: (order as any).createdById },
          })
        )
      : null;

  const cutStep = await safeFindFirst<LooseStep>(() =>
    prismaAny.cutStep.findFirst({
      where: { orderId: id },
      include: {
        responsible: true,
      },
    })
  );

  const productionStep = await safeFindFirst<LooseStep>(() =>
    prismaAny.productionStep.findFirst({
      where: { orderId: id },
      include: {
        responsible: true,
      },
    })
  );

  const qualityStep = await safeFindFirst<LooseStep>(() =>
    prismaAny.qualityStep.findFirst({
      where: { orderId: id },
      include: {
        responsible: true,
      },
    })
  );

  const deliveryStep = await safeFindFirst<LooseStep>(() =>
    prismaAny.deliveryStep.findFirst({
      where: { orderId: id },
      include: {
        responsible: true,
      },
    })
  );

  const payments = await safeFindMany<LoosePayment>(() =>
    prismaAny.payment.findMany({
      where: { orderId: id },
      orderBy: { paidAt: "desc" },
    })
  );

  const attachments = await safeFindMany<LooseAttachment>(() =>
    prismaAny.orderAttachment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    })
  );

  const cutUsers = await safeFindMany<LooseUser>(() =>
    prismaAny.user.findMany({
      where: {
        role: {
          in: ["COUPE", "MANAGER", "ADMIN", "SUPERADMIN"],
        },
        isActive: true,
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    })
  );

  const totalPaid = payments.reduce((sum: number, item: LoosePayment) => {
    return sum + Number(item.amount ?? 0);
  }, 0);

  const totalOrderAmount = Number((order as any).totalAmount ?? 0);
  const totalDepositAmount = Number((order as any).depositAmount ?? 0);
  const totalDiscount = Number((order as any).discount ?? 0);
  const remaining = Math.max(0, totalOrderAmount - totalPaid);

  return (
    <main className="min-h-screen bg-[#06111f] px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/dashboard/orders"
              className="text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              ← Retour aux commandes
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold">
              Commande {String((order as any).code ?? (order as any).orderNumber ?? order.id)}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Détails complets de la commande et suivi du workflow atelier.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge>{String(order.status)}</StatusBadge>
            <StatusBadge>{String(order.currency)}</StatusBadge>
            {(order as any).isLot ? (
              <StatusBadge>LOT • {Number((order as any).lotQuantity ?? 0)}</StatusBadge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="space-y-6 xl:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Informations générales</h2>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoItem
                  label="Client"
                  value={customer?.fullName || customer?.name || order.customerId || "-"}
                />
                <InfoItem label="Téléphone" value={customer?.phone || "-"} />
                <InfoItem label="Email" value={customer?.email || "-"} />
                <InfoItem label="Créée le" value={formatDateTime(order.createdAt)} />
                <InfoItem label="Dernière mise à jour" value={formatDateTime(order.updatedAt)} />
                <InfoItem
                  label="Créée par"
                  value={createdBy?.fullName || createdBy?.email || "-"}
                />
                <InfoItem label="Type article" value={String((order as any).itemType ?? "-")} />
                <InfoItem label="Catégorie" value={String((order as any).category ?? "-")} />
                <InfoItem label="Tissu" value={String((order as any).fabricType ?? "-")} />
                <InfoItem label="Couleur" value={String((order as any).fabricColor ?? "-")} />
                <InfoItem
                  label="Métrage"
                  value={
                    (order as any).fabricMeters != null
                      ? String((order as any).fabricMeters)
                      : "-"
                  }
                />
                <InfoItem label="Lot" value={(order as any).isLot ? "Oui" : "Non"} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-white">
                    {String((order as any).description ?? "-")}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Mesures
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-white">
                    {String((order as any).measurements ?? "-")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Workflow atelier</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <StepCard
                  title="Coupe"
                  status={cutStep?.status || "EN_ATTENTE"}
                  assignedTo={
                    cutStep?.responsible?.fullName ||
                    cutStep?.responsible?.email ||
                    "-"
                  }
                  startedAt={formatDateTime(cutStep?.startedAt)}
                  completedAt={formatDateTime(cutStep?.finishedAt || cutStep?.completedAt)}
                  note={cutStep?.note || null}
                />

                <StepCard
                  title="Production"
                  status={productionStep?.status || "EN_ATTENTE"}
                  assignedTo={
                    productionStep?.responsible?.fullName ||
                    productionStep?.responsible?.email ||
                    "-"
                  }
                  startedAt={formatDateTime(productionStep?.startedAt)}
                  completedAt={formatDateTime(
                    productionStep?.finishedAt || productionStep?.completedAt
                  )}
                  note={productionStep?.note || null}
                />

                <StepCard
                  title="Qualité"
                  status={qualityStep?.status || "EN_ATTENTE"}
                  assignedTo={
                    qualityStep?.responsible?.fullName ||
                    qualityStep?.responsible?.email ||
                    "-"
                  }
                  startedAt={formatDateTime(qualityStep?.startedAt || qualityStep?.checkedAt)}
                  completedAt={formatDateTime(
                    qualityStep?.finishedAt || qualityStep?.completedAt || qualityStep?.checkedAt
                  )}
                  note={qualityStep?.note || null}
                />

                <StepCard
                  title="Livraison"
                  status={deliveryStep?.status || "EN_ATTENTE"}
                  assignedTo={
                    deliveryStep?.responsible?.fullName ||
                    deliveryStep?.responsible?.email ||
                    "-"
                  }
                  startedAt={formatDateTime(deliveryStep?.startedAt)}
                  completedAt={formatDateTime(
                    deliveryStep?.deliveredAt ||
                      deliveryStep?.finishedAt ||
                      deliveryStep?.completedAt
                  )}
                  note={deliveryStep?.note || null}
                />
              </div>

              <div className="mt-5">
                <CutAssignClient
                  orderId={order.id}
                  currentAssignedToId={cutStep?.responsibleId ?? null}
                  users={cutUsers.map((u) => ({
                    id: u.id,
                    name: u.fullName || u.email || "Sans nom",
                    email: u.email || "",
                    role: u.role || "",
                  }))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Pièces jointes / modèles</h2>

              {attachments.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-400">
                  Aucune pièce jointe disponible.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-neutral-400">
                        <th className="px-3 py-3">Nom</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Ajouté le</th>
                        <th className="px-3 py-3">Ouverture</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attachments.map((file: LooseAttachment) => (
                        <tr key={file.id} className="border-b border-white/5">
                          <td className="px-3 py-3">
                            {file.title || file.originalName || file.fileName || "-"}
                          </td>
                          <td className="px-3 py-3">{file.type || file.fileType || "-"}</td>
                          <td className="px-3 py-3">{formatDateTime(file.createdAt)}</td>
                          <td className="px-3 py-3">
                            {file.url ? (
                              <a
                                href={file.url}
                                className="text-cyan-300 hover:text-cyan-200 hover:underline"
                              >
                                Ouvrir
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Résumé financier</h2>

              <div className="mt-4 space-y-3">
                <SummaryLine
                  label="Montant total"
                  value={money(totalOrderAmount, String(order.currency || "USD"))}
                />
                <SummaryLine
                  label="Acompte prévu"
                  value={money(totalDepositAmount, String(order.currency || "USD"))}
                />
                <SummaryLine
                  label="Remise"
                  value={money(totalDiscount, String(order.currency || "USD"))}
                />
                <SummaryLine
                  label="Déjà payé"
                  value={money(totalPaid, String(order.currency || "USD"))}
                />
                <SummaryLine
                  label="Reste à payer"
                  value={money(remaining, String(order.currency || "USD"))}
                  strong
                />
                <SummaryLine
                  label="Solde base"
                  value={money((order as any).balanceAmount ?? 0, String(order.currency || "USD"))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Paiements</h2>

              {payments.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-400">
                  Aucun paiement enregistré.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {payments.map((payment: LoosePayment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {money(payment.amount ?? 0, payment.currency || String(order.currency))}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {payment.method || "-"}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {formatDateTime(payment.paidAt)}
                        </span>
                      </div>

                      {payment.note ? (
                        <p className="mt-2 text-sm text-neutral-300">{payment.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StepCard({
  title,
  status,
  assignedTo,
  startedAt,
  completedAt,
  note,
}: {
  title: string;
  status: string;
  assignedTo: string;
  startedAt: string;
  completedAt: string;
  note?: string | null;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-white">{title}</h3>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(
            status
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-neutral-300">
        <p>
          <span className="text-neutral-500">Assigné à :</span> {assignedTo}
        </p>
        <p>
          <span className="text-neutral-500">Début :</span> {startedAt}
        </p>
        <p>
          <span className="text-neutral-500">Fin :</span> {completedAt}
        </p>
        {note ? (
          <p>
            <span className="text-neutral-500">Note :</span> {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className={strong ? "text-sm font-bold text-white" : "text-sm text-white"}>
        {value}
      </span>
    </div>
  );
}
