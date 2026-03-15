export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const stepStatus = searchParams.get("status")?.trim() || "";

  const where: any = {
    sentToCuttingAt: { not: null }, // ✅ only orders sent to cut
  };

  if (q) where.code = { contains: q, mode: "insensitive" };
  if (stepStatus) where.cut = { is: { status: stepStatus } };

  const orders = await prisma.order.findMany({
    where,
    orderBy: [{ sentToCuttingAt: "desc" }, { createdAt: "desc" }],
    include: {
      customer: true,
      cut: true,
    },
    take: 80,
  });

  return NextResponse.json({ ok: true, orders });
}
