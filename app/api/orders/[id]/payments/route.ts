import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Currency = "USD" | "CDF";
type PaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK";

function asCurrency(v: any): Currency {
  return v === "CDF" ? "CDF" : "USD";
}

function asMethod(v: any): PaymentMethod {
  if (v === "MOBILE_MONEY") return "MOBILE_MONEY";
  if (v === "BANK") return "BANK";
  return "CASH";
}

function safeFxRate(v: any): number {
  const n = Number(v);
  // fxRate = taux USD->CDF (ex: 2800)
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Convertit un montant payé (paymentCurrency) vers la devise de la commande (orderCurrency)
function convertToOrderCurrency(amount: number, paymentCurrency: Currency, orderCurrency: Currency, fxRate: number) {
  if (!Number.isFinite(amount)) return 0;
  if (paymentCurrency === orderCurrency) return amount;

  // fxRate = USD->CDF
  if (orderCurrency === "USD" && paymentCurrency === "CDF") {
    return amount / fxRate;
  }
  if (orderCurrency === "CDF" && paymentCurrency === "USD") {
    return amount * fxRate;
  }
  return amount;
}

async function recalcOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      totalAmount: true,
      currency: true,
      fxRate: true,
      status: true,
    },
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

  // Auto status
  let nextStatus = order.status;
  if (order.status !== "ANNULE") {
    if (balanceAmount <= 0) nextStatus = "TERMINE";
    else if (depositAmount > 0 && order.status === "EN_ATTENTE") nextStatus = "EN_COURS";
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      depositAmount,
      balanceAmount,
      status: nextStatus,
    },
  });

  return { depositAmount, balanceAmount, status: nextStatus };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const payments = await prisma.payment.findMany({
    where: { orderId: params.id },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json({ payments });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));

  const amount = Number(body.amount || 0);
  const currency = asCurrency(body.currency);
  const method = asMethod(body.method);
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount,
      currency,
      method,
      note: note || null,
      paidAt: new Date(),
    },
  });

  const calc = await recalcOrder(order.id);

  return NextResponse.json({ ok: true, calc });
}
