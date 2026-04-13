// lib/dashboard.ts
import { prisma } from "@/lib/prisma";

const LATE_THRESHOLD_DAYS = 7;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export async function getDashboardStats() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const lateLimit = subDays(new Date(), LATE_THRESHOLD_DAYS);

  const [
    totalOrders,
    inProgressOrders,
    doneOrders,
    lateOrders,
    cutWaiting,
    prodWaiting,
    qualWaiting,
    delWaiting,
    todayPayments,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        status: {
          in: ["EN_ATTENTE", "EN_COURS"],
        },
      },
    }),
    prisma.order.count({
      where: {
        status: "TERMINE",
      },
    }),
    prisma.order.count({
      where: {
        status: {
          not: "TERMINE",
        },
        createdAt: {
          lte: lateLimit,
        },
      },
    }),
    prisma.cutStep.count({
      where: {
        status: {
          in: ["EN_ATTENTE", "EN_COURS"],
        },
      },
    }),
    prisma.productionStep.count({
      where: {
        status: {
          in: ["EN_ATTENTE", "EN_COURS"],
        },
      },
    }),
    prisma.qualityStep.count({
      where: {
        status: {
          in: ["EN_ATTENTE", "EN_COURS"],
        },
      },
    }),
    prisma.deliveryStep.count({
      where: {
        status: {
          in: ["EN_ATTENTE", "EN_COURS"],
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        paidAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        amount: true,
        currency: true,
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        customer: {
          select: {
            fullName: true,
          },
        },
      },
    }),
  ]);

  const revenueToday = todayPayments.reduce(
    (acc, p) => {
      const amount = Number(p.amount || 0);
      if (p.currency === "CDF") acc.CDF += amount;
      else acc.USD += amount;
      acc.countPayments += 1;
      return acc;
    },
    { USD: 0, CDF: 0, countPayments: 0 }
  );

  return {
    orders: {
      total: totalOrders,
      inProgress: inProgressOrders,
      done: doneOrders,
      late: lateOrders,
    },
    workflow: {
      cut: cutWaiting,
      production: prodWaiting,
      quality: qualWaiting,
      delivery: delWaiting,
    },
    revenueToday,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      customer: o.customer.fullName,
    })),
    meta: {
      lateThresholdDays: LATE_THRESHOLD_DAYS,
    },
  };
}