import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  try {
    const [
      usersCount,
      customersCount,
      ordersCount,
      stockItemsCount,
      unreadNotificationsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.stockItem.count(),
      prisma.notification.count({
        where: {
          userId: guard.auth.userId,
          readAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        usersCount,
        customersCount,
        ordersCount,
        stockItemsCount,
        unreadNotificationsCount,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur dashboard" },
      { status: 500 }
    );
  }
}