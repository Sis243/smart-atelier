import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { QUALITY_ROLES } from "@/lib/role-permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireRole(QUALITY_ROLES);
  if (!guard.ok) return guard.response;

  try {
    const rows = await prisma.qualityStep.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        order: {
          include: {
            customer: true,
            production: true,
          },
        },
        responsible: true,
      },
      take: 200,
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur liste qualité" },
      { status: 500 }
    );
  }
}