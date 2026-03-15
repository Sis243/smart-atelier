import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/authz";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await requirePermission(user.id, "CHAT_VIEW");

    const body = await req.json();
    const messageId = body?.messageId;
    const action = body?.action; // "DELIVERED" | "READ"
    if (!messageId || !action) return NextResponse.json({ error: "messageId + action required" }, { status: 400 });

    const receipt = await prisma.messageReceipt.update({
      where: { messageId_userId: { messageId, userId: user.id } },
      data: action === "READ" ? { readAt: new Date(), deliveredAt: new Date() } : { deliveredAt: new Date() },
    });

    // Update message status if all read
    const allReceipts = await prisma.messageReceipt.findMany({ where: { messageId } });
    const allRead = allReceipts.length > 0 && allReceipts.every((r) => r.readAt);
    const allDelivered = allReceipts.length > 0 && allReceipts.every((r) => r.deliveredAt);

    await prisma.message.update({
      where: { id: messageId },
      data: { status: allRead ? "READ" : allDelivered ? "DELIVERED" : "SENT" },
    });

    return NextResponse.json(receipt);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
