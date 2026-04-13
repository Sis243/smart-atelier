import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET() {

  try {
    const suppliers = await prisma.stockSupplier.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, suppliers });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur fournisseurs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {
    const body = await req.json();

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

    const supplier = await prisma.stockSupplier.create({
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
      { ok: false, error: e?.message ?? "Création fournisseur impossible" },
      { status: 500 }
    );
  }
}