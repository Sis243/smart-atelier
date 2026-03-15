import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/authz";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await requirePermission(user.id, "CHAT_VIEW");

    const convId = req.nextUrl.searchParams.get("conversationId");
    if (!convId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

    // must be member
    const isMember = await prisma.conversationMember.findFirst({
      where: { conversationId: convId, userId: user.id },
    });
    if (!isMember) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const msgs = await prisma.message.findMany({
      where: { conversationId: convId },
      include: { sender: true, receipts: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json(msgs);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await requirePermission(user.id, "CHAT_SEND");

    const body = await req.json();
    const conversationId = body?.conversationId;
    const text = typeof body?.text === "string" ? body.text : null;

    if (!conversationId || (!text && !body?.fileUrl)) {
      return NextResponse.json({ error: "conversationId + text/file required" }, { status: 400 });
    }

    const members = await prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    const isMember = members.some((m) => m.userId === user.id);
    if (!isMember) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        type: body?.fileUrl ? "FILE" : "TEXT",
        text,
        fileUrl: body?.fileUrl ?? null,
        fileName: body?.fileName ?? null,
        fileSize: body?.fileSize ?? null,
        entity: body?.entity ?? null,
        entityId: body?.entityId ?? null,
        status: "SENT",
        receipts: {
          create: members
            .filter((m) => m.userId !== user.id)
            .map((m) => ({ userId: m.userId, deliveredAt: null, readAt: null })),
        },
      },
      include: { sender: true, receipts: true },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Notification to other members
    await prisma.notification.createMany({
      data: members
        .filter((m) => m.userId !== user.id)
        .map((m) => ({
          userId: m.userId,
          type: "MESSAGE",
          title: "Nouveau message",
          body: text ?? "Fichier envoyé",
          entity: "Conversation",
          entityId: conversationId,
          url: `/dashboard/messages?conversationId=${conversationId}`,
        })),
    });

    return NextResponse.json(msg, { status: 201 });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
