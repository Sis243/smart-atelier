import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {

  try {
    const item = await prisma.stockItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Article introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur lecture article" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {

  try {
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.category !== undefined)
      data.category = body.category ? String(body.category).trim() : null;
    if (body.unit !== undefined)
      data.unit = body.unit ? String(body.unit).trim() : null;

    if (body.minQuantity !== undefined) {
      const v = Number(body.minQuantity);
      if (!Number.isFinite(v) || v < 0) {
        return NextResponse.json(
          { ok: false, error: "Seuil min invalide" },
          { status: 400 }
        );
      }
      data.minQuantity = v;
    }

    if (body.unitCost !== undefined) {
      const v = Number(body.unitCost);
      if (!Number.isFinite(v) || v < 0) {
        return NextResponse.json(
          { ok: false, error: "Coût unitaire invalide" },
          { status: 400 }
        );
      }
      data.unitCost = v;
    }

    const item = await prisma.stockItem.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Mise à jour impossible" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {

  try {
    await prisma.stockItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Suppression impossible" },
      { status: 500 }
    );
  }
}