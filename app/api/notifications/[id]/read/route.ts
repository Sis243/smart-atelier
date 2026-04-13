import { NextResponse } from "next/server";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, ctx: { params: { id: string } }) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  try {
    const id = ctx.params.id;

    const current = await prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Notification introuvable" },
        { status: 404 }
      );
    }

    if (current.userId !== guard.auth.userId) {
      return NextResponse.json(
        { ok: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    await prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Lecture notification impossible" },
      { status: 500 }
    );
  }
}