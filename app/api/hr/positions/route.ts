import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, positions });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = toStr(body.name);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Nom du poste requis" },
        { status: 400 }
      );
    }

    const created = await prisma.position.create({
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, position: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "CrÃ©ation impossible" },
      { status: 500 }
    );
  }
}