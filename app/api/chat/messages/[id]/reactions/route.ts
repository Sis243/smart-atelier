import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_REACTIONS = new Set(["👍", "❤️", "✅", "🔥", "👏"]);

function toStr(value: unknown) {
  return String(value ?? "").trim();
}

async function getUserId() {
  const session = await getServerSession(authOptions);
  return String((session as any)?.user?.id ?? "");
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const emoji = toStr(body.emoji);

    if (!ALLOWED_REACTIONS.has(emoji)) {
      return NextResponse.json({ ok: false, error: "Réaction invalide" }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: ctx.params.id },
      select: {
        id: true,
        conversationId: true,
      },
    });

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message introuvable" }, { status: 404 });
    }

    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId: message.conversationId,
        userId,
      },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
    }

    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: message.id,
          userId,
          emoji,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, active: false });
    }

    const reaction = await prisma.messageReaction.create({
      data: {
        messageId: message.id,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, active: true, reaction });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Réaction impossible" },
      { status: 500 }
    );
  }
}
