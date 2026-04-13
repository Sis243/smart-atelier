import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET() {

  try {
    const purchases = await prisma.stockPurchase.findMany({
      orderBy: { purchasedAt: "desc" },
      include: {
        item: true,
        supplier: true,
      },
      take: 200,
    });

    return NextResponse.json({ ok: true, purchases });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur achats stock" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {
    const body = await req.json();

    const itemId = toStr(body.itemId);
    const supplierId = toStr(body.supplierId) || null;
    const quantity = toNum(body.quantity, 0);
    const unitCost = toNum(body.unitCost, 0);
    const currency = toStr(body.currency).toUpperCase() === "CDF" ? "CDF" : "USD";
    const reference = toStr(body.reference) || null;

    if (!itemId || quantity <= 0 || unitCost < 0) {
      return NextResponse.json(
        { ok: false, error: "Données achat invalides" },
        { status: 400 }
      );
    }

    const item = await prisma.stockItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Article introuvable" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.stockPurchase.create({
        data: {
          itemId,
          supplierId,
          quantity,
          unitCost,
          currency: currency as any,
          reference,
        },
      });

      await tx.stockMove.create({
        data: {
          itemId,
          type: "IN",
          quantity,
          note: `Achat stock${reference ? ` • ${reference}` : ""}`,
          movedAt: new Date(),
        },
      });

      const updatedItem = await tx.stockItem.update({
        where: { id: itemId },
        data: {
          quantity: Number(item.quantity || 0) + quantity,
          unitCost,
        },
      });

      return { purchase, updatedItem };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Création achat impossible" },
      { status: 500 }
    );
  }
}