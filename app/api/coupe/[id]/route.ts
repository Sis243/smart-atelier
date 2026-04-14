export const dynamic = "force-dynamic";

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type StepStatus = "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "REJETE";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = ctx.params.id;
    const body = await req.json();
    const status = String(body?.status ?? "").trim() as StepStatus;

    if (!["EN_ATTENTE", "EN_COURS", "TERMINE", "REJETE"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Statut invalide" }, { status: 400 });
    }

    const now = new Date();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, sentToCuttingAt: true },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });
    }

    // ✅ upsert cut step
    await prisma.cutStep.upsert({
      where: { orderId },
      create: {
        orderId,
        status,
        receivedAt: now,
        startedAt: status === "EN_COURS" ? now : null,
        finishedAt: status === "TERMINE" ? now : null,
      },
      update: {
        status,
        receivedAt: { set: undefined }, // ne force pas
        startedAt: status === "EN_COURS" ? now : undefined,
        finishedAt: status === "TERMINE" ? now : undefined,
      },
    });

    // ✅ optionnel: si la coupe “reçoit”, on fixe cuttingReceivedAt une seule fois
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cuttingReceivedAt: order.sentToCuttingAt ? now : undefined,
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
