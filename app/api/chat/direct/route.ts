import { NextResponse } from "next/server";
import { ConversationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

function toStr(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String((session as any)?.user?.id ?? "");

    if (!currentUserId) {
      return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = toStr(body.userId);

    if (!targetUserId) {
      return NextResponse.json({ ok: false, error: "Utilisateur requis" }, { status: 400 });
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json({ ok: false, error: "Conversation avec soi-même impossible" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true },
    });

    if (!targetUser?.isActive) {
      return NextResponse.json({ ok: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    const myDirectMemberships = await prisma.conversationMember.findMany({
      where: {
        userId: currentUserId,
        conversation: { type: ConversationType.DIRECT },
      },
      select: { conversationId: true },
    });

    const existing = await prisma.conversation.findFirst({
      where: {
        id: { in: myDirectMemberships.map((m) => m.conversationId) },
        type: ConversationType.DIRECT,
        members: { some: { userId: targetUserId } },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, existing: true });
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        createdById: currentUserId,
        members: {
          create: [{ userId: currentUserId }, { userId: targetUserId }],
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: conversation.id, existing: false });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Conversation directe impossible" },
      { status: 500 }
    );
  }
}
