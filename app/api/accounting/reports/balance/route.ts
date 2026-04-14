import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const entryWhere: any = {};

    if (from || to) {
      entryWhere.date = {};
      if (from) entryWhere.date.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        entryWhere.date.lte = end;
      }
    }

    const accounts = await prisma.account.findMany({
      orderBy: [{ code: "asc" }],
      include: {
        entries: {
          where: entryWhere,
        },
      },
    });

    const rows = accounts.map((account) => {
      const totalDebit = account.entries.reduce(
        (sum, entry) => sum + Number(entry.debit ?? 0),
        0
      );
      const totalCredit = account.entries.reduce(
        (sum, entry) => sum + Number(entry.credit ?? 0),
        0
      );

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
      };
    });

    const totals = rows.reduce(
      (acc, row) => ({
        totalDebit: acc.totalDebit + row.totalDebit,
        totalCredit: acc.totalCredit + row.totalCredit,
        balance: acc.balance + row.balance,
      }),
      { totalDebit: 0, totalCredit: 0, balance: 0 }
    );

    return NextResponse.json({ ok: true, rows, totals });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Impossible de générer la balance" },
      { status: 500 }
    );
  }
}
