import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

async function getMember(conversationId: string) {
  const session = await getServerSession(authOptions);
  const userId = String((session as any)?.user?.id ?? "");

  if (!userId) {
    return {
      ok: false as const,
      userId,
      response: NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 }),
    };
  }

  const member = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
    select: { id: true },
  });

  if (!member) {
    return {
      ok: false as const,
      userId,
      response: NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 }),
    };
  }

  return { ok: true as const, userId };
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    const conversationId = ctx.params.id;
    const auth = await getMember(conversationId);
    if (!auth.ok) return auth.response;

    const since = new Date(Date.now() - 8000);
    const items = await prisma.conversationTyping.findMany({
      where: {
        conversationId,
        userId: { not: auth.userId },
        updatedAt: { gte: since },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Statut écriture impossible" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const conversationId = ctx.params.id;
    const auth = await getMember(conversationId);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const active = body.active !== false;

    if (!active) {
      await prisma.conversationTyping.deleteMany({
        where: {
          conversationId,
          userId: auth.userId,
        },
      });

      return NextResponse.json({ ok: true, active: false });
    }

    const item = await prisma.conversationTyping.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: auth.userId,
        },
      },
      create: {
        conversationId,
        userId: auth.userId,
      },
      update: {},
    });

    return NextResponse.json({ ok: true, active: true, item });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Statut écriture impossible" },
      { status: 500 }
    );
  }
}
