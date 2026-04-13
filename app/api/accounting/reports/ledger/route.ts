import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!accountId) {
      return NextResponse.json(
        { ok: false, error: "accountId requis" },
        { status: 400 }
      );
    }

    const where: any = { accountId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, code: true, name: true, type: true },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: "Compte introuvable" },
        { status: 404 }
      );
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: {
        order: true,
        invoice: true,
        expense: true,
        payment: true,
      },
      take: 500,
    });

    let runningBalance = 0;

    const rows = entries.map((e) => {
      runningBalance += Number(e.debit || 0) - Number(e.credit || 0);

      return {
        id: e.id,
        date: e.date,
        label: e.label,
        debit: e.debit,
        credit: e.credit,
        currency: e.currency,
        balance: runningBalance,
      };
    });

    return NextResponse.json({ ok: true, account, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}