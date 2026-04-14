export const dynamic = "force-dynamic";

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(_: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  const now = new Date();

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });

  await prisma.order.update({
    where: { id },
    data: { sentToCuttingAt: now },
  });

  await prisma.cutStep.upsert({
    where: { orderId: id },
    create: { orderId: id, status: "EN_ATTENTE" as any },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
