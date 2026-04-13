import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {

  try {
    const [items, movesCount, purchasesCount, suppliersCount, recentMoves] =
      await Promise.all([
        prisma.stockItem.findMany({
          orderBy: { updatedAt: "desc" },
          take: 200,
        }),
        prisma.stockMove.count(),
        prisma.stockPurchase.count(),
        prisma.stockSupplier.count(),
        prisma.stockMove.findMany({
          orderBy: { movedAt: "desc" },
          take: 10,
          include: {
            item: true,
          },
        }),
      ]);

    const totalItems = items.length;
    const totalQuantity = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
    const totalValuation = items.reduce(
      (s, i) => s + Number(i.quantity || 0) * Number(i.unitCost || 0),
      0
    );

    const lowItems = items
      .filter((i) => Number(i.quantity || 0) <= Number(i.minQuantity || 0))
      .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))
      .slice(0, 20)
      .map((i) => ({
        id: i.id,
        name: i.name,
        quantity: Number(i.quantity || 0),
        minQuantity: Number(i.minQuantity || 0),
      }));

    return NextResponse.json({
      ok: true,
      data: {
        stats: {
          totalItems,
          totalQuantity,
          totalValuation,
          lowCount: lowItems.length,
          movesCount,
          purchasesCount,
          suppliersCount,
        },
        lowItems,
        recentMoves: recentMoves.map((move) => ({
          id: move.id,
          type: move.type,
          quantity: Number(move.quantity || 0),
          note: move.note ?? null,
          movedAt: move.movedAt,
          item: {
            name: move.item?.name ?? "—",
          },
        })),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur dashboard stock" },
      { status: 500 }
    );
  }
}