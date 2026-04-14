import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/export-csv";

export const dynamic = "force-dynamic";

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

    const accounts = await prisma.account.findMany({
      orderBy: { code: "asc" },
      include: {
        entries: {
          where,
          select: {
            debit: true,
            credit: true,
          },
        },
      },
    });

    const rows = accounts.map((a) => {
      const totalDebit = a.entries.reduce((s, e) => s + Number(e.debit || 0), 0);
      const totalCredit = a.entries.reduce((s, e) => s + Number(e.credit || 0), 0);
      return [
        a.code,
        a.name,
        a.type,
        totalDebit,
        totalCredit,
        totalDebit - totalCredit,
      ];
    });

    const csv = toCsv(
      ["Code", "Compte", "Type", "DÃ©bit", "CrÃ©dit", "Solde"],
      rows
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="balance-comptable.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Export balance impossible" },
      { status: 500 }
    );
  }
}