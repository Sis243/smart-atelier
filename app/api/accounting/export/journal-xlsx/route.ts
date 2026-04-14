import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: {
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

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
      include: { account: true },
      take: 5000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Smart Atelier";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Journal");
    sheet.columns = [
      { header: "Date", key: "date", width: 22 },
      { header: "Code compte", key: "code", width: 16 },
      { header: "Compte", key: "account", width: 34 },
      { header: "Libellé", key: "label", width: 42 },
      { header: "Débit", key: "debit", width: 14 },
      { header: "Crédit", key: "credit", width: 14 },
      { header: "Devise", key: "currency", width: 10 },
    ];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      totalDebit += Number(entry.debit || 0);
      totalCredit += Number(entry.credit || 0);

      sheet.addRow({
        date: new Date(entry.date).toLocaleString("fr-FR"),
        code: entry.account.code,
        account: entry.account.name,
        label: entry.label,
        debit: Number(entry.debit || 0),
        credit: Number(entry.credit || 0),
        currency: entry.currency,
      });
    }

    sheet.addRow({});
    const totalRow = sheet.addRow({
      code: "TOTAL",
      debit: totalDebit,
      credit: totalCredit,
    });

    sheet.getRow(1).font = { bold: true };
    totalRow.font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getColumn("debit").numFmt = "#,##0.00";
    sheet.getColumn("credit").numFmt = "#,##0.00";

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="journal-comptable.xlsx"',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error ? e.message : "Export Excel journal impossible",
      },
      { status: 500 }
    );
  }
}
