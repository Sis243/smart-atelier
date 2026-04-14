import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

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

      if (from) {
        where.date.gte = new Date(from);
      }

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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Balance");

    sheet.columns = [
      { header: "Code", key: "code", width: 16 },
      { header: "Compte", key: "name", width: 30 },
      { header: "Type", key: "type", width: 18 },
      { header: "DÃ©bit", key: "debit", width: 14 },
      { header: "CrÃ©dit", key: "credit", width: 14 },
      { header: "Solde", key: "balance", width: 14 },
    ];

    let totalDebit = 0;
    let totalCredit = 0;
    let totalBalance = 0;

    accounts.forEach((account: any) => {
      const debit = account.entries.reduce(
        (sum: number, entry: any) => sum + Number(entry.debit || 0),
        0
      );

      const credit = account.entries.reduce(
        (sum: number, entry: any) => sum + Number(entry.credit || 0),
        0
      );

      const balance = debit - credit;

      totalDebit += debit;
      totalCredit += credit;
      totalBalance += balance;

      sheet.addRow({
        code: account.code,
        name: account.name,
        type: account.type,
        debit,
        credit,
        balance,
      });
    });

    sheet.addRow({});

    const totalRow = sheet.addRow({
      code: "TOTAL",
      debit: totalDebit,
      credit: totalCredit,
      balance: totalBalance,
    });

    sheet.getRow(1).font = { bold: true };
    totalRow.font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="balance-comptable.xlsx"',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error ? e.message : "Export Excel balance impossible",
      },
      { status: 500 }
    );
  }
}
