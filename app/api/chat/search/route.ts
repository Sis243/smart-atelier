import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String((session as any)?.user?.id ?? "");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") ?? "").trim();

    if (!q) {
      return NextResponse.json({ ok: true, messages: [] });
    }

    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = memberships.map((m) => m.conversationId);

    const messages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        text: {
          contains: q,
          mode: "insensitive",
        },
      },
      include: {
        sender: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, messages });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Recherche impossible" },
      { status: 500 }
    );
  }
}