import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const body = await req.json();

    const statusRaw = toStr(body.status).toUpperCase();
    const status = ["EN_ATTENTE", "APPROUVE", "REJETE"].includes(statusRaw)
      ? statusRaw
      : null;

    if (!status) {
      return NextResponse.json(
        { ok: false, error: "Statut invalide" },
        { status: 400 }
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: status as any,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, leave: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}