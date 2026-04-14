export const dynamic = "force-dynamic";

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guards";

export async function POST() {
  const guard = await requireRole(["SUPERADMIN", "ADMIN"]);
  if (!guard.ok) return guard.response;

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
