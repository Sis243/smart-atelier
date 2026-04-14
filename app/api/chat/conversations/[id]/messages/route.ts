import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

async function getMember(conversationId: string) {
  const session = await getServerSession(authOptions);
  const userId = String((session as any)?.user?.id ?? "");

  if (!userId) return { ok: false as const, userId, response: NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 }) };

  const member = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
    select: { id: true },
  });

  if (!member) return { ok: false as const, userId, response: NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 }) };

  return { ok: true as const, userId };
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const conversationId = ctx.params.id;
    const auth = await getMember(conversationId);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const parentId = toStr(searchParams.get("parentId")) || null;

    const messages = await prisma.message.findMany({
      where: { conversationId, parentId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, messages });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const conversationId = ctx.params.id;
    const auth = await getMember(conversationId);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const text = toStr(body.text);
    const fileUrl = toStr(body.fileUrl) || null;
    const fileName = toStr(body.fileName) || null;
    const parentId = toStr(body.parentId) || null;

    if (!text && !fileUrl) {
      return NextResponse.json({ ok: false, error: "Message vide" }, { status: 400 });
    }

    if (parentId) {
      const parent = await prisma.message.findFirst({
        where: { id: parentId, conversationId },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json({ ok: false, error: "Message parent introuvable" }, { status: 404 });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: auth.userId,
        parentId,
        type: fileUrl ? "FILE" : "TEXT",
        text: text || null,
        fileUrl,
        fileName,
        status: "SENT",
      },
      include: {
        sender: true,
        reactions: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    await prisma.conversationTyping.deleteMany({
      where: {
        conversationId,
        userId: auth.userId,
      },
    });

    const members = await prisma.conversationMember.findMany({
      where: {
        conversationId,
        userId: { not: auth.userId },
      },
      select: { userId: true },
    });

    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        type: "MESSAGE",
        title: parentId ? "Nouvelle réponse" : "Nouveau message",
        body: text || fileName || "Pièce jointe",
        entity: "Conversation",
        entityId: conversationId,
        url: `/dashboard/chat`,
      })),
    });

    return NextResponse.json({ ok: true, message });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Envoi impossible" },
      { status: 500 }
    );
  }
}
