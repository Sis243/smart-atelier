import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [payments, expenses] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
    ]);

    const totalIn = Number(payments._sum.amount ?? 0);
    const totalOut = Number(expenses._sum.amount ?? 0);

    return NextResponse.json({
      ok: true,
      stats: {
        totalIn,
        totalOut,
        netCash: totalIn - totalOut,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}