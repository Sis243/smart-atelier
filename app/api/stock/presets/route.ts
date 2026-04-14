import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {

  try {
    const presets = await prisma.stockPreset.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, presets });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur presets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Nom requis" },
        { status: 400 }
      );
    }

    const category = body.category ? String(body.category).trim() : null;
    const unit = body.unit ? String(body.unit).trim() : null;
    const minQuantity = Number(body.minQuantity ?? 0);
    const unitCost = Number(body.unitCost ?? 0);

    const preset = await prisma.stockPreset.upsert({
      where: { name },
      update: { category, unit, minQuantity, unitCost },
      create: { name, category, unit, minQuantity, unitCost },
    });

    return NextResponse.json({ ok: true, preset });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Création preset impossible" },
      { status: 500 }
    );
  }
}