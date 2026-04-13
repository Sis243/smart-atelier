import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaymentEntries } from "@/lib/accounting-auto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentId = String(body.paymentId ?? "").trim();

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "paymentId requis" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "Paiement introuvable" },
        { status: 404 }
      );
    }

    const exists = await prisma.ledgerEntry.findFirst({
      where: { paymentId },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json({ ok: true, message: "Ã‰critures dÃ©jÃ  gÃ©nÃ©rÃ©es" });
    }

    await createPaymentEntries({
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency as any,
      fxRate: 1,
      label: `Paiement ${payment.id}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur automatique paiement" },
      { status: 500 }
    );
  }
}