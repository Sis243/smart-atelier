import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Currency = "USD" | "CDF";

function safeFxRate(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function convertToOrderCurrency(amount: number, paymentCurrency: Currency, orderCurrency: Currency, fxRate: number) {
  if (!Number.isFinite(amount)) return 0;
  if (paymentCurrency === orderCurrency) return amount;

  // fxRate = USD->CDF
  if (orderCurrency === "USD" && paymentCurrency === "CDF") return amount / fxRate;
  if (orderCurrency === "CDF" && paymentCurrency === "USD") return amount * fxRate;

  return amount;
}

async function recalcOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalAmount: true, currency: true, fxRate: true, status: true },
  });
  if (!order) return null;

  const fxRate = safeFxRate(order.fxRate);

  const payments = await prisma.payment.findMany({
    where: { orderId: order.id },
    select: { amount: true, currency: true },
  });

  const depositAmount = payments.reduce((sum, p) => {
    const amt = convertToOrderCurrency(
      Number(p.amount || 0),
      p.currency as any,
      order.currency as any,
      fxRate
    );
    return sum + amt;
  }, 0);

  const total = Number(order.totalAmount || 0);
  const balanceAmount = Math.max(0, total - depositAmount);

  let nextStatus = order.status;
  if (order.status !== "ANNULE") {
    if (balanceAmount <= 0) nextStatus = "TERMINE";
    else if (depositAmount > 0 && order.status === "EN_ATTENTE") nextStatus = "EN_COURS";
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { depositAmount, balanceAmount, status: nextStatus },
  });

  return { depositAmount, balanceAmount, status: nextStatus };
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; paymentId: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    select: { id: true, orderId: true },
  });

  if (!payment || payment.orderId !== order.id) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  await prisma.payment.delete({ where: { id: payment.id } });

  const calc = await recalcOrder(order.id);

  return NextResponse.json({ ok: true, calc });
}
