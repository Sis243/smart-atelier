import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const phone = toStr(body.phone) || null;
    const email = toStr(body.email) || null;
    const address = toStr(body.address) || null;

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Nom fournisseur requis" },
        { status: 400 }
      );
    }

    const supplier = await prisma.stockSupplier.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        email,
        address,
      },
    });

    return NextResponse.json({ ok: true, supplier });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Modification fournisseur impossible" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {

  try {
    await prisma.stockSupplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Suppression fournisseur impossible" },
      { status: 500 }
    );
  }
}