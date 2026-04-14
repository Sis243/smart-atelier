import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET() {

  try {
    const items = await prisma.stockItem.findMany({
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur liste stock" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {
    const body = await req.json();

    const name = toStr(body.name);
    const category = toStr(body.category) || null;
    const unit = toStr(body.unit) || null;
    const quantity = Math.max(0, toNum(body.quantity, 0));
    const minQuantity = Math.max(0, toNum(body.minQuantity, 0));
    const unitCost = Math.max(0, toNum(body.unitCost, 0));

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Nom article requis" },
        { status: 400 }
      );
    }

    const existing = await prisma.stockItem.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Un article avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    const item = await prisma.stockItem.create({
      data: {
        name,
        category,
        unit,
        quantity,
        minQuantity,
        unitCost,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Création article impossible" },
      { status: 500 }
    );
  }
}