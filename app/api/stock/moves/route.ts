import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MoveType = "IN" | "OUT" | "ADJUST";

function asMoveType(v: any): MoveType {
  if (v === "OUT") return "OUT";
  if (v === "ADJUST") return "ADJUST";
  return "IN";
}

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function notifyLowStock(itemId: string) {
  const item = await prisma.stockItem.findUnique({
    where: { id: itemId },
    select: { id: true, name: true, quantity: true, minQuantity: true },
  });

  if (!item) return;
  if (Number(item.quantity) >= Number(item.minQuantity)) return;

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["SUPERADMIN", "ADMIN", "MANAGER"] },
      isActive: true,
    },
    select: { id: true },
  });

  if (!users.length) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "STOCK_LOW",
      title: "Stock bas",
      body: `Article "${item.name}" sous le seuil. Stock: ${item.quantity} (min: ${item.minQuantity})`,
      entity: "StockItem",
      entityId: item.id,
      url: `/dashboard/stock?focus=${item.id}`,
    })),
  });
}

export async function GET() {

  try {
    const moves = await prisma.stockMove.findMany({
      orderBy: { movedAt: "desc" },
      take: 200,
      include: {
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, moves });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur liste mouvements" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {
    const body = await req.json().catch(() => ({}));

    const itemId = String(body.itemId ?? "").trim();
    const type = asMoveType(body.type);
    const quantity = safeNumber(body.quantity, 0);
    const note = body.note ? String(body.note).trim() : null;

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: "Article requis" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { ok: false, error: "Quantité mouvement invalide" },
        { status: 400 }
      );
    }

    const item = await prisma.stockItem.findUnique({
      where: { id: itemId },
      select: { id: true, quantity: true },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Article introuvable" },
        { status: 404 }
      );
    }

    let newQty = Number(item.quantity || 0);

    if (type === "IN") newQty += quantity;
    if (type === "OUT") newQty -= quantity;
    if (type === "ADJUST") newQty = quantity;

    if (newQty < 0) {
      return NextResponse.json(
        { ok: false, error: "Stock insuffisant (négatif interdit)" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const move = await tx.stockMove.create({
        data: {
          itemId: item.id,
          type,
          quantity,
          note,
          movedAt: new Date(),
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const updated = await tx.stockItem.update({
        where: { id: item.id },
        data: { quantity: newQty },
      });

      return { move, updated };
    });

    await notifyLowStock(item.id);

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Mouvement impossible" },
      { status: 500 }
    );
  }
}