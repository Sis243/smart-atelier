import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {

  try {
    const items = await prisma.stockItem.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        quantity: true,
        minQuantity: true,
        unitCost: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const low = items.filter(
      (i) => Number(i.quantity || 0) < Number(i.minQuantity || 0)
    );

    return NextResponse.json({ ok: true, items: low });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur stock faible" },
      { status: 500 }
    );
  }
}