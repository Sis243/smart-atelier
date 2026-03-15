import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const device = typeof body?.device === "string" ? body.device : "web";

    const now = new Date();
    await prisma.userPresence.upsert({
      where: { userId: user.id },
      update: { status: "ONLINE", lastPingAt: now, lastSeenAt: now, device },
      create: { userId: user.id, status: "ONLINE", lastPingAt: now, lastSeenAt: now, device },
    });

    return NextResponse.json({ ok: true, at: now.toISOString() });
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
