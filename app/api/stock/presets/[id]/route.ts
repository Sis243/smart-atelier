import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {

  try {
    const body = await req.json().catch(() => ({}));

    const name = toStr(body.name);
    const category = toStr(body.category) || null;
    const unit = toStr(body.unit) || null;
    const minQuantity = Number(body.minQuantity ?? 0);
    const unitCost = Number(body.unitCost ?? 0);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Nom preset requis" },
        { status: 400 }
      );
    }

    const preset = await prisma.stockPreset.update({
      where: { id: params.id },
      data: {
        name,
        category,
        unit,
        minQuantity,
        unitCost,
      },
    });

    return NextResponse.json({ ok: true, preset });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Modification preset impossible" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {

  try {
    await prisma.stockPreset.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Suppression preset impossible" },
      { status: 500 }
    );
  }
}