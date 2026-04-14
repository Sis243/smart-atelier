import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const guard = await requireUser();

    if (!guard.ok) {
      return guard.response;
    }

    const body = await req.json().catch(() => ({}));
    const device = typeof body?.device === "string" ? body.device : "web";

    const now = new Date();

    await prisma.userPresence.upsert({
      where: { userId: guard.auth.userId },
      update: {
        status: "ONLINE",
        lastPingAt: now,
        lastSeenAt: now,
        device,
      },
      create: {
        userId: guard.auth.userId,
        status: "ONLINE",
        lastPingAt: now,
        lastSeenAt: now,
        device,
      },
    });

    return NextResponse.json({
      ok: true,
      at: now.toISOString(),
    });
  } catch (e: any) {
    console.error("POST /api/presence/ping error:", e);

    return NextResponse.json(
      {
        ok: false,
        error: "Erreur serveur lors du ping de présence.",
      },
      { status: 500 }
    );
  }
}