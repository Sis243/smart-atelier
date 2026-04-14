export const dynamic = "force-dynamic";

// app/api/payments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalcOrderAmounts } from "@/lib/orders";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = toStr(body.orderId);
    const amount = toNum(body.amount, 0);
    const currency = toStr(body.currency) === "CDF" ? "CDF" : "USD";
    const methodRaw = toStr(body.method).toUpperCase();
    const method =
      methodRaw === "MOBILE_MONEY" || methodRaw === "BANK" || methodRaw === "CASH"
        ? methodRaw
        : "CASH";
    const note = toStr(body.note) || null;
    const createdById = toStr(body.createdById) || null;

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "orderId requis" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Le montant doit être supérieur à 0" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        currency: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Commande introuvable" },
        { status: 404 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        currency: currency as any,
        method: method as any,
        note,
        createdById: createdById || undefined,
      },
      select: {
        id: true,
        orderId: true,
      },
    });

    await recalcOrderAmounts(orderId);

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      orderId: payment.orderId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}