import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LATE_DAYS = 7;

function isLate(createdAt: Date, status: string) {
  if (String(status).toUpperCase() === "TERMINE") return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays >= LATE_DAYS;
}

export async function GET() {
  try {
    const [
      orders,
      productionSteps,
      qualitySteps,
      deliverySteps,
      employeesCount,
      activeEmployeesCount,
      leavePending,
      presentToday,
      lateToday,
      invoicesAgg,
      paymentsAgg,
      expensesAgg,
      stockLow,
      recentActivities,
    ] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        include: {
          customer: true,
          cut: true,
          production: true,
          quality: true,
          delivery: true,
        },
      }),
      prisma.productionStep.findMany(),
      prisma.qualityStep.findMany(),
      prisma.deliveryStep.findMany(),
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.leaveRequest.count({ where: { status: "EN_ATTENTE" } }),
      prisma.attendance.count({ where: { status: "PRESENT" } }),
      prisma.attendance.count({ where: { status: "RETARD" } }),
      prisma.invoice.aggregate({
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.expense.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.stockItem.findMany({
        where: {
          quantity: {
            lte: prisma.stockItem.fields.minQuantity,
          },
        },
        take: 20,
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const totalOrders = orders.length;
    const inProgressOrders = orders.filter((o) =>
      ["EN_ATTENTE", "EN_COURS"].includes(String(o.status).toUpperCase())
    ).length;
    const doneOrders = orders.filter((o) => String(o.status).toUpperCase() === "TERMINE").length;
    const lateOrders = orders.filter((o) => isLate(o.createdAt, o.status)).length;

    const cutPending = orders.filter((o) => (o.cut?.status ?? "EN_ATTENTE") === "EN_ATTENTE").length;
    const productionPending = productionSteps.filter((s) => s.status === "EN_ATTENTE" || s.status === "EN_COURS").length;
    const qualityPending = qualitySteps.filter((s) => s.status === "EN_ATTENTE" || s.status === "EN_COURS").length;
    const deliveryPending = deliverySteps.filter((s) => s.status === "EN_ATTENTE" || s.status === "EN_COURS").length;

    const revenueIssued = Number(invoicesAgg._sum.totalAmount ?? 0);
    const revenuePaid = Number(invoicesAgg._sum.paidAmount ?? 0);
    const receivables = Number(invoicesAgg._sum.balanceAmount ?? 0);
    const cashIn = Number(paymentsAgg._sum.amount ?? 0);
    const cashOut = Number(expensesAgg._sum.amount ?? 0);
    const netCash = cashIn - cashOut;

    const topAlerts: string[] = [];

    if (lateOrders > 0) topAlerts.push(`${lateOrders} commande(s) en retard`);
    if (qualityPending > 0) topAlerts.push(`${qualityPending} dossier(s) en attente qualité`);
    if (deliveryPending > 0) topAlerts.push(`${deliveryPending} dossier(s) en attente livraison`);
    if (leavePending > 0) topAlerts.push(`${leavePending} demande(s) de congé en attente`);
    if (stockLow.length > 0) topAlerts.push(`${stockLow.length} article(s) en stock faible`);

    return NextResponse.json({
      ok: true,
      data: {
        meta: {
          lateThresholdDays: LATE_DAYS,
        },
        orders: {
          total: totalOrders,
          inProgress: inProgressOrders,
          done: doneOrders,
          late: lateOrders,
        },
        workflow: {
          cut: cutPending,
          production: productionPending,
          quality: qualityPending,
          delivery: deliveryPending,
        },
        hr: {
          employeesCount,
          activeEmployeesCount,
          presentToday,
          lateToday,
          leavePending,
        },
        finance: {
          revenueIssued,
          revenuePaid,
          receivables,
          cashIn,
          cashOut,
          netCash,
        },
        stock: {
          lowCount: stockLow.length,
          lowItems: stockLow.map((i) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            minQuantity: i.minQuantity,
          })),
        },
        recentOrders: orders.slice(0, 8).map((o) => ({
          id: o.id,
          code: o.code,
          customer: o.customer.fullName,
          status: o.status,
          createdAt: o.createdAt,
        })),
        alerts: topAlerts,
        recentActivities: recentActivities.map((a) => ({
          id: a.id,
          action: a.action,
          entity: a.entity,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur dashboard exécutif" },
      { status: 500 }
    );
  }
}