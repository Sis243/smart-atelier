import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export async function GET() {
  const guard = await requireRole(["SUPERADMIN", "ADMIN", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const rows = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
      take: 300,
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur journal d’activité" },
      { status: 500 }
    );
  }
}