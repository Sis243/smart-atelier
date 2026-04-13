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

    const [entries, invoices, expenses, payments] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        include: { account: true },
        orderBy: { date: "asc" },
      }),
      prisma.invoice.findMany({
        where: from || to ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
          },
        } : undefined,
      }),
      prisma.expense.findMany({
        where: from || to ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
          },
        } : undefined,
      }),
      prisma.payment.findMany({
        where: from || to ? {
          paidAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
          },
        } : undefined,
      }),
    ]);

    const totalDebit = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + Number(e.credit || 0), 0);

    const invoiceIssued = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const invoicePaid = invoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalPayments = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

    return NextResponse.json({
      ok: true,
      summary: {
        totalDebit,
        totalCredit,
        invoiceIssued,
        invoicePaid,
        totalExpenses,
        totalPayments,
        netCash: totalPayments - totalExpenses,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur rÃ©sumÃ© comptable" },
      { status: 500 }
    );
  }
}