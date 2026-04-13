import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalcOrderAmounts } from "@/lib/orders";

function cleanString(value: unknown) {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: { orderBy: { paidAt: "desc" } },
        cut: true,
        production: true,
        quality: true,
        delivery: true,
        attachments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Commande introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const body = await req.json();

    await prisma.order.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        currency: body.currency ?? undefined,
        fxRate: cleanNumber(body.fxRate),
        totalAmount: cleanNumber(body.totalAmount),
        discount: cleanNumber(body.discount),
        depositAmount: cleanNumber(body.depositAmount),
        isLot: body.isLot != null ? Boolean(body.isLot) : undefined,
        lotLabel: body.lotLabel != null ? cleanString(body.lotLabel) : undefined,
        lotQuantity: cleanNumber(body.lotQuantity),
        itemType: body.itemType != null ? cleanString(body.itemType) : undefined,
        category: body.category != null ? cleanString(body.category) : undefined,
        fabricType: body.fabricType != null ? cleanString(body.fabricType) : undefined,
        fabricColor: body.fabricColor != null ? cleanString(body.fabricColor) : undefined,
        fabricMeters: body.fabricMeters != null ? cleanNumber(body.fabricMeters) ?? null : undefined,
        description: body.description != null ? cleanString(body.description) : undefined,
        measurements: body.measurements != null ? cleanString(body.measurements) : undefined,
        scanUrl: body.scanUrl != null ? cleanString(body.scanUrl) : undefined,
      },
    });

    await recalcOrderAmounts(id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}