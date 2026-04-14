import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function POST(_: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String((session as any)?.user?.id ?? "");
    const conversationId = ctx.params.id;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
    }

    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
    }

    await prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}