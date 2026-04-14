import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET() {
  try {
    const perms = await prisma.permission.findMany({
      orderBy: { key: "asc" },
      select: { id: true, key: true, label: true },
    });

    return NextResponse.json(perms);
  } catch (e) {
    console.error("[GET /api/permissions]", e);
    return NextResponse.json(
      { error: "Erreur chargement permissions" },
      { status: 500 }
    );
  }
}
