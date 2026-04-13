import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {

  const items = await prisma.stockItem.findMany({
    select: {
      id: true,
      name: true,
      quantity: true,
      minQuantity: true,
      unitCost: true,
    },
  });

  const movesOut = await prisma.stockMove.findMany({
    where: { type: "OUT" },
    select: { itemId: true, quantity: true },
  });

  const totalItems = items.length;
  const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const totalValue = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unitCost || 0), 0);
  const lowCount = items.filter((i) => Number(i.quantity || 0) < Number(i.minQuantity || 0)).length;

  const map = new Map<string, number>();
  for (const m of movesOut) map.set(m.itemId, (map.get(m.itemId) || 0) + Number(m.quantity || 0));

  const topOut = [...map.entries()]
    .map(([itemId, outQty]) => {
      const it = items.find((x) => x.id === itemId);
      return { itemId, name: it?.name ?? "—", outQty };
    })
    .sort((a, b) => b.outQty - a.outQty)
    .slice(0, 10);

  return NextResponse.json({
    kpi: { totalItems, totalQty, totalValue, lowCount },
    topOut,
  });
}
