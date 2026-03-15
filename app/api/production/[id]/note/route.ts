import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = toStr(ctx.params.id);
    if (!orderId) return NextResponse.json({ ok: false, error: "id requis" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const note = toStr(body.note);

    const step = await prisma.productionStep.upsert({
      where: { orderId },
      create: { orderId, status: "EN_ATTENTE" as any, note },
      update: { note },
      select: { id: true, note: true, orderId: true },
    });

    return NextResponse.json({ ok: true, step });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
