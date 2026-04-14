import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest) {
  const authGuard = await requireUser();
  if (!authGuard.ok) return authGuard.response;

  const permGuard = await requirePermission("chat.view");
  if (!permGuard.ok) return permGuard.response;

  try {
    const userId = authGuard.auth.userId;

    const convs = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({ ok: true, conversations: convs });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur chargement conversations" },
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

    const title = String(body?.title ?? "").trim() || null;
    const type =
      String(body?.type ?? "DIRECT").trim().toUpperCase() === "GROUP"
        ? "GROUP"
        : "DIRECT";

    const memberIds = Array.isArray(body?.memberIds)
      ? body.memberIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];

    const uniqueMemberIds = Array.from(new Set([userId, ...memberIds]));

    const created = await prisma.conversation.create({
      data: {
        title,
        type: type as any,
        createdById: userId,
        members: {
          create: uniqueMemberIds.map((id) => ({ userId: id })),
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Création conversation impossible" },
      { status: 500 }
    );
  }
}