import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { DELIVERY_ROLES } from "@/lib/role-permissions";

export async function GET() {
  const guard = await requireRole(DELIVERY_ROLES);
  if (!guard.ok) return guard.response;

  try {
    const rows = await prisma.deliveryStep.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        order: {
          include: {
            customer: true,
            quality: true,
          },
        },
        responsible: true,
      },
      take: 200,
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur liste livraison" },
      { status: 500 }
    );
  }
}