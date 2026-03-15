import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/authz";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await requirePermission(user.id, "NOTIFICATIONS_VIEW");

    const items = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(items);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await requirePermission(user.id, "NOTIFICATIONS_MANAGE");

    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
