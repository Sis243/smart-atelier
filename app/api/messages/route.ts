import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/guards";

export async function GET(req: NextRequest) {
  const authGuard = await requireUser();
  if (!authGuard.ok) return authGuard.response;

  const permGuard = await requirePermission("chat.view");
  if (!permGuard.ok) return permGuard.response;

  try {
    const userId = authGuard.auth.userId;
    const convId = req.nextUrl.searchParams.get("conversationId");

    if (!convId) {
      return NextResponse.json(
        { ok: false, error: "conversationId requis" },
        { status: 400 }
      );
    }

    const isMember = await prisma.conversationMember.findFirst({
      where: {
        conversationId: convId,
        userId,
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { ok: false, error: "Accès refusé à cette conversation" },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: convId,
      },
      include: {
        sender: true,
        receipts: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ ok: true, messages });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur chargement messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authGuard = await requireUser();
  if (!authGuard.ok) return authGuard.response;

  const permGuard = await requirePermission("chat.send");
  if (!permGuard.ok) return permGuard.response;

  try {
    const userId = authGuard.auth.userId;
    const body = await req.json();

    const conversationId = String(body?.conversationId ?? "").trim();
    const text = String(body?.text ?? "").trim();

    if (!conversationId || !text) {
      return NextResponse.json(
        { ok: false, error: "conversationId et text requis" },
        { status: 400 }
      );
    }

    const isMember = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { ok: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        text,
        type: "TEXT",
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Envoi message impossible" },
      { status: 500 }
    );
  }
}