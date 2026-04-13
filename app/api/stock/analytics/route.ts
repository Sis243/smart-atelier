import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {

  try {
    const [items, movesOut] = await Promise.all([
      prisma.stockItem.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          quantity: true,
          minQuantity: true,
          unitCost: true,
        },
      }),
      prisma.stockMove.findMany({
        where: { type: "OUT" },
        select: {
          itemId: true,
          quantity: true,
        },
      }),
    ]);

    const totalItems = items.length;
    const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
    const totalValue = items.reduce(
      (s, i) => s + Number(i.quantity || 0) * Number(i.unitCost || 0),
      0
    );
    const lowItems = items
      .filter((i) => Number(i.quantity || 0) < Number(i.minQuantity || 0))
      .map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: Number(i.quantity || 0),
        minQuantity: Number(i.minQuantity || 0),
      }));

    const lowCount = lowItems.length;

    const outMap = new Map<string, number>();
    for (const m of movesOut) {
      outMap.set(m.itemId, (outMap.get(m.itemId) || 0) + Number(m.quantity || 0));
    }

    const topOut = [...outMap.entries()]
      .map(([itemId, outQty]) => {
        const found = items.find((x) => x.id === itemId);
        return {
          itemId,
          name: found?.name ?? "—",
          outQty,
        };
      })
      .sort((a, b) => b.outQty - a.outQty)
      .slice(0, 10);

    const categoryMap = new Map<
      string,
      { category: string; items: number; quantity: number; value: number }
    >();

    for (const item of items) {
      const category = String(item.category ?? "Sans catégorie").trim() || "Sans catégorie";
      const current = categoryMap.get(category) ?? {
        category,
        items: 0,
        quantity: 0,
        value: 0,
      };

      current.items += 1;
      current.quantity += Number(item.quantity || 0);
      current.value += Number(item.quantity || 0) * Number(item.unitCost || 0);

      categoryMap.set(category, current);
    }

    const byCategory = [...categoryMap.values()].sort((a, b) => b.value - a.value);

    return NextResponse.json({
      ok: true,
      kpi: {
        totalItems,
        totalQty,
        totalValue,
        lowCount,
      },
      topOut,
      byCategory,
      lowItems,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur analytics stock" },
      { status: 500 }
    );
  }
}