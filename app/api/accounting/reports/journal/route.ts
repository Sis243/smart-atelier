import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: {
        account: true,
        order: true,
        invoice: true,
        expense: true,
        payment: true,
      },
      take: 500,
    });

    return NextResponse.json({ ok: true, entries });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}