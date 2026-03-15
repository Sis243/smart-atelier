import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/authz";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await requirePermission(user.id, "CHAT_VIEW");

    const convs = await prisma.conversation.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: { include: { user: true } },
      },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(convs);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await requirePermission(user.id, "CHAT_MANAGE_GROUPS");

    const body = await req.json();
    const type = body?.type === "GROUP" ? "GROUP" : "DIRECT";
    const title = typeof body?.title === "string" ? body.title : null;
    const memberIds: string[] = Array.isArray(body?.memberIds) ? body.memberIds : [];

    if (type === "DIRECT" && memberIds.length !== 1) {
      return NextResponse.json({ error: "DIRECT needs exactly 1 other memberId" }, { status: 400 });
    }
    if (type === "GROUP" && memberIds.length < 2) {
      return NextResponse.json({ error: "GROUP needs at least 2 memberIds" }, { status: 400 });
    }

    const conv = await prisma.conversation.create({
      data: {
        type,
        title,
        createdById: user.id,
        members: {
          create: [
            { userId: user.id, role: "ADMIN" },
            ...memberIds.map((id) => ({ userId: id })),
          ],
        },
      },
      include: { members: true },
    });

    return NextResponse.json(conv, { status: 201 });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
