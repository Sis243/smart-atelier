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

    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    for (const account of accounts) {
      const debit = account.entries.reduce((s, e) => s + Number(e.debit || 0), 0);
      const credit = account.entries.reduce((s, e) => s + Number(e.credit || 0), 0);
      const balance = debit - credit;

      if (account.code.startsWith("1") || account.code.startsWith("2") || account.code.startsWith("3") || account.code.startsWith("5")) {
        assets += balance;
      } else if (account.code.startsWith("4")) {
        liabilities += credit - debit;
      } else if (account.code.startsWith("8")) {
        equity += credit - debit;
      }
    }

    return NextResponse.json({
      ok: true,
      report: {
        assets,
        liabilities,
        equity,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur bilan" },
      { status: 500 }
    );
  }
}