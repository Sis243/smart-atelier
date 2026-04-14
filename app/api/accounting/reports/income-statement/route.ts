import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        entries: {
          select: {
            debit: true,
            credit: true,
          },
        },
      },
    });

    let revenue = 0;
    let expense = 0;

    for (const account of accounts) {
      const debit = account.entries.reduce((s, e) => s + Number(e.debit || 0), 0);
      const credit = account.entries.reduce((s, e) => s + Number(e.credit || 0), 0);

      if (account.code.startsWith("7")) {
        revenue += credit - debit;
      }

      if (account.code.startsWith("6")) {
        expense += debit - credit;
      }
    }

    return NextResponse.json({
      ok: true,
      report: {
        revenue,
        expense,
        netResult: revenue - expense,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur compte de rÃ©sultat" },
      { status: 500 }
    );
  }
}