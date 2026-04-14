import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, departments });
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
        { ok: false, error: "Nom du dÃ©partement requis" },
        { status: 400 }
      );
    }

    const created = await prisma.department.create({
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, department: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "CrÃ©ation impossible" },
      { status: 500 }
    );
  }
}