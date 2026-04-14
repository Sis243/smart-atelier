import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ConversationType } from "@prisma/client";

export const dynamic = "force-dynamic";

type SessionUser = {
  id?: string;
};

type SessionShape = {
  user?: SessionUser;
} | null;

function toStr(v: unknown): string {
  return String(v ?? "").trim();
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as SessionShape;
    const userId = String(session?.user?.id ?? "");

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
          },
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
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    });

    const formatted = await Promise.all(conversations.map(async (c) => {
      const me = c.members.find(
        (m: (typeof c.members)[number]) => m.userId === userId
      );

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          ...(me?.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}),
        },
      });

      return {
        ...c,
        unreadCount,
        myLastReadAt: me?.lastReadAt ?? null,
      };
    }));

    return NextResponse.json({ ok: true, conversations: formatted });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur serveur",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionShape;
    const userId = String(session?.user?.id ?? "");

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body: {
      title?: unknown;
      type?: unknown;
      memberIds?: unknown;
    } = await req.json();

    const title = toStr(body.title) || null;

    const type: ConversationType =
      toStr(body.type).toUpperCase() === "GROUP"
        ? ConversationType.GROUP
        : ConversationType.DIRECT;

    const memberIds: string[] = Array.isArray(body.memberIds)
      ? body.memberIds.map((x: unknown): string => String(x))
      : [];

    const filteredMemberIds: string[] = memberIds.filter(
      (x: string): boolean => Boolean(x)
    );

    const uniqueMemberIds: string[] = Array.from(
      new Set<string>([userId, ...filteredMemberIds])
    );

    const created = await prisma.conversation.create({
      data: {
        title,
        type,
        createdById: userId,
        members: {
          create: uniqueMemberIds.map(
            (id: string): { userId: string } => ({
              userId: id,
            })
          ),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Création impossible",
      },
      { status: 500 }
    );
  }
}
