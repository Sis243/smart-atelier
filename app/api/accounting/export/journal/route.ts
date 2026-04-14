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

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: {
        account: true,
      },
      take: 5000,
    });

    const csv = toCsv(
      ["Date", "Code compte", "Compte", "LibellÃ©", "DÃ©bit", "CrÃ©dit", "Devise"],
      entries.map((e) => [
        new Date(e.date).toLocaleString("fr-FR"),
        e.account.code,
        e.account.name,
        e.label,
        e.debit,
        e.credit,
        e.currency,
      ])
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="journal-comptable.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Export journal impossible" },
      { status: 500 }
    );
  }
}