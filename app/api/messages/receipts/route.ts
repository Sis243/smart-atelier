import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/guards";

export async function PATCH(req: NextRequest) {
  const authGuard = await requireUser();
  if (!authGuard.ok) return authGuard.response;

  const permGuard = await requirePermission("chat.view");
  if (!permGuard.ok) return permGuard.response;

  try {
    const userId = authGuard.auth.userId;
    const body = await req.json();

    const messageIds = Array.isArray(body?.messageIds)
      ? body.messageIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];

    if (messageIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Aucun message sélectionné" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        conversation: {
          members: {
            some: { userId },
          },
        },
      },
      select: {
        id: true,
      },
    });

    const validMessageIds = messages.map((m) => m.id);

    if (validMessageIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Aucun message autorisé" },
        { status: 404 }
      );
    }

    await prisma.$transaction(
      validMessageIds.map((messageId) =>
        prisma.messageReceipt.upsert({
          where: {
            messageId_userId: {
              messageId,
              userId,
            },
          },
          update: {
            readAt: new Date(),
            deliveredAt: new Date(),
          },
          create: {
            messageId,
            userId,
            deliveredAt: new Date(),
            readAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({
      ok: true,
      updatedCount: validMessageIds.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Mise à jour des reçus impossible" },
      { status: 500 }
    );
  }
}