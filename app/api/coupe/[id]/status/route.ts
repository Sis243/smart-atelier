import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const body = await req.json();
  const next = String(body.status || "").trim();

  if (!["EN_ATTENTE", "EN_COURS", "TERMINE", "REJETE"].includes(next)) {
    return NextResponse.json({ ok: false, error: "Statut invalide" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, sentToCuttingAt: true },
  });

  if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });
  if (!order.sentToCuttingAt) return NextResponse.json({ ok: false, error: "Non envoyée à la coupe" }, { status: 403 });

  const now = new Date();

  const cut = await prisma.cutStep.upsert({
    where: { orderId: id },
    create: {
      orderId: id,
      status: next as any,
      receivedAt: now,
      startedAt: next === "EN_COURS" ? now : null,
      finishedAt: next === "TERMINE" ? now : null,
    },
    update: {
      status: next as any,
      receivedAt: now,
      startedAt: next === "EN_COURS" ? now : undefined,
      finishedAt: next === "TERMINE" ? now : undefined,
    },
  });

  await prisma.order.update({
    where: { id },
    data: { cuttingReceivedAt: now },
  });

  return NextResponse.json({ ok: true, cut });
}
