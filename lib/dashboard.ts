import { prisma } from "@/lib/db";

type Currency = "USD" | "CDF";

function getKinshasaDayRange(date = new Date()) {
  // Africa/Kinshasa = UTC+1 (pas de DST)
  // On convertit "now" en heure Kin, on calcule le début de journée, puis on revient en UTC.
  const now = date;
  const kinNow = new Date(now.getTime() + 60 * 60 * 1000);

  const y = kinNow.getUTCFullYear();
  const m = kinNow.getUTCMonth();
  const d = kinNow.getUTCDate();

  const kinStart = new Date(Date.UTC(y, m, d, 0, 0, 0));
  const kinEnd = new Date(Date.UTC(y, m, d + 1, 0, 0, 0));

  // revenir vers UTC (en retirant +1h)
  return {
    start: new Date(kinStart.getTime() - 60 * 60 * 1000),
    end: new Date(kinEnd.getTime() - 60 * 60 * 1000),
  };
}

export async function getDashboardStats() {
  const { start, end } = getKinshasaDayRange();

  // KPIs commandes
  const [ordersInProgress, ordersDone, totalOrders] = await Promise.all([
    prisma.order.count({ where: { status: "EN_COURS" } }),
    prisma.order.count({ where: { status: "TERMINE" } }),
    prisma.order.count(),
  ]);

  // "En retard" = EN_COURS depuis > 7 jours (modifiable)
  const lateThresholdDays = 7;
  const lateBefore = new Date(Date.now() - lateThresholdDays * 24 * 60 * 60 * 1000);

  const ordersLate = await prisma.order.count({
    where: {
      status: "EN_COURS",
      createdAt: { lt: lateBefore },
    },
  });

  // Paiements du jour (USD + CDF séparés)
  const [payUsd, payCdf] = await Promise.all([
    prisma.payment.aggregate({
      where: { paidAt: { gte: start, lt: end }, currency: "USD" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: start, lt: end }, currency: "CDF" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const revenueToday = {
    USD: Number(payUsd._sum.amount ?? 0),
    CDF: Number(payCdf._sum.amount ?? 0),
    countPayments: (payUsd._count ?? 0) + (payCdf._count ?? 0),
  };

  // Workflow (comptage des étapes non terminées)
  const [
    cutCount,
    prodCount,
    qualityCount,
    deliveryCount,
  ] = await Promise.all([
    prisma.cutStep.count({ where: { status: { in: ["EN_ATTENTE", "EN_COURS"] } } }),
    prisma.productionStep.count({ where: { status: { in: ["EN_ATTENTE", "EN_COURS"] } } }),
    prisma.qualityStep.count({ where: { status: { in: ["EN_ATTENTE", "EN_COURS"] } } }),
    prisma.deliveryStep.count({ where: { status: { in: ["EN_ATTENTE", "EN_COURS"] } } }),
  ]);

  // Pour afficher une activité récente (optionnel)
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { customer: true },
  });

  return {
    orders: {
      inProgress: ordersInProgress,
      done: ordersDone,
      late: ordersLate,
      total: totalOrders,
    },
    revenueToday,
    workflow: {
      cut: cutCount,
      production: prodCount,
      quality: qualityCount,
      delivery: deliveryCount,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      customer: o.customer.fullName,
      createdAt: o.createdAt,
    })),
    meta: {
      kinshasaDayStartUTC: start,
      kinshasaDayEndUTC: end,
      lateThresholdDays,
    },
  };
}
