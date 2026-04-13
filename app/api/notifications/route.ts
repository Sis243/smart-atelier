import { NextResponse } from "next/server";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  try {
    const items = await prisma.notification.findMany({
      where: { userId: guard.auth.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const unreadCount = items.filter((i) => !i.readAt).length;

    return NextResponse.json({
      ok: true,
      items,
      unreadCount,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur notifications" },
      { status: 500 }
    );
  }
}