import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String((session as any)?.user?.id ?? "");
    const id = ctx.params.id;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const text = toStr(body.text);

    const current = await prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        senderId: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Message introuvable" },
        { status: 404 }
      );
    }

    if (current.senderId !== userId) {
      return NextResponse.json(
        { ok: false, error: "Modification refusée" },
        { status: 403 }
      );
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        text,
      },
    });

    return NextResponse.json({ ok: true, message: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Modification impossible" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  ctx: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String((session as any)?.user?.id ?? "");
    const id = ctx.params.id;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const current = await prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        senderId: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        { ok: false, error: "Message introuvable" },
        { status: 404 }
      );
    }

    if (current.senderId !== userId) {
      return NextResponse.json(
        { ok: false, error: "Suppression refusée" },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Suppression impossible" },
      { status: 500 }
    );
  }
}