import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET() {

  try {
    const prismaAny = prisma as any;

    const rows = await prismaAny.attendance.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      take: 100,
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur lecture prÃ©sences" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {
    const prismaAny = prisma as any;
    const body = await req.json();

    const employeeId = toStr(body.employeeId);
    const note = toStr(body.note ?? body.notes) || null;
    const statusRaw = toStr(body.status).toUpperCase();
    const dateRaw = toStr(body.date);

    const allowed = ["PRESENT", "ABSENT", "RETARD", "CONGE"];
    const status = allowed.includes(statusRaw) ? statusRaw : null;

    if (!employeeId) {
      return NextResponse.json(
        { ok: false, error: "EmployÃ© requis" },
        { status: 400 }
      );
    }

    if (!dateRaw) {
      return NextResponse.json(
        { ok: false, error: "Date requise" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { ok: false, error: "Statut invalide" },
        { status: 400 }
      );
    }

    const existing = await prismaAny.attendance.findFirst({
      where: {
        employeeId,
        date: new Date(dateRaw),
      },
      select: { id: true },
    });

    if (existing) {
      const updated = await prismaAny.attendance.update({
        where: { id: existing.id },
        data: {
          status,
          note,
        },
        select: { id: true },
      });

      return NextResponse.json({ ok: true, id: updated.id, updated: true });
    }

    const created = await prismaAny.attendance.create({
      data: {
        employeeId,
        date: new Date(dateRaw),
        status,
        note,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Enregistrement impossible" },
      { status: 500 }
    );
  }
}
