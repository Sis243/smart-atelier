export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const now = new Date();

  const orders = await prisma.order.findMany({
    where: { sentToCuttingAt: null },
    select: { id: true },
    take: 200,
  });

  for (const o of orders) {
    await prisma.order.update({ where: { id: o.id }, data: { sentToCuttingAt: now } });
    await prisma.cutStep.upsert({
      where: { orderId: o.id },
      create: { orderId: o.id, status: "EN_ATTENTE" as any },
      update: {},
    });
  }

  return NextResponse.json({ ok: true, count: orders.length });
}
