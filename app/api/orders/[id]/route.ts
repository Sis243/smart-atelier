import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recalcOrderAmounts } from "@/lib/orders";

export async function GET(_: Request, ctx: { params: { id: string } }) {
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
    },
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const body = await req.json();

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: body.status ? body.status : undefined,

        currency: body.currency ? body.currency : undefined,
        fxRate: body.fxRate != null ? Number(body.fxRate) : undefined,
        totalAmount: body.totalAmount != null ? Number(body.totalAmount) : undefined,
        discount: body.discount != null ? Number(body.discount) : undefined,

        isLot: body.isLot != null ? Boolean(body.isLot) : undefined,
        lotLabel: body.lotLabel != null ? String(body.lotLabel) : undefined,
        lotQuantity: body.lotQuantity != null ? Number(body.lotQuantity) : undefined,

        itemType: body.itemType != null ? String(body.itemType) : undefined,
        category: body.category != null ? String(body.category) : undefined,
        fabricType: body.fabricType != null ? String(body.fabricType) : undefined,
        fabricColor: body.fabricColor != null ? String(body.fabricColor) : undefined,
        fabricMeters: body.fabricMeters != null ? Number(body.fabricMeters) : undefined,

        description: body.description != null ? String(body.description) : undefined,
        measurements: body.measurements != null ? String(body.measurements) : undefined,
        scanUrl: body.scanUrl != null ? String(body.scanUrl) : undefined,
      },
    });

    await recalcOrderAmounts(updated.id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
