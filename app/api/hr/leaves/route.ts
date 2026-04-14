import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET() {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        employee: true,
      },
      take: 100,
    });

    return NextResponse.json({ ok: true, leaves });
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

    const employeeId = toStr(body.employeeId);
    const reason = toStr(body.reason) || null;
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const created = await prisma.leaveRequest.create({
      data: {
        employeeId,
        reason,
        startDate,
        endDate,
        status: "EN_ATTENTE",
      },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}