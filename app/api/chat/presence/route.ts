import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET() {
  try {
    const items = await prisma.userPresence.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur présence" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = String((session as any)?.user?.id ?? "");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const status = ["ONLINE", "AWAY", "OFFLINE"].includes(toStr(body.status).toUpperCase())
      ? toStr(body.status).toUpperCase()
      : "ONLINE";
    const device = toStr(body.device) || null;

    const item = await prisma.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        status: status as any,
        device,
        lastSeenAt: new Date(),
        lastPingAt: new Date(),
      },
      update: {
        status: status as any,
        device,
        lastSeenAt: new Date(),
        lastPingAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur présence" },
      { status: 500 }
    );
  }
}